import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Server } from 'socket.io';

@WebSocketGateway({ namespace: '/events', cors: { origin: false } })
export class NotificationsGateway {
  @WebSocketServer() server!: Server;
  sendToUser(userId: string, event: string, payload: unknown) {
    this.server.to(`user:${userId}`).emit(event, payload);
  }
  sendToAdmins(event: string, payload: unknown) {
    this.server.to('admin').emit(event, payload);
  }
}
