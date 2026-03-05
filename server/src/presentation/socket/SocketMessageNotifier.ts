import type { Server as SocketServer } from "socket.io";
import type { MessageWithSender } from "../../domain/entities/Message.js";
import type { ChatRepository } from "../../domain/repositories/ChatRepository.js";
import type { MessageNotifier } from "../../domain/services/MessageNotifier.js";
import { serializeMessage } from "../http/serializers.js";

export class SocketMessageNotifier implements MessageNotifier {
  private io: SocketServer | null = null;

  constructor(private readonly chatRepository: ChatRepository) {}

  attach(io: SocketServer) {
    this.io = io;
  }

  async broadcastMessage(message: MessageWithSender): Promise<void> {
    if (!this.io) {
      return;
    }

    const payload = serializeMessage(message);
    const members = await this.chatRepository.listMembers(message.chatId);

    for (const member of members) {
      this.io.to(`user:${member.id}`).emit("message:new", payload);
    }
  }
}
