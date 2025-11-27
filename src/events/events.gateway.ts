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
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { frontEndUrl } from '../../config/constants';
import { forwardRef, Inject, Logger } from '@nestjs/common';
import { AuthJwtService, JwtPayload } from '../auth/services/jwt.service';
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

interface CachedSubscription {
  bandId: number;
  maxPeoplePerEvent: number;
  planName: string;
  lastUpdated: number;
  ttl: number;
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

  // Optimización: Caché de suscripciones para evitar queries repetidas durante eventos
  private subscriptionsCache: Map<number, CachedSubscription> = new Map();
  private readonly subscriptionCacheTTL: number = 600000; // 10 minutos (suscripciones cambian poco)

  // Control de clientes conectados
  private connectedClients: Map<string, AuthenticatedSocket> = new Map();

  // Control de usuarios conectados por evento
  private eventConnections: Map<number, Set<string>> = new Map(); // eventId -> Set of socketIds
  private clientEventMap: Map<string, number> = new Map(); // socketId -> eventId

  // Sistema de rate limiting inteligente
  private rateLimits: Map<string, RateLimitInfo> = new Map(); // key: userId:eventId
  private readonly maxMessagesPerMinute = 30; // 30 mensajes por minuto máx
  private readonly burstLimit = 5; // Máximo 5 mensajes en ráfaga
  private readonly burstWindow = 2000; // Ventana de ráfaga: 2 segundos

  constructor(
    @Inject(forwardRef(() => EventsService))
    private readonly eventsService: EventsService,
    private readonly jwtService: AuthJwtService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {
    // Limpiar caches periódicamente
    setInterval(() => this.cleanUpExpiredMessages(), 60000); // Cada minuto
    setInterval(() => this.cleanUpEventManagersCache(), 120000); // Cada 2 minutos
    setInterval(() => this.cleanUpSubscriptionsCache(), 300000); // Cada 5 minutos
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

    // Limpiar de evento actual si estaba conectado
    this.leaveCurrentEvent(client.id);

    // Limpiar de clientes conectados
    this.connectedClients.delete(client.id);
  }

  private extractTokenFromHandshake(
    client: AuthenticatedSocket,
  ): string | null {
    // Intentar desde handshake.auth (Socket.io auth field)
    const authToken = client.handshake.auth?.token;
    if (authToken) {
      return authToken;
    }

    // Extraer token de los headers de autorización
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

  // Limpiar caché de suscripciones expirado
  private cleanUpSubscriptionsCache() {
    const now = Date.now();
    for (const [bandId, cached] of this.subscriptionsCache.entries()) {
      if (now - cached.lastUpdated > cached.ttl) {
        this.subscriptionsCache.delete(bandId);
        this.logger.debug(`Caché de suscripción expirado para banda ${bandId}`);
      }
    }
  }

  // Obtener límites de suscripción con caché (evita consultas repetidas a BD)
  private async getSubscriptionLimits(bandId: number): Promise<CachedSubscription | null> {
    const now = Date.now();
    const cached = this.subscriptionsCache.get(bandId);

    // Retornar caché si está vigente
    if (cached && (now - cached.lastUpdated < cached.ttl)) {
      return cached;
    }

    // Consultar BD solo si no hay caché o expiró
    try {
      const subscription = await this.subscriptionsService.getSubscriptionByBandId(bandId);
      
      if (!subscription || !subscription.plan) {
        this.logger.warn(`No se encontró suscripción activa para banda ${bandId}`);
        return null;
      }

      const subscriptionLimits: CachedSubscription = {
        bandId,
        maxPeoplePerEvent: subscription.plan.maxPeoplePerEvent,
        planName: subscription.plan.name,
        lastUpdated: now,
        ttl: this.subscriptionCacheTTL,
      };

      // Guardar en caché
      this.subscriptionsCache.set(bandId, subscriptionLimits);
      this.logger.debug(`Caché de suscripción actualizado para banda ${bandId}: ${subscription.plan.name}`);

      return subscriptionLimits;
    } catch (error) {
      this.logger.error(`Error obteniendo límites de suscripción para banda ${bandId}: ${error.message}`);
      return null;
    }
  }

  // Invalidar caché de suscripción cuando cambia (llamar desde el servicio de suscripciones)
  public invalidateSubscriptionCache(bandId: number) {
    this.subscriptionsCache.delete(bandId);
    this.logger.log(`Caché de suscripción invalidado para banda ${bandId}`);
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

  // ========= MÉTODOS PARA TRACKING DE USUARIOS CONECTADOS =========

  @SubscribeMessage('joinEvent')
  async handleJoinEvent(
    @MessageBody() data: { eventId: number; bandId: number },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      const { eventId, bandId } = data;
      const socketId = client.id;

      // Verificar si el usuario YA está conectado al evento
      const isAlreadyConnected = this.clientEventMap.get(socketId) === eventId;

      // Verificar límite de conexiones según el plan de suscripción
      // Si ya está conectado, no cuenta como una nueva conexión
      const currentConnections = this.eventConnections.get(eventId)?.size || 0;
      const effectiveConnections = isAlreadyConnected ? currentConnections - 1 : currentConnections;

      // Obtener límites de suscripción (con caché para eficiencia)
      const subscriptionLimits = await this.getSubscriptionLimits(bandId);

      if (subscriptionLimits) {
        const maxConnections = subscriptionLimits.maxPeoplePerEvent;

        // Si ya se alcanzó el límite (y no es una reconexión)
        if (effectiveConnections >= maxConnections) {
          // Si el usuario está autenticado, tiene prioridad sobre invitados
          if (client.isAuthenticated) {
            // Buscar un invitado para desconectar (excluyendo al cliente actual)
            const guestToDisconnect = this.findGuestToDisconnect(eventId, socketId);

            if (guestToDisconnect) {
              // Desconectar al invitado
              const guestClient = this.connectedClients.get(guestToDisconnect);

              this.logger.warn(
                `Desconectando invitado ${guestToDisconnect} del evento ${eventId} ` +
                `para dar prioridad a usuario autenticado ${client.userName} (${client.userId})`,
              );

              // Notificar al invitado que fue desconectado
              if (guestClient) {
                guestClient.emit('disconnected_by_priority', {
                  eventId,
                  reason: 'Un miembro de la banda necesita conectarse',
                  message: 'Has sido desconectado del evento porque un músico de la banda necesita el espacio. Los miembros de la banda tienen prioridad sobre los invitados.',
                });

                // Forzar desconexión del evento
                this.leaveCurrentEvent(guestToDisconnect);
              }

              this.logger.log(
                `Espacio liberado. Usuario autenticado ${client.userName} puede conectarse.`,
              );
            } else {
              // No hay invitados para desconectar, todos son usuarios autenticados
              this.logger.warn(
                `Límite alcanzado para evento ${eventId} y no hay invitados para desconectar. ` +
                `Todos los ${effectiveConnections} usuarios conectados están autenticados.`,
              );

              client.emit('connection_limit_reached', {
                eventId,
                currentConnections: effectiveConnections,
                maxConnections,
                planName: subscriptionLimits.planName,
                allAuthenticated: true,
                message: `Este evento ha alcanzado el límite de ${maxConnections} personas conectadas simultáneamente. Todos los espacios están ocupados por miembros autenticados.`,
              });
              return;
            }
          } else {
            // Usuario invitado y límite alcanzado
            this.logger.warn(
              `Límite de conexiones alcanzado para evento ${eventId}. ` +
              `Invitado ${socketId} no puede conectarse. ` +
              `Actual: ${effectiveConnections}, Máximo: ${maxConnections}`,
            );

            client.emit('connection_limit_reached', {
              eventId,
              currentConnections: effectiveConnections,
              maxConnections,
              planName: subscriptionLimits.planName,
              isGuest: true,
              message: `Este evento ha alcanzado el límite de ${maxConnections} personas conectadas simultáneamente según el plan ${subscriptionLimits.planName}. Los miembros de la banda tienen prioridad.`,
            });
            return;
          }
        }
      }

      // Remover de evento anterior si existía
      this.leaveCurrentEvent(socketId);

      // Agregar a nuevo evento
      if (!this.eventConnections.has(eventId)) {
        this.eventConnections.set(eventId, new Set());
      }

      this.eventConnections.get(eventId).add(socketId);
      this.clientEventMap.set(socketId, eventId);

      const userType = client.isAuthenticated ? 'autenticado' : 'invitado';
      this.logger.log(
        `Cliente ${socketId} (${client.userName || 'Invitado'}) [${userType}] ${isAlreadyConnected ? 're-unió' : 'se unió'} al evento ${eventId}. ` +
        `Conexiones: ${this.eventConnections.get(eventId).size}/${subscriptionLimits?.maxPeoplePerEvent || '∞'}`,
      );

      // Emitir lista actualizada de usuarios conectados al evento (incluyendo límites)
      this.emitConnectedUsers(eventId, subscriptionLimits);
    } catch (error) {
      this.logger.error(`Error en joinEvent: ${error.message}`);
      client.emit('error', { m: 'Error joining event' });
    }
  }

  @SubscribeMessage('leaveEvent')
  handleLeaveEvent(@ConnectedSocket() client: AuthenticatedSocket) {
    this.leaveCurrentEvent(client.id);
  }

  private leaveCurrentEvent(socketId: string) {
    const currentEventId = this.clientEventMap.get(socketId);

    if (currentEventId && this.eventConnections.has(currentEventId)) {
      this.eventConnections.get(currentEventId).delete(socketId);

      // Limpiar evento vacío
      if (this.eventConnections.get(currentEventId).size === 0) {
        this.eventConnections.delete(currentEventId);
      } else {
        // Emitir lista actualizada
        this.emitConnectedUsers(currentEventId);
      }

      this.clientEventMap.delete(socketId);

      const client = this.connectedClients.get(socketId);
      this.logger.log(
        `Cliente ${socketId} (${client?.userName || 'Invitado'}) salió del evento ${currentEventId}`,
      );
    }
  }

  private emitConnectedUsers(eventId: number, subscriptionLimits?: CachedSubscription | null) {
    const connectedSocketIds = this.eventConnections.get(eventId);
    if (!connectedSocketIds) return;

    const connectedUsers = [];
    let guestCount = 0;

    for (const socketId of connectedSocketIds) {
      const client = this.connectedClients.get(socketId);
      if (client) {
        if (client.isAuthenticated && client.userName) {
          connectedUsers.push({
            id: client.userId,
            name: client.userName,
            isAuthenticated: true,
          });
        } else {
          guestCount++;
        }
      } else {
      }
    }

    const message = {
      eventId,
      users: connectedUsers,
      guestCount,
      totalCount: connectedUsers.length + guestCount,
      // Incluir límites si están disponibles
      ...(subscriptionLimits && {
        maxConnections: subscriptionLimits.maxPeoplePerEvent,
        planName: subscriptionLimits.planName,
      }),
    };

    // Emitir a todos los usuarios conectados al evento
    for (const socketId of connectedSocketIds) {
      const client = this.connectedClients.get(socketId);
      if (client) {
        client.emit('eventUsersUpdate', message);
      }
    }
  }

  @SubscribeMessage('getConnectedUsers')
  handleGetConnectedUsers(
    @MessageBody() data: { eventId: number },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const { eventId } = data;
    const connectedSocketIds = this.eventConnections.get(eventId);

    if (!connectedSocketIds) {
      client.emit('eventUsersUpdate', {
        eventId,
        users: [],
        guestCount: 0,
        totalCount: 0,
      });
      return;
    }

    const connectedUsers = [];
    let guestCount = 0;

    for (const socketId of connectedSocketIds) {
      const connectedClient = this.connectedClients.get(socketId);
      if (connectedClient) {
        if (connectedClient.isAuthenticated && connectedClient.userName) {
          connectedUsers.push({
            id: connectedClient.userId,
            name: connectedClient.userName,
            isAuthenticated: true,
          });
        } else {
          guestCount++;
        }
      }
    }

    client.emit('eventUsersUpdate', {
      eventId,
      users: connectedUsers,
      guestCount,
      totalCount: connectedUsers.length + guestCount,
    });
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

  // Obtener cantidad de clientes conectados
  public getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  // Obtener cantidad de eventos activos
  public getActiveEventsCount(): number {
    return this.eventConnections.size;
  }

  // Obtener métricas detalladas por evento
  public getEventMetrics(eventId: number): {
    totalUsers: number;
    authenticatedUsers: number;
    guestUsers: number;
    usersList: Array<{ id?: number; name: string; isAuthenticated: boolean }>;
  } | null {
    const connectedSocketIds = this.eventConnections.get(eventId);
    if (!connectedSocketIds) {
      return null;
    }

    const usersList = [];
    let authenticatedCount = 0;
    let guestCount = 0;

    for (const socketId of connectedSocketIds) {
      const client = this.connectedClients.get(socketId);
      if (client) {
        if (client.isAuthenticated && client.userName) {
          usersList.push({
            id: client.userId,
            name: client.userName,
            isAuthenticated: true,
          });
          authenticatedCount++;
        } else {
          usersList.push({
            name: 'Invitado',
            isAuthenticated: false,
          });
          guestCount++;
        }
      }
    }

    return {
      totalUsers: usersList.length,
      authenticatedUsers: authenticatedCount,
      guestUsers: guestCount,
      usersList,
    };
  }

  // Obtener todas las métricas del sistema
  public getSystemMetrics() {
    const eventsMetrics = [];
    for (const [eventId] of this.eventConnections.entries()) {
      const metrics = this.getEventMetrics(eventId);
      if (metrics) {
        eventsMetrics.push({
          eventId,
          ...metrics,
        });
      }
    }


    return {
      totalConnectedClients: this.connectedClients.size,
      activeEvents: this.eventConnections.size,
      rateLimiting: this.getRateLimitStats(),
      cachedEventManagers: this.eventManagersCache.size,
      cachedMessages: this.lastMessages.size,
      events: eventsMetrics,
    };
  }

  /**
   * Encuentra un invitado (usuario no autenticado) para desconectar del evento
   * @param eventId ID del evento
   * @param excludeSocketId ID del socket a excluir de la búsqueda (normalmente el que está intentando conectarse)
   * @returns socketId del invitado a desconectar, o null si no hay invitados
   */
  private findGuestToDisconnect(eventId: number, excludeSocketId?: string): string | null {
    const connectedSocketIds = this.eventConnections.get(eventId);
    if (!connectedSocketIds) return null;

    // Buscar el primer invitado (no autenticado) que NO sea el socket excluido
    for (const socketId of connectedSocketIds) {
      if (excludeSocketId && socketId === excludeSocketId) {
        continue; // Saltar el socket que se quiere excluir
      }

      const client = this.connectedClients.get(socketId);
      if (client && !client.isAuthenticated) {
        return socketId;
      }
    }

    return null; // No hay invitados
  }
}
