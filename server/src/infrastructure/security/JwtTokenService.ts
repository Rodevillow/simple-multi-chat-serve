import jwt from "jsonwebtoken";
import { config } from "../config/env.js";
import type { TokenPayload, TokenService } from "../../domain/services/TokenService.js";

export class JwtTokenService implements TokenService {
  sign(payload: TokenPayload): string {
    return jwt.sign(payload, config.jwtSecret, {
      expiresIn: "30d"
    });
  }

  verify(token: string): TokenPayload {
    const decoded = jwt.verify(token, config.jwtSecret);

    if (typeof decoded === "string" || !decoded.sub || !decoded.email) {
      throw new Error("Invalid token payload");
    }

    return {
      sub: String(decoded.sub),
      email: String(decoded.email)
    };
  }
}
