import { Prisma } from "@prisma/client";
import type { ChatPreview } from "../../domain/entities/Chat.js";
import type { MessageWithSender } from "../../domain/entities/Message.js";
import type { PublicUser } from "../../domain/entities/User.js";
import type { ChatRepository } from "../../domain/repositories/ChatRepository.js";
import type { MessageRepository } from "../../domain/repositories/MessageRepository.js";
import { prisma } from "../db/prisma.js";

const previewInclude = {
  members: {
    include: {
      user: true
    }
  },
  messages: {
    take: 1,
    orderBy: {
      createdAt: "desc"
    }
  }
} satisfies Prisma.ChatInclude;

type ChatPreviewModel = Prisma.ChatGetPayload<{
  include: typeof previewInclude;
}>;

const mapUser = (user: {
  id: string;
  email: string;
  nickname: string | null;
  firstName: string | null;
  lastName: string | null;
}): PublicUser => ({
  id: user.id,
  email: user.email,
  nickname: user.nickname,
  firstName: user.firstName,
  lastName: user.lastName
});

const mapPreview = (chat: ChatPreviewModel, userId: string): ChatPreview => {
  const participantMember = chat.members.find((member) => member.userId !== userId) ?? chat.members[0];

  const lastMessage = chat.messages[0]
    ? {
        id: chat.messages[0].id,
        content: chat.messages[0].content,
        senderId: chat.messages[0].senderId,
        createdAt: chat.messages[0].createdAt
      }
    : null;

  return {
    id: chat.id,
    participant: mapUser(participantMember.user),
    lastMessage
  };
};

export class PrismaChatRepository implements ChatRepository, MessageRepository {
  async listPreviewsForUser(userId: string): Promise<ChatPreview[]> {
    const chats = await prisma.chat.findMany({
      where: {
        members: {
          some: {
            userId
          }
        }
      },
      include: previewInclude,
      orderBy: {
        updatedAt: "desc"
      }
    });

    return chats.map((chat) => mapPreview(chat, userId));
  }

  async findPreviewByIdForUser(chatId: string, userId: string): Promise<ChatPreview | null> {
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        members: {
          some: {
            userId
          }
        }
      },
      include: previewInclude
    });

    if (!chat) {
      return null;
    }

    return mapPreview(chat, userId);
  }

  async findDirectChatBetween(firstUserId: string, secondUserId: string): Promise<{ id: string } | null> {
    return prisma.chat.findFirst({
      where: {
        isDirect: true,
        AND: [
          {
            members: {
              some: {
                userId: firstUserId
              }
            }
          },
          {
            members: {
              some: {
                userId: secondUserId
              }
            }
          },
          {
            members: {
              every: {
                userId: {
                  in: [firstUserId, secondUserId]
                }
              }
            }
          }
        ]
      },
      select: {
        id: true
      }
    });
  }

  async createDirectChat(firstUserId: string, secondUserId: string): Promise<{ id: string }> {
    return prisma.chat.create({
      data: {
        isDirect: true,
        members: {
          create: [{ userId: firstUserId }, { userId: secondUserId }]
        }
      },
      select: {
        id: true
      }
    });
  }

  async isMember(chatId: string, userId: string): Promise<boolean> {
    const member = await prisma.chatMember.findUnique({
      where: {
        chatId_userId: {
          chatId,
          userId
        }
      }
    });

    return Boolean(member);
  }

  async listMembers(chatId: string): Promise<PublicUser[]> {
    const members = await prisma.chatMember.findMany({
      where: {
        chatId
      },
      include: {
        user: true
      }
    });

    return members.map((item) => mapUser(item.user));
  }

  async listByChat(chatId: string, limit: number): Promise<MessageWithSender[]> {
    const messages = await prisma.message.findMany({
      where: {
        chatId
      },
      include: {
        sender: true
      },
      orderBy: {
        createdAt: "desc"
      },
      take: limit
    });

    return messages.reverse().map((message) => ({
      id: message.id,
      chatId: message.chatId,
      senderId: message.senderId,
      content: message.content,
      createdAt: message.createdAt,
      sender: mapUser(message.sender)
    }));
  }

  async create(chatId: string, senderId: string, content: string): Promise<MessageWithSender> {
    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          chatId,
          senderId,
          content
        },
        include: {
          sender: true
        }
      }),
      prisma.chat.update({
        where: {
          id: chatId
        },
        data: {
          updatedAt: new Date()
        }
      })
    ]);

    return {
      id: message.id,
      chatId: message.chatId,
      senderId: message.senderId,
      content: message.content,
      createdAt: message.createdAt,
      sender: mapUser(message.sender)
    };
  }
}
