import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import importToArray from "import-to-array";
import { AuthModule } from "#/auth";
import * as routes from "#/routes";
import { AppService } from "#app/app.service";
import { CustomLoggerInterceptor } from "$/interceptors";
import { CustomEssentialModules } from "$/modules";

@Module({
  imports: [...CustomEssentialModules, AuthModule, ...importToArray(routes)],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: CustomLoggerInterceptor,
    },
  ],
})
export class AppModule {}
