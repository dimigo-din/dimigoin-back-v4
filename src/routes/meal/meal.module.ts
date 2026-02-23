import { Module } from "@nestjs/common";
import { PushModule } from "#/routes/push/push.module";
import { UserModule } from "#/routes/user/user.module";
import * as controllers from "./controllers";
import * as providers from "./providers";

@Module({
  imports: [UserModule, PushModule],
  controllers: Object.values(controllers),
  providers: [...Object.values(providers)],
})
export class MealModule {}
