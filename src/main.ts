import * as process from "node:process";

import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import * as cookieParser from "cookie-parser";
import { json } from "express";
import importToArray from "import-to-array";

import { AppModule } from "./app";
import * as interceptors from "./common/interceptors";
import { CustomSwaggerSetup } from "./common/modules/swagger.module";
import { ValidationService } from "./common/modules/validation.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  app.enableCors({
    origin:
      process.env.NODE_ENV === "prod"
        ? configService
            .get<string>("ALLOWED_DOMAIN")
            .split(",")
            .map((d) => `https://${d}`)
        : configService
            .get<string>("ALLOWED_DOMAIN")
            .split(",")
            .map((d) => `http://${d}`),
    credentials: true,
  });
  app.use(cookieParser());
  app.use(json({ limit: "5000mb" }));
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(...importToArray(interceptors).map((i) => new i()));

  await CustomSwaggerSetup(app);

  const port = configService.get<number>("APPLICATION_PORT");
  await app.listen(port);

  const validationService = app.get<ValidationService>(ValidationService);
  await validationService.validatePermissionEnum();
  await validationService.validateSession();
}

bootstrap();
