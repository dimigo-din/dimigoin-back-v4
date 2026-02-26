import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { AuthModule } from "#/auth";
import * as routes from "#/routes";
import { AppService } from "#app/app.service";
import { HealthController } from "#app/health.controller";
import { CustomLoggerInterceptor } from "$/interceptors";
import { CustomEssentialModules } from "$/modules";

@Module({
  imports: [...CustomEssentialModules, AuthModule, ...Object.values(routes)],
  controllers: [HealthController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: CustomLoggerInterceptor,
    },
  ],
})
export class AppModule {}
