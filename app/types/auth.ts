export interface AuthUserDto {
  id: string;
  nickname: string;
  email: string;
  locale: "uk" | "en" | "ru";
  avatar_url: string | null;
}

export interface AuthTokensDto {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export type AuthResponseDto = AuthTokensDto & {
  user: AuthUserDto;
};
