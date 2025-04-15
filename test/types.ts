import { User } from "../src/schemas";

export type UserMock = {
  user: User;
  jwt: string;
  save: () => Promise<UserMock> | null;
  delete: () => Promise<UserMock> | null;
};
