import { describe, expect, it } from "vitest";
import { RegisterUserUseCase } from "../../src/application/use-cases/RegisterUserUseCase.js";
import { AppError } from "../../src/domain/errors/AppError.js";
import type { User } from "../../src/domain/entities/User.js";
import type { CreateUserPayload, UserRepository } from "../../src/domain/repositories/UserRepository.js";
import type { PasswordHasher } from "../../src/domain/services/PasswordHasher.js";
import type { TokenPayload, TokenService } from "../../src/domain/services/TokenService.js";

class InMemoryUserRepository implements UserRepository {
  private users: User[] = [];

  async create(payload: CreateUserPayload): Promise<User> {
    const user: User = {
      id: crypto.randomUUID(),
      email: payload.email,
      nickname: payload.nickname ?? null,
      firstName: payload.firstName ?? null,
      lastName: payload.lastName ?? null,
      passwordHash: payload.passwordHash,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.users.push(user);
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find((user) => user.email === email) ?? null;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.find((user) => user.id === id) ?? null;
  }
}

class FakeHasher implements PasswordHasher {
  async hash(plain: string): Promise<string> {
    return `hashed:${plain}`;
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return hash === `hashed:${plain}`;
  }
}

class FakeTokenService implements TokenService {
  sign(payload: TokenPayload): string {
    return `token:${payload.sub}`;
  }

  verify(token: string): TokenPayload {
    const userId = token.replace("token:", "");
    return { sub: userId, email: "test@example.com" };
  }
}

describe("RegisterUserUseCase", () => {
  it("creates user and returns token with public profile", async () => {
    const useCase = new RegisterUserUseCase(new InMemoryUserRepository(), new FakeHasher(), new FakeTokenService());

    const result = await useCase.execute({
      email: "USER@Example.com",
      password: "secret123",
      nickname: "neo"
    });

    expect(result.token).toContain("token:");
    expect(result.user.email).toBe("user@example.com");
    expect(result.user.nickname).toBe("neo");
  });

  it("throws conflict when email already exists", async () => {
    const userRepo = new InMemoryUserRepository();
    const useCase = new RegisterUserUseCase(userRepo, new FakeHasher(), new FakeTokenService());

    await useCase.execute({
      email: "user@example.com",
      password: "secret123"
    });

    await expect(
      useCase.execute({
        email: "user@example.com",
        password: "another-pass"
      })
    ).rejects.toMatchObject<AppError>({
      code: "EMAIL_TAKEN",
      statusCode: 409
    });
  });
});
