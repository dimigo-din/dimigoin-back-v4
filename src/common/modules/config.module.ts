import { Module } from "@nestjs/common";
import { ConfigModule, type ConfigModuleOptions } from "@nestjs/config";

export const options: ConfigModuleOptions = {
  isGlobal: true,
  // envFilePath:
  //   process.env.NODE_ENV === "test"
  //     ? ".env.test"
  //     : process.env.NODE_ENV === "dev"
  //       ? ".env.dev"
  //       : process.env.NODE_ENV === "prod"
  //         ? ".env.prod"
  //         : ".env",
  ignoreEnvFile: true,
};

@Module({ imports: [ConfigModule.forRoot(options)] })
export class CustomConfigModule {}
