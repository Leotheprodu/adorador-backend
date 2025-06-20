import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { EventsService } from './events.service';
import { frontEndUrl } from 'config/constants';
import { forwardRef, Inject } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: frontEndUrl,
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class EventsGateway /* implements OnGatewayConnection, OnGatewayInit */ {
  @WebSocketServer()
  server: Server;

  private lastMessages: Map<string, any> = new Map();
  private messageExpiryTimes: Map<string, number> = new Map();
  private messageExpiryDuration: number = 3600000; // 1 hora en milisegundos
  /* private eventManagers: Map<string, number> = new Map(); */ // Map para almacenar administradores de eventos

  constructor(
    @Inject(forwardRef(() => EventsService))
    private readonly eventsService: EventsService,
  ) {
    // Configurar un intervalo para verificar y eliminar mensajes expirados
    setInterval(() => this.cleanUpExpiredMessages(), 60000); // Verificar cada minuto
    /* setInterval(() => this.cleanUpEventManagers(), 60000 * 60) */ // Limpiar cada hora
  }
  /*   afterInit(server: Server) {
    server.engine.use(sessionMiddleware);
  } */

  handleConnection(client: Socket) {
    // Enviar los últimos mensajes de todos los eventos al cliente recién conectado
    this.lastMessages.forEach((message, event) => {
      client.emit(event, message);
    });
  }

  @SubscribeMessage('eventSelectedSong')
  async handleEventSelectedSong(
    @MessageBody() data: { id: string; message: any },
    @ConnectedSocket() client: Socket,
  ) {}

  @SubscribeMessage('lyricSelected')
  async handleLyricSelected(
    @MessageBody() data: { id: string; message: any },
    @ConnectedSocket() client: Socket,
  ) {}

  @SubscribeMessage('liveMessage')
  handleMusicLiveMessages(
    @MessageBody() data: { id: string; message: any },
    @ConnectedSocket() client: Socket,
  ) {
    const eventName = `liveMessage-${data.id}`;
    this.server.emit(eventName, data.message);
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

  private cleanUpExpiredMessages() {
    const currentTime = Date.now();
    this.messageExpiryTimes.forEach((expiryTime, eventName) => {
      if (expiryTime <= currentTime) {
        this.lastMessages.delete(eventName);
        this.messageExpiryTimes.delete(eventName);
      }
    });
  }
  /* async getEventManagerId(eventId: string): Promise<number> {
    if (!this.eventManagers.has(eventId)) {
      const managerId = await this.eventsService.getEventManagerByEventId(
        parseInt(eventId),
      );
      this.eventManagers.set(eventId, managerId.eventManagerId);
    }
    return this.eventManagers.get(eventId);
  }
  private cleanUpEventManagers() {
    this.eventManagers.clear();
  }

  cleanUpEventManagersForEvent(eventId: number) {
    this.eventManagers.delete(eventId.toString());
  } */
}
