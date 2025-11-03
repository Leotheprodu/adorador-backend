import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { EventsService } from './events.service';
import { frontEndUrl } from 'config/constants';
import { forwardRef, Inject, Logger } from '@nestjs/common';
import { AuthJwtService, JwtPayload } from 'src/auth/services/jwt.service';
import {
  OptimizedLyricMessage,
  OptimizedEventSongMessage,
  compressMessage,
  isValidLyricMessage,
  isValidEventSongMessage,
  fromLegacyLyricFormat,
  fromLegacyEventSongFormat,
} from './interfaces/websocket-messages.interface';

interface AuthenticatedSocket extends Socket {
  userId?: number;
  userName?: string;
  isAuthenticated?: boolean;
}

interface CachedEventManager {
  eventManagerId: number | null;
  lastUpdated: number;
  ttl: number; // Time to live en millisegundos
}

interface RateLimitInfo {
  count: number;
  resetTime: number;
  lastMessageTime: number;
}

@WebSocketGateway({
  cors: {
    origin: frontEndUrl,
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  private readonly logger = new Logger(EventsGateway.name);

  // Optimización: Caché de mensajes
  private lastMessages: Map<string, any> = new Map();
  private messageExpiryTimes: Map<string, number> = new Map();
  private messageExpiryDuration: number = 3600000; // 1 hora

  // Optimización: Caché de permisos de administrador de evento
  private eventManagersCache: Map<number, CachedEventManager> = new Map();
  private readonly cacheDefaultTTL: number = 300000; // 5 minutos en millisegundos

  // Control de clientes conectados
  private connectedClients: Map<string, AuthenticatedSocket> = new Map();

  // Sistema de rate limiting inteligente
  private rateLimits: Map<string, RateLimitInfo> = new Map(); // key: userId:eventId
  private readonly maxMessagesPerMinute = 30; // 30 mensajes por minuto máx
  private readonly burstLimit = 5; // Máximo 5 mensajes en ráfaga
  private readonly burstWindow = 2000; // Ventana de ráfaga: 2 segundos

  constructor(
    @Inject(forwardRef(() => EventsService))
    private readonly eventsService: EventsService,
    private readonly jwtService: AuthJwtService,
  ) {
    // Limpiar caches periódicamente
    setInterval(() => this.cleanUpExpiredMessages(), 60000); // Cada minuto
    setInterval(() => this.cleanUpEventManagersCache(), 120000); // Cada 2 minutos
    setInterval(() => this.cleanUpDisconnectedClients(), 300000); // Cada 5 minutos
    setInterval(() => this.cleanUpRateLimits(), 60000); // Limpiar rate limits cada minuto
  }
  async handleConnection(client: AuthenticatedSocket) {
    try {
      this.logger.log(`Cliente conectándose: ${client.id}`);

      // Extraer token del handshake
      const token = this.extractTokenFromHandshake(client);

      if (token) {
        // Usuario logueado - puede leer Y escribir
        const user = await this.authenticateToken(token);
        if (user) {
          client.userId = user.sub;
          client.userName = user.name;
          client.isAuthenticated = true;

          this.connectedClients.set(client.id, client);
          this.logger.log(
            `Cliente autenticado: ${user.name} (${user.sub}) - Lectura/Escritura`,
          );
        } else {
          // Token inválido, pero permitir conexión como invitado
          client.isAuthenticated = false;
          this.logger.log(
            `Cliente con token inválido: ${client.id} - Solo lectura`,
          );
        }
      } else {
        // Sin token - modo invitado (solo lectura)
        client.isAuthenticated = false;
        client.userId = null;
        client.userName = 'Invitado';

        this.connectedClients.set(client.id, client);
        this.logger.log(`Cliente invitado: ${client.id} - Solo lectura`);
      }

      // IMPORTANTE: NO enviar mensajes inmediatamente al conectarse
      // Los mensajes se enviarán cuando el cliente esté listo y los solicite
      // Esto evita que se pierdan por listeners no configurados aún
      const messagesCount = this.lastMessages.size;
      this.logger.log(
        `Cliente ${client.id} conectado. ${messagesCount} mensajes disponibles para enviar cuando esté listo`,
      );

      // Enviar un evento especial indicando que la conexión está lista
      // y cuántos mensajes están disponibles
      client.emit('connection_ready', {
        messagesAvailable: messagesCount,
        userId: client.userId,
        userName: client.userName,
        isAuthenticated: client.isAuthenticated,
      });
    } catch (error) {
      this.logger.error(`Error en conexión: ${error.message}`);
      // No desconectar por error de auth - permitir modo invitado
      client.isAuthenticated = false;
      client.userId = null;
      client.userName = 'Invitado';
      this.connectedClients.set(client.id, client);
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  private extractTokenFromHandshake(
    client: AuthenticatedSocket,
  ): string | null {
    // Extraer token de los headers de autorización o query params
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // También intentar desde query params
    const tokenFromQuery = client.handshake.query?.token as string;
    return tokenFromQuery || null;
  }

  private async authenticateToken(token: string): Promise<JwtPayload | null> {
    try {
      // Verificar el token JWT
      const payload = this.jwtService.verifyAccessToken(token);
      return payload;
    } catch (error) {
      this.logger.warn(`Token inválido: ${error.message}`);
      return null;
    }
  }

  @SubscribeMessage('eventSelectedSong')
  async handleEventSelectedSong(
    @MessageBody() data: { id: string; message: any },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    return this.handleAuthenticatedMessage(
      'eventSelectedSong',
      data,
      client,
      'Selección de canción actualizada',
    );
  }

  @SubscribeMessage('lyricSelected')
  async handleLyricSelected(
    @MessageBody() data: { id: string; message: any },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    return this.handleAuthenticatedMessage(
      'lyricSelected',
      data,
      client,
      'Letra actualizada',
    );
  }

  @SubscribeMessage('request_current_state')
  handleRequestCurrentState(@ConnectedSocket() client: AuthenticatedSocket) {
    // Enviar todos los mensajes guardados al cliente que los solicita
    const messagesCount = this.lastMessages.size;
    this.logger.log(
      `Cliente ${client.id} solicita estado actual. Enviando ${messagesCount} mensajes guardados`,
    );

    this.lastMessages.forEach((message, eventName) => {
      this.logger.debug(
        `Enviando mensaje guardado: ${eventName}`,
        JSON.stringify(message),
      );
      client.emit(eventName, message);
    });

    // Confirmar que se han enviado todos los mensajes
    client.emit('current_state_sent', { messagesCount });

    if (messagesCount === 0) {
      this.logger.warn(
        `No hay mensajes guardados para enviar al cliente ${client.id}`,
      );
    }
  }

  // Método unificado optimizado para manejar mensajes con payload comprimido y rate limiting
  private async handleAuthenticatedMessage(
    messageType: string,
    data: { id: string; message: any },
    client: AuthenticatedSocket,
    successMessage: string,
  ) {
    const startTime = performance.now(); // Para métricas de rendimiento

    try {
      // Validación ultra-rápida de autenticación
      if (!client.isAuthenticated || !client.userId) {
        client.emit('error', { m: 'No auth' }); // Mensaje más corto
        return;
      }

      const eventId = parseInt(data.id);

      // Rate limiting inteligente ANTES de consultas costosas
      if (!this.checkRateLimit(client.userId, eventId, messageType)) {
        client.emit('error', { m: 'Rate limit' });
        return;
      }

      // Validación rápida de permisos usando caché
      const isAuthorized = await this.isUserEventManager(
        client.userId,
        eventId,
      );

      if (!isAuthorized) {
        client.emit('error', { m: 'No perms' }); // Mensaje comprimido
        return;
      }

      let optimizedMessage: any;

      // Optimizar mensaje según tipo
      if (messageType === 'lyricSelected') {
        // Convertir al formato optimizado si viene en formato legacy
        if (data.message.position !== undefined) {
          optimizedMessage = fromLegacyLyricFormat(data.message);
        } else {
          optimizedMessage = data.message;
        }

        // Validar mensaje optimizado
        if (!isValidLyricMessage(optimizedMessage)) {
          client.emit('error', { m: 'Invalid lyric msg' });
          return;
        }
      } else if (messageType === 'eventSelectedSong') {
        // Convertir número a formato optimizado
        optimizedMessage = fromLegacyEventSongFormat(data.message);

        if (!isValidEventSongMessage(optimizedMessage)) {
          client.emit('error', { m: 'Invalid song msg' });
          return;
        }
      } else {
        // Para otros tipos, usar el mensaje tal como viene
        optimizedMessage = data.message;
      }

      // Comprimir mensaje final
      const compressedMessage = compressMessage(
        data.id,
        optimizedMessage,
        client.userName || 'Unknown',
      );

      // Construir event name
      const eventName = `${messageType}-${data.id}`;

      // Almacenar en caché y emitir de forma optimizada
      this.storeMessage(eventName, compressedMessage);
      this.server.emit(eventName, compressedMessage);

      // ACK ultra-rápido
      client.emit('ack', {
        t: messageType,
        s: 'ok',
      });

      // Log de performance
      const duration = performance.now() - startTime;
      if (duration > 5) {
        // Solo log si toma más de 5ms
        this.logger.warn(`${messageType} tardó ${duration.toFixed(2)}ms`);
      }
    } catch (error) {
      const duration = performance.now() - startTime;
      this.logger.error(
        `Error en ${messageType} (${duration.toFixed(2)}ms): ${error.message}`,
      );
      client.emit('error', { m: 'Server err' });
    }
  }

  @SubscribeMessage('liveMessage')
  handleMusicLiveMessages(
    @MessageBody() data: { id: string; message: any },
    @ConnectedSocket() client: Socket,
  ) {
    const eventName = `liveMessage-${data.id}`;

    // CRÍTICO: Guardar mensaje para nuevos usuarios que se conecten
    this.storeMessage(eventName, data.message);

    // Emitir a todos los conectados
    this.server.emit(eventName, data.message);

    this.logger.debug(`LiveMessage guardado y emitido para evento ${data.id}`);
  }

  storeMessage(eventName: string, message: any) {
    const currentTime = Date.now();
    this.lastMessages.set(eventName, message);
    this.messageExpiryTimes.set(
      eventName,
      currentTime + this.messageExpiryDuration,
    );
  }

  getLastMessage(eventName: string) {
    return this.lastMessages.get(eventName);
  }

  // Método para debugging - ver todos los mensajes guardados
  getAllStoredMessages() {
    const messages = {};
    this.lastMessages.forEach((message, eventName) => {
      messages[eventName] = message;
    });
    return messages;
  }

  private cleanUpExpiredMessages() {
    const currentTime = Date.now();
    this.messageExpiryTimes.forEach((expiryTime, eventName) => {
      if (expiryTime <= currentTime) {
        this.lastMessages.delete(eventName);
        this.messageExpiryTimes.delete(eventName);
      }
    });
  }
  // Método optimizado con caché inteligente
  async getBandManagerIdByEventId(eventId: number): Promise<number | null> {
    const now = Date.now();
    const cached = this.eventManagersCache.get(eventId);

    // Si el caché es válido, usarlo
    if (cached && now - cached.lastUpdated < cached.ttl) {
      return cached.eventManagerId;
    }

    try {
      // Solo consultar BD si no hay caché válido
      const managerId =
        await this.eventsService.getEventManagerByEventId(eventId);

      // Actualizar caché
      this.eventManagersCache.set(eventId, {
        eventManagerId: managerId,
        lastUpdated: now,
        ttl: this.cacheDefaultTTL,
      });

      return managerId;
    } catch (error) {
      this.logger.error(`Error obteniendo event manager: ${error.message}`);
      return null;
    }
  }

  // Validación rápida de permisos sin BD
  private async isUserEventManager(
    userId: number,
    eventId: number,
  ): Promise<boolean> {
    const eventManagerId = await this.getBandManagerIdByEventId(eventId);
    return eventManagerId === userId;
  }

  // Limpiar caché de administradores de eventos
  private cleanUpEventManagersCache() {
    const now = Date.now();
    for (const [eventId, cached] of this.eventManagersCache.entries()) {
      if (now - cached.lastUpdated > cached.ttl) {
        this.eventManagersCache.delete(eventId);
      }
    }
  }

  // Limpiar clientes desconectados
  private cleanUpDisconnectedClients() {
    for (const [clientId, client] of this.connectedClients.entries()) {
      if (client.disconnected) {
        this.connectedClients.delete(clientId);
      }
    }
  }

  // Invalidar caché específico (usar cuando cambie el admin del evento)
  cleanUpBandManager(eventId: number) {
    this.eventManagersCache.delete(eventId);
  }

  // Actualizar caché cuando cambie el administrador
  changeEventManager(eventId: number, userId: number) {
    this.eventManagersCache.set(eventId, {
      eventManagerId: userId,
      lastUpdated: Date.now(),
      ttl: this.cacheDefaultTTL,
    });
  }

  // Sistema de Rate Limiting Inteligente
  private checkRateLimit(
    userId: number,
    eventId: number,
    messageType: string,
  ): boolean {
    const key = `${userId}:${eventId}`;
    const now = Date.now();
    let rateLimitInfo = this.rateLimits.get(key);

    if (!rateLimitInfo) {
      // Primera vez que el usuario envía mensaje para este evento
      rateLimitInfo = {
        count: 1,
        resetTime: now + 60000, // Reset en 1 minuto
        lastMessageTime: now,
      };
      this.rateLimits.set(key, rateLimitInfo);
      return true;
    }

    // Reset del contador si ha pasado el tiempo
    if (now >= rateLimitInfo.resetTime) {
      rateLimitInfo.count = 1;
      rateLimitInfo.resetTime = now + 60000;
      rateLimitInfo.lastMessageTime = now;
      return true;
    }

    // Verificar límite de ráfaga (mensajes muy rápidos seguidos)
    const timeSinceLastMessage = now - rateLimitInfo.lastMessageTime;
    if (timeSinceLastMessage < this.burstWindow) {
      // Está en ventana de ráfaga
      if (rateLimitInfo.count >= this.burstLimit) {
        this.logger.warn(
          `Rate limit (burst) aplicado a usuario ${userId} en evento ${eventId}`,
        );
        return false;
      }
    }

    // Verificar límite por minuto
    if (rateLimitInfo.count >= this.maxMessagesPerMinute) {
      this.logger.warn(
        `Rate limit (per minute) aplicado a usuario ${userId} en evento ${eventId}`,
      );
      return false;
    }

    // Permitir el mensaje
    rateLimitInfo.count++;
    rateLimitInfo.lastMessageTime = now;

    // Log de advertencia si se acerca al límite
    if (rateLimitInfo.count >= this.maxMessagesPerMinute * 0.8) {
      this.logger.warn(
        `Usuario ${userId} cerca del rate limit: ${rateLimitInfo.count}/${this.maxMessagesPerMinute}`,
      );
    }

    return true;
  }

  // Limpiar rate limits expirados
  private cleanUpRateLimits() {
    const now = Date.now();
    for (const [key, rateLimitInfo] of this.rateLimits.entries()) {
      if (now >= rateLimitInfo.resetTime) {
        this.rateLimits.delete(key);
      }
    }
  }

  // Resetear rate limit específico (para admin override si es necesario)
  public resetRateLimit(userId: number, eventId: number) {
    const key = `${userId}:${eventId}`;
    this.rateLimits.delete(key);
    this.logger.log(
      `Rate limit reseteado para usuario ${userId} en evento ${eventId}`,
    );
  }

  // Obtener estadísticas de rate limiting para monitoreo
  public getRateLimitStats(): { totalKeys: number; activeKeys: number } {
    const now = Date.now();
    let activeKeys = 0;

    for (const [, rateLimitInfo] of this.rateLimits.entries()) {
      if (now < rateLimitInfo.resetTime) {
        activeKeys++;
      }
    }

    return {
      totalKeys: this.rateLimits.size,
      activeKeys: activeKeys,
    };
  }
}
