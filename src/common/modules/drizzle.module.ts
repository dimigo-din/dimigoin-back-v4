import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SQL } from "bun";
import { drizzle } from "drizzle-orm/bun-sql";
import { relations, schema } from "#/db";
import { CustomConfigModule } from "$modules/config.module";

export const DRIZZLE = Symbol("DRIZZLE");

export type DrizzleDB = ReturnType<typeof drizzle<typeof schema, typeof relations>>;

@Global()
@Module({
  imports: [CustomConfigModule],
  providers: [
    {
      provide: DRIZZLE,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const client = new SQL({
          hostname: configService.get<string>("DB_HOST"),
          port: configService.get<number>("DB_PORT"),
          username: configService.get<string>("DB_USER"),
          password: configService.get<string>("DB_PASS"),
          database: configService.get<string>("DB_NAME"),
        });
        return drizzle({
          client,
          schema,
          relations,
          logger: Bun.env.NODE_ENV !== "prod",
        });
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DrizzleModule {}
