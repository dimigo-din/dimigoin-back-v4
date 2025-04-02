import { User } from "../src/schemas";

export type UserMock = { user: User; jwt: string; save: () => Promise<User> };
