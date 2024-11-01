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

@WebSocketGateway({
  cors: {
    origin: frontEndUrl, // Reemplaza con la URL de tu frontend
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class EventsGateway {
  @WebSocketServer()
  server: Server;

  private lastEventSelectedSongMessage: any;
  private lastLyricSelectedMessage: any;

  constructor(private readonly eventsService: EventsService) {}

  handleConnection(client: Socket) {
    // Enviar el último mensaje de 'eventSelectedSong' al cliente recién conectado
    if (this.lastEventSelectedSongMessage) {
      client.emit('eventSelectedSong', this.lastEventSelectedSongMessage);
    }
    // Enviar el último mensaje de 'lyricSelected' al cliente recién conectado
    if (this.lastLyricSelectedMessage) {
      client.emit('lyricSelected', this.lastLyricSelectedMessage);
    }
  }
  @SubscribeMessage('eventSelectedSong')
  handleEventSelectedSong(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    this.lastEventSelectedSongMessage = data;
    this.server.emit('eventSelectedSong', data);
  }

  @SubscribeMessage('lyricSelected')
  handleLyricSelected(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    this.lastLyricSelectedMessage = data;
    this.server.emit('lyricSelected', data);
  }
}
