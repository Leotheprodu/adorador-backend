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
import { frontEndUrl } from '../../config/constants';
import { Logger } from '@nestjs/common';
import { AuthJwtService, JwtPayload } from '../auth/services/jwt.service';

interface AuthenticatedSocket extends Socket {
  userId?: number;
  userName?: string;
  isAuthenticated?: boolean;
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
  namespace: '/feed', // Namespace separado para el feed
})
export class FeedGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  private readonly logger = new Logger(FeedGateway.name);

  // Control de clientes conectados
  private connectedClients: Map<string, AuthenticatedSocket> = new Map();

  // Usuarios conectados al feed
  private feedConnections: Set<string> = new Set(); // Set of socketIds

  // Sistema de rate limiting
  private rateLimits: Map<string, RateLimitInfo> = new Map(); // key: userId
  private readonly maxMessagesPerMinute = 60; // 60 mensajes por minuto para el feed
  private readonly burstLimit = 10; // Máximo 10 mensajes en ráfaga
  private readonly burstWindow = 2000; // Ventana de ráfaga: 2 segundos

  constructor(private readonly jwtService: AuthJwtService) {
    // Limpiar rate limits periódicamente
    setInterval(() => this.cleanUpRateLimits(), 60000); // Cada minuto
    setInterval(() => this.cleanUpDisconnectedClients(), 300000); // Cada 5 minutos
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      this.logger.log(`Cliente conectándose al feed: ${client.id}`);

      // Extraer token del handshake
      const token = this.extractTokenFromHandshake(client);

      if (token) {
        const user = await this.authenticateToken(token);
        if (user) {
          client.userId = user.sub;
          client.userName = user.name;
          client.isAuthenticated = true;

          this.connectedClients.set(client.id, client);
          this.logger.log(
            `Cliente autenticado en feed: ${user.name} (${user.sub})`,
          );
        } else {
          client.isAuthenticated = false;
          this.logger.log(`Cliente con token inválido: ${client.id}`);
        }
      } else {
        // Sin token - modo invitado (solo lectura)
        client.isAuthenticated = false;
        client.userId = null;
        client.userName = 'Invitado';

        this.connectedClients.set(client.id, client);
        this.logger.log(`Cliente invitado en feed: ${client.id}`);
      }

      // Enviar confirmación de conexión
      client.emit('feed_connection_ready', {
        userId: client.userId,
        userName: client.userName,
        isAuthenticated: client.isAuthenticated,
        connectedUsers: this.feedConnections.size,
      });
    } catch (error) {
      this.logger.error(`Error en conexión al feed: ${error.message}`);
      client.isAuthenticated = false;
      client.userId = null;
      client.userName = 'Invitado';
      this.connectedClients.set(client.id, client);
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Cliente desconectándose del feed: ${client.id}`);

    // Remover de feed connections si estaba
    this.feedConnections.delete(client.id);

    // Remover de clientes conectados
    this.connectedClients.delete(client.id);

    // Limpiar rate limits si existían
    if (client.userId) {
      this.rateLimits.delete(`${client.userId}`);
    }

    // Notificar a otros usuarios
    this.broadcastConnectedCount();
  }

  /**
   * Usuario se une al feed
   */
  @SubscribeMessage('joinFeed')
  handleJoinFeed(@ConnectedSocket() client: AuthenticatedSocket) {
    if (!this.feedConnections.has(client.id)) {
      this.feedConnections.add(client.id);
      this.logger.log(
        `Usuario ${client.userName} (${client.id}) se unió al feed`,
      );

      // Notificar al cliente
      client.emit('joined_feed', {
        success: true,
        connectedUsers: this.feedConnections.size,
      });

      // Notificar a todos sobre el cambio en usuarios conectados
      this.broadcastConnectedCount();
    }
  }

  /**
   * Usuario sale del feed
   */
  @SubscribeMessage('leaveFeed')
  handleLeaveFeed(@ConnectedSocket() client: AuthenticatedSocket) {
    if (this.feedConnections.has(client.id)) {
      this.feedConnections.delete(client.id);
      this.logger.log(
        `Usuario ${client.userName} (${client.id}) salió del feed`,
      );

      // Notificar al cliente
      client.emit('left_feed', {
        success: true,
      });

      // Notificar a todos sobre el cambio
      this.broadcastConnectedCount();
    }
  }

  /**
   * Obtener número de usuarios conectados
   */
  @SubscribeMessage('getConnectedUsers')
  handleGetConnectedUsers(@ConnectedSocket() client: AuthenticatedSocket) {
    client.emit('connected_users_count', {
      count: this.feedConnections.size,
    });
  }

  /**
   * Emitir nuevo post a todos los usuarios conectados
   */
  emitNewPost(post: any) {
    this.logger.log(
      `Emitiendo nuevo post ${post.id} a ${this.feedConnections.size} usuarios`,
    );

    this.broadcastToFeed('newPost', post);
  }

  /**
   * Emitir actualización de post
   */
  emitPostUpdated(post: any) {
    this.logger.log(`Emitiendo actualización de post ${post.id}`);
    this.broadcastToFeed('postUpdated', post);
  }

  /**
   * Emitir eliminación de post
   */
  emitPostDeleted(postId: number) {
    this.logger.log(`Emitiendo eliminación de post ${postId}`);
    this.broadcastToFeed('postDeleted', { postId });
  }

  /**
   * Emitir nuevo comentario
   */
  emitNewComment(comment: any) {
    this.logger.log(
      `Emitiendo nuevo comentario ${comment.id} en post ${comment.postId}`,
    );

    this.broadcastToFeed('newComment', {
      postId: comment.postId,
      comment,
    });
  }

  /**
   * Emitir nuevo blessing
   */
  emitNewBlessing(data: { postId: number; userId: number; count: number }) {
    this.logger.log(
      `Emitiendo nuevo blessing en post ${data.postId} (total: ${data.count})`,
    );

    this.broadcastToFeed('newBlessing', data);
  }

  /**
   * Emitir blessing removido
   */
  emitBlessingRemoved(data: { postId: number; userId: number; count: number }) {
    this.logger.log(
      `Emitiendo blessing removido de post ${data.postId} (total: ${data.count})`,
    );

    this.broadcastToFeed('blessingRemoved', data);
  }

  /**
   * Emitir nuevo blessing en comentario
   */
  emitNewCommentBlessing(data: {
    commentId: number;
    userId: number;
    count: number;
  }) {
    this.logger.log(
      `Emitiendo nuevo blessing en comentario ${data.commentId} (total: ${data.count})`,
    );

    this.broadcastToFeed('commentBlessed', data);
  }

  /**
   * Emitir blessing removido de comentario
   */
  emitCommentBlessingRemoved(data: {
    commentId: number;
    userId: number;
    count: number;
  }) {
    this.logger.log(
      `Emitiendo blessing removido de comentario ${data.commentId} (total: ${data.count})`,
    );

    this.broadcastToFeed('commentBlessingRemoved', data);
  }

  /**
   * Emitir canción copiada
   */
  emitSongCopied(data: {
    postId: number;
    userId: number;
    userName: string;
    targetBandName: string;
    count: number;
  }) {
    this.logger.log(
      `Emitiendo canción copiada de post ${data.postId} por ${data.userName}`,
    );

    this.broadcastToFeed('songCopied', data);
  }

  // ============================================
  // MÉTODOS PRIVADOS DE UTILIDAD
  // ============================================

  /**
   * Broadcast a todos los usuarios en el feed
   */
  private broadcastToFeed(event: string, data: any) {
    this.feedConnections.forEach((socketId) => {
      const client = this.connectedClients.get(socketId);
      if (client) {
        client.emit(event, data);
      }
    });
  }

  /**
   * Notificar cambio en usuarios conectados
   */
  private broadcastConnectedCount() {
    this.broadcastToFeed('connected_users_count', {
      count: this.feedConnections.size,
    });
  }

  /**
   * Extraer token del handshake
   */
  private extractTokenFromHandshake(client: Socket): string | null {
    // Opción 1: Token en auth del handshake
    const authToken = client.handshake.auth?.token;
    if (authToken) {
      return authToken;
    }

    // Opción 2: Token en headers
    const headerToken = client.handshake.headers?.authorization;
    if (headerToken && typeof headerToken === 'string') {
      return headerToken.replace('Bearer ', '');
    }

    // Opción 3: Token en query params (menos seguro, pero útil para debug)
    const queryToken = client.handshake.query?.token;
    if (queryToken && typeof queryToken === 'string') {
      return queryToken;
    }

    return null;
  }

  /**
   * Autenticar token JWT
   */
  private async authenticateToken(token: string): Promise<JwtPayload | null> {
    try {
      const payload = await this.jwtService.verifyAccessToken(token);
      return payload;
    } catch (error) {
      this.logger.warn(`Token inválido: ${error.message}`);
      return null;
    }
  }

  /**
   * Verificar rate limit
   */
  private checkRateLimit(userId: number | null): boolean {
    if (!userId) return true; // Invitados no tienen límite (solo lectura)

    const key = `${userId}`;
    const now = Date.now();
    const limit = this.rateLimits.get(key);

    if (!limit) {
      // Primera vez - crear límite
      this.rateLimits.set(key, {
        count: 1,
        resetTime: now + 60000, // Reset en 1 minuto
        lastMessageTime: now,
      });
      return true;
    }

    // Reset si pasó el tiempo
    if (now > limit.resetTime) {
      this.rateLimits.set(key, {
        count: 1,
        resetTime: now + 60000,
        lastMessageTime: now,
      });
      return true;
    }

    // Verificar burst (ráfaga)
    const timeSinceLastMessage = now - limit.lastMessageTime;
    if (timeSinceLastMessage < this.burstWindow) {
      // Dentro de ventana de ráfaga
      if (limit.count >= this.burstLimit) {
        this.logger.warn(
          `Usuario ${userId} excedió límite de ráfaga (${this.burstLimit} msgs en ${this.burstWindow}ms)`,
        );
        return false;
      }
    }

    // Verificar límite por minuto
    if (limit.count >= this.maxMessagesPerMinute) {
      this.logger.warn(
        `Usuario ${userId} excedió límite de ${this.maxMessagesPerMinute} msgs/min`,
      );
      return false;
    }

    // Actualizar contador
    limit.count++;
    limit.lastMessageTime = now;
    this.rateLimits.set(key, limit);

    return true;
  }

  /**
   * Limpiar rate limits expirados
   */
  private cleanUpRateLimits() {
    const now = Date.now();
    let cleaned = 0;

    this.rateLimits.forEach((limit, key) => {
      if (now > limit.resetTime) {
        this.rateLimits.delete(key);
        cleaned++;
      }
    });

    if (cleaned > 0) {
      this.logger.debug(`Limpiados ${cleaned} rate limits expirados`);
    }
  }

  /**
   * Limpiar clientes desconectados
   */
  private cleanUpDisconnectedClients() {
    let cleaned = 0;

    this.connectedClients.forEach((client, socketId) => {
      if (!client.connected) {
        this.connectedClients.delete(socketId);
        this.feedConnections.delete(socketId);
        cleaned++;
      }
    });

    if (cleaned > 0) {
      this.logger.debug(`Limpiados ${cleaned} clientes desconectados`);
    }
  }
}
