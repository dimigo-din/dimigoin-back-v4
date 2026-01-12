import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Login, User, WakeupSongApplication, WakeupSongHistory, WakeupSongVote } from "#/schemas";
import { CustomCacheModule } from "$modules/cache.module";
import { UserManageService } from "~user/providers";

import * as controllers from "./controllers";
import * as providers from "./providers";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Login,
      WakeupSongApplication,
      WakeupSongVote,
      WakeupSongHistory,
    ]),
    CustomCacheModule,
  ],
  controllers: Object.values(controllers),
  providers: [...Object.values(providers), UserManageService],
  exports: Object.values(providers),
})
export class WakeupModule {}
