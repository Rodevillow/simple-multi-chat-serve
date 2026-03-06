import type { MessageWithSender } from "../entities/Message.js";

export interface MessageNotifier {
  broadcastMessage(message: MessageWithSender): Promise<void>;
}
