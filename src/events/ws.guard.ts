import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { Socket } from 'socket.io';

@Injectable()
export class WsAuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const client: Socket = context.switchToWs().getClient<Socket>();
    const req = client.request as Request;

    console.log('req.session.userId', req.session.userId);
    if (req.session && req.session.userId) {
      return true;
    } else {
      client.emit(
        'unauthorized',
        'No tienes permiso para realizar esta acción',
      );
      client.disconnect();
      return false;
    }
  }
}
