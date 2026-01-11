import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import importToArray from "import-to-array";
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
  controllers: importToArray(controllers),
  providers: [...importToArray(providers), UserManageService],
  exports: importToArray(providers),
})
export class WakeupModule {}
