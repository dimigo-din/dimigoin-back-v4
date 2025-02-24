import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { json } from "express";

import { AppModule } from "./app";
import { CustomSwaggerSetup } from "./common/modules/swagger.module";
import { ValidationService } from "./common/modules/validation.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  app.enableCors();
  app.use(json({ limit: "5000mb" }));
  app.useGlobalPipes(new ValidationPipe());
  app.useWebSocketAdapter(new IoAdapter(app));

  await CustomSwaggerSetup(app);

  const port = configService.get("PORT");
  await app.listen(port);

  const validationService = app.get<ValidationService>(ValidationService);
  await validationService.validatePermissionEnum();
  await validationService.validateSession();
}

bootstrap();
