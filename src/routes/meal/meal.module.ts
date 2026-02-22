import { Module } from "@nestjs/common";
import { UserModule } from "#/routes/user/user.module";
import * as controllers from "./controllers";
import * as providers from "./providers";

@Module({
  imports: [UserModule],
  controllers: Object.values(controllers),
  providers: [...Object.values(providers)],
})
export class MealModule {}
