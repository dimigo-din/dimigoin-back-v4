import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TypeOrmModule, TypeOrmModuleAsyncOptions } from "@nestjs/typeorm";
import importToArray from "import-to-array";

import * as entities from "src/schemas";

import { CustomConfigModule } from "./config.module";

const typeOrmModuleOptions: TypeOrmModuleAsyncOptions = {
  imports: [CustomConfigModule],
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => {
    return {
      type: "postgres" as const,
      host: configService.get<string>("DB_HOST"),
      port: configService.get<number>("DB_PORT"),
      username: configService.get<string>("DB_USER"),
      password: configService.get<string>("DB_PASS"),
      database: configService.get<string>("DB_NAME"),
      entities: importToArray(entities),
      synchronize: true,
      // logging: true,
      // dropSchema: true,
    };
  },
};

@Module({ imports: [TypeOrmModule.forRootAsync(typeOrmModuleOptions)] })
export class CustomDatabaseModule {}
