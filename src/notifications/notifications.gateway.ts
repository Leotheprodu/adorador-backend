import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { frontEndUrl } from '../../config/constants';
import { AuthJwtService } from '../auth/services/jwt.service';
import { NotificationResponse } from './interfaces/notification.interface';

interface AuthenticatedSocket extends Socket {
  userId?: number;
  userName?: string;
  isAuthenticated?: boolean;
}

@WebSocketGateway({
  cors: {
    origin: frontEndUrl,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;
  private readonly logger = new Logger(NotificationsGateway.name);

  // Mapeo de userId a socketIds
  private userSockets: Map<number, Set<string>> = new Map();

  constructor(private readonly jwtService: AuthJwtService) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      this.logger.log(`Cliente conectándose a notificaciones: ${client.id}`);

      const token = this.extractTokenFromHandshake(client);

      if (token) {
        const user = await this.authenticateToken(token);
        if (user) {
          client.userId = user.sub;
          client.userName = user.name;
          client.isAuthenticated = true;

          // Agregar socket al mapeo de usuarios
          if (!this.userSockets.has(user.sub)) {
            this.userSockets.set(user.sub, new Set());
          }
          this.userSockets.get(user.sub).add(client.id);

          this.logger.log(
            `Cliente autenticado en notificaciones: ${user.name} (${user.sub})`,
          );

          // Enviar confirmación
          client.emit('notifications_connection_ready', {
            userId: client.userId,
            userName: client.userName,
          });
        }
      }
    } catch (error) {
      this.logger.error(`Error en conexión a notificaciones: ${error.message}`);
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Cliente desconectándose de notificaciones: ${client.id}`);

    if (client.userId) {
      const sockets = this.userSockets.get(client.userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSockets.delete(client.userId);
        }
      }
    }
  }

  /**
   * Emitir nueva notificación a un usuario específico
   */
  emitNotification(userId: number, notification: NotificationResponse) {
    const sockets = this.userSockets.get(userId);
    if (sockets && sockets.size > 0) {
      sockets.forEach((socketId) => {
        this.server.to(socketId).emit('NEW_NOTIFICATION', notification);
      });
      this.logger.log(
        `Notificación enviada a usuario ${userId} (${sockets.size} conexiones)`,
      );
    }
  }

  /**
   * Emitir actualización de contador de notificaciones
   */
  emitUnreadCountUpdate(userId: number, count: number) {
    const sockets = this.userSockets.get(userId);
    if (sockets && sockets.size > 0) {
      sockets.forEach((socketId) => {
        this.server.to(socketId).emit('UNREAD_COUNT_UPDATE', { count });
      });
    }
  }

  /**
   * Extraer token del handshake
   */
  private extractTokenFromHandshake(client: Socket): string | null {
    // Intentar desde auth
    const authToken = client.handshake.auth?.token;
    if (authToken) return authToken;

    // Intentar desde headers
    const authHeader = client.handshake.headers?.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }

  /**
   * Autenticar token
   */
  private async authenticateToken(token: string) {
    try {
      return await this.jwtService.verifyAccessToken(token);
    } catch (error) {
      this.logger.error(`Error verificando token: ${error.message}`);
      return null;
    }
  }
}
