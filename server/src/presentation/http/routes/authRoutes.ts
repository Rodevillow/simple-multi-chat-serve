import { Router } from "express";
import { z } from "zod";
import { AppError } from "../../../domain/errors/AppError.js";
import type { LoginUserUseCase } from "../../../application/use-cases/LoginUserUseCase.js";
import type { RegisterUserUseCase } from "../../../application/use-cases/RegisterUserUseCase.js";
import { serializeUser } from "../serializers.js";

interface AuthRoutesDeps {
  registerUserUseCase: RegisterUserUseCase;
  loginUserUseCase: LoginUserUseCase;
}

const registerSchema = z
  .object({
    email: z.string().email("Некорректный email"),
    nickname: z.string().trim().max(40).optional().or(z.literal("")),
    firstName: z.string().trim().max(60).optional().or(z.literal("")),
    lastName: z.string().trim().max(60).optional().or(z.literal("")),
    password: z.string().min(6, "Минимум 6 символов"),
    passwordRepeat: z.string().min(6, "Минимум 6 символов")
  })
  .refine((data) => data.password === data.passwordRepeat, {
    message: "Пароли не совпадают",
    path: ["passwordRepeat"]
  });

const loginSchema = z.object({
  email: z.string().email("Некорректный email"),
  password: z.string().min(1, "Введите пароль")
});

const zodErrorMessage = (error: z.ZodError) => {
  return error.issues[0]?.message ?? "Ошибка валидации";
};

export const createAuthRoutes = ({ registerUserUseCase, loginUserUseCase }: AuthRoutesDeps) => {
  const router = Router();

  router.post("/register", async (request, response, next) => {
    try {
      const body = registerSchema.parse(request.body);
      const result = await registerUserUseCase.execute({
        email: body.email,
        nickname: body.nickname || undefined,
        firstName: body.firstName || undefined,
        lastName: body.lastName || undefined,
        password: body.password
      });

      response.status(201).json({
        token: result.token,
        user: serializeUser(result.user)
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(zodErrorMessage(error), 400, "VALIDATION_ERROR"));
      }
      return next(error);
    }
  });

  router.post("/login", async (request, response, next) => {
    try {
      const body = loginSchema.parse(request.body);
      const result = await loginUserUseCase.execute(body);
      response.status(200).json({
        token: result.token,
        user: serializeUser(result.user)
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(zodErrorMessage(error), 400, "VALIDATION_ERROR"));
      }
      return next(error);
    }
  });

  return router;
};
