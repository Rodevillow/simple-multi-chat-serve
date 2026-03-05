export interface User {
  id: string;
  email: string;
  nickname: string | null;
  firstName: string | null;
  lastName: string | null;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export type PublicUser = Pick<User, "id" | "email" | "nickname" | "firstName" | "lastName">;

export const toPublicUser = (user: User): PublicUser => {
  return {
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    firstName: user.firstName,
    lastName: user.lastName
  };
};

export const resolveUserLabel = (user: Pick<User, "email" | "nickname" | "firstName" | "lastName">) => {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return user.nickname || fullName || user.email;
};
