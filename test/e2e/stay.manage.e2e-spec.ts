import { INestApplication } from "@nestjs/common";

import { getApp } from "../app.e2e";
import { AdminUserMock } from "../mocks/user.mock";

describe("Stay Manage", () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await getApp();
  });

  it("should defined", () => {
    expect(app).toBeDefined();
  });

  it("should ", async () => {
    const userMock = await AdminUserMock;
    const user = await userMock.save();

    console.log(user);
  });
});
