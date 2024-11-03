import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { EventsService } from './events.service';
import { frontEndUrl } from 'config/constants';
import { sessionMiddleware } from 'src/auth/middlewares/session.middleware';

@WebSocketGateway({
  cors: {
    origin: frontEndUrl,
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayInit {
  @WebSocketServer()
  server: Server;

  private lastMessages: Map<string, any> = new Map();
  private messageExpiryTimes: Map<string, number> = new Map();
  private messageExpiryDuration: number = 3600000; // 1 hora en milisegundos
  private eventManagers: Map<string, number> = new Map(); // Map para almacenar administradores de eventos

  constructor(private readonly eventsService: EventsService) {
    // Configurar un intervalo para verificar y eliminar mensajes expirados
    setInterval(() => this.cleanUpExpiredMessages(), 60000); // Verificar cada minuto
    setInterval(() => this.logMessageCount(), 60000 * 10); // Imprimir cada 10 minutos
  }
  afterInit(server: Server) {
    server.engine.use(sessionMiddleware);
  }

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

  private cleanUpExpiredMessages() {
    const currentTime = Date.now();
    this.messageExpiryTimes.forEach((expiryTime, eventName) => {
      if (expiryTime <= currentTime) {
        this.lastMessages.delete(eventName);
        this.messageExpiryTimes.delete(eventName);
      }
    });
  }
  async getEventManagerId(eventId: string): Promise<number> {
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

  clearMessagesForEvent(eventId: number) {
    const eventSelectedSongKey = `eventSelectedSong-${eventId}`;
    const lyricSelectedKey = `lyricSelected-${eventId}`;

    this.lastMessages.delete(eventSelectedSongKey);
    this.messageExpiryTimes.delete(eventSelectedSongKey);

    this.lastMessages.delete(lyricSelectedKey);
    this.messageExpiryTimes.delete(lyricSelectedKey);
  }
  private logMessageCount() {
    console.log(`Number of messages in memory: ${this.lastMessages.size}`);
  }
}
