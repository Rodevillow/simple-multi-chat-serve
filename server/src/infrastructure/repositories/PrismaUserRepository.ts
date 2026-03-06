import type { User } from "../../domain/entities/User.js";
import type { CreateUserPayload, UserRepository } from "../../domain/repositories/UserRepository.js";
import { prisma } from "../db/prisma.js";

export class PrismaUserRepository implements UserRepository {
  async create(payload: CreateUserPayload): Promise<User> {
    const created = await prisma.user.create({
      data: {
        email: payload.email,
        nickname: payload.nickname,
        firstName: payload.firstName,
        lastName: payload.lastName,
        passwordHash: payload.passwordHash
      }
    });

    return created;
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: {
        email
      }
    });
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: {
        id
      }
    });
  }
}
