import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import importToArray from "import-to-array";
import { AuthModule } from "src/auth";
import { CustomLoggerInterceptor } from "src/common/interceptors";
import { CustomEssentialModules } from "src/common/modules";
import * as routes from "src/routes";

import { AppService } from "./app.service";

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
