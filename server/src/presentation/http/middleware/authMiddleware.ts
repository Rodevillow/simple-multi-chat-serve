import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../../domain/errors/AppError.js";
import type { TokenService } from "../../../domain/services/TokenService.js";

export interface AuthedRequest extends Request {
  auth?: {
    userId: string;
    email: string;
  };
}

export const createAuthMiddleware = (tokenService: TokenService) => {
  return (request: AuthedRequest, _response: Response, next: NextFunction) => {
    const header = request.header("Authorization");
    if (!header || !header.startsWith("Bearer ")) {
      return next(new AppError("Требуется авторизация", 401, "UNAUTHORIZED"));
    }

    const token = header.slice("Bearer ".length);

    try {
      const payload = tokenService.verify(token);
      request.auth = {
        userId: payload.sub,
        email: payload.email
      };
      return next();
    } catch {
      return next(new AppError("Неверный токен", 401, "INVALID_TOKEN"));
    }
  };
};
