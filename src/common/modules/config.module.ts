import { Module } from "@nestjs/common";
import { ConfigModule, ConfigModuleOptions } from "@nestjs/config";

export const options: ConfigModuleOptions = {
  isGlobal: true,
  ignoreEnvFile: true,
};

@Module({ imports: [ConfigModule.forRoot(options)] })
export class CustomConfigModule {}
