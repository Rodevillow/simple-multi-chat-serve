import { createServer } from "node:http";
import { RegisterUserUseCase } from "./application/use-cases/RegisterUserUseCase.js";
import { LoginUserUseCase } from "./application/use-cases/LoginUserUseCase.js";
import { ListChatsUseCase } from "./application/use-cases/ListChatsUseCase.js";
import { CreateDirectChatUseCase } from "./application/use-cases/CreateDirectChatUseCase.js";
import { ListMessagesUseCase } from "./application/use-cases/ListMessagesUseCase.js";
import { SendMessageUseCase } from "./application/use-cases/SendMessageUseCase.js";
import { config } from "./infrastructure/config/env.js";
import { PrismaChatRepository } from "./infrastructure/repositories/PrismaChatRepository.js";
import { PrismaUserRepository } from "./infrastructure/repositories/PrismaUserRepository.js";
import { BcryptPasswordHasher } from "./infrastructure/security/BcryptPasswordHasher.js";
import { JwtTokenService } from "./infrastructure/security/JwtTokenService.js";
import { createApp } from "./presentation/http/createApp.js";
import { SocketMessageNotifier } from "./presentation/socket/SocketMessageNotifier.js";
import { createSocketServer } from "./presentation/socket/createSocketServer.js";

const userRepository = new PrismaUserRepository();
const chatRepository = new PrismaChatRepository();
const passwordHasher = new BcryptPasswordHasher();
const tokenService = new JwtTokenService();

const registerUserUseCase = new RegisterUserUseCase(userRepository, passwordHasher, tokenService);
const loginUserUseCase = new LoginUserUseCase(userRepository, passwordHasher, tokenService);
const listChatsUseCase = new ListChatsUseCase(chatRepository);
const createDirectChatUseCase = new CreateDirectChatUseCase(userRepository, chatRepository);
const listMessagesUseCase = new ListMessagesUseCase(chatRepository, chatRepository);

const notifier = new SocketMessageNotifier(chatRepository);
const sendMessageUseCase = new SendMessageUseCase(chatRepository, chatRepository, notifier);

const app = createApp({
  tokenService,
  registerUserUseCase,
  loginUserUseCase,
  listChatsUseCase,
  createDirectChatUseCase,
  listMessagesUseCase,
  sendMessageUseCase
});

const httpServer = createServer(app);
const io = createSocketServer(httpServer, {
  tokenService,
  chatRepository
});

notifier.attach(io);

httpServer.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Chat API started on http://localhost:${config.port}`);
});
