import { AppError } from "../../domain/errors/AppError.js";
import { toPublicUser } from "../../domain/entities/User.js";
import type { UserRepository } from "../../domain/repositories/UserRepository.js";
import type { PasswordHasher } from "../../domain/services/PasswordHasher.js";
import type { TokenService } from "../../domain/services/TokenService.js";

interface RegisterUserInput {
  email: string;
  password: string;
  nickname?: string;
  firstName?: string;
  lastName?: string;
}

export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService
  ) {}

  async execute(input: RegisterUserInput) {
    const email = input.email.trim().toLowerCase();
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new AppError("Пользователь с таким email уже существует", 409, "EMAIL_TAKEN");
    }

    const passwordHash = await this.passwordHasher.hash(input.password);

    const user = await this.userRepository.create({
      email,
      nickname: input.nickname?.trim() || undefined,
      firstName: input.firstName?.trim() || undefined,
      lastName: input.lastName?.trim() || undefined,
      passwordHash
    });

    const token = this.tokenService.sign({
      sub: user.id,
      email: user.email
    });

    return {
      token,
      user: toPublicUser(user)
    };
  }
}
