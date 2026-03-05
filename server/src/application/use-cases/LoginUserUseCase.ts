import { AppError } from "../../domain/errors/AppError.js";
import { toPublicUser } from "../../domain/entities/User.js";
import type { UserRepository } from "../../domain/repositories/UserRepository.js";
import type { PasswordHasher } from "../../domain/services/PasswordHasher.js";
import type { TokenService } from "../../domain/services/TokenService.js";

interface LoginUserInput {
  email: string;
  password: string;
}

export class LoginUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService
  ) {}

  async execute(input: LoginUserInput) {
    const email = input.email.trim().toLowerCase();
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new AppError("Неверный email или пароль", 401, "INVALID_CREDENTIALS");
    }

    const passwordMatches = await this.passwordHasher.compare(input.password, user.passwordHash);
    if (!passwordMatches) {
      throw new AppError("Неверный email или пароль", 401, "INVALID_CREDENTIALS");
    }

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
