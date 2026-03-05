import type { User } from "../entities/User.js";

export interface CreateUserPayload {
  email: string;
  nickname?: string;
  firstName?: string;
  lastName?: string;
  passwordHash: string;
}

export interface UserRepository {
  create(payload: CreateUserPayload): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
}
