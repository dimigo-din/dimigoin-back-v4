import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { JwtModuleAsyncOptions } from "@nestjs/jwt";
import { JwtModule } from "@nestjs/jwt";

import { CustomConfigModule } from "./config.module";

export const JWTOptions: JwtModuleAsyncOptions = {
  imports: [CustomConfigModule],
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => ({
    publicKey: configService.get<string>("JWT_PUBLIC"),
    privateKey: configService.get<string>("JWT_PRIVATE"),
    global: true,
    signOptions: {
      algorithm: "RS256",
    },
  }),
};

@Global()
@Module({
  imports: [JwtModule.registerAsync(JWTOptions)],
  exports: [JwtModule],
})
export class CustomJWTModule {}
