import { UserJWT } from "../src/common/mapper/types";
import { User } from "../src/schemas";

export type UserMock = {
  user: User | UserJWT;
  jwt: string;
  save: () => Promise<UserMock> | null;
  delete: () => Promise<UserMock> | null;
};
