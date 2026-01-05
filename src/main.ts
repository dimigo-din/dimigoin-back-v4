import * as process from "node:process";
import fastifyCookie from "@fastify/cookie";
import fastifyMultipart from "@fastify/multipart";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import importToArray from "import-to-array";

import { AppModule } from "./app";
import * as interceptors from "./common/interceptors";
import { CustomSwaggerSetup } from "./common/modules/swagger.module";
import { ValidationService } from "./common/modules/validation.module";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      bodyLimit: 50 * 1024 * 1024,
    }),
  );

  const configService = app.get(ConfigService);

  app.enableCors({
    origin:
      process.env.NODE_ENV !== "dev"
        ? configService
            .get<string>("ALLOWED_DOMAIN")
            ?.split(",")
            .map((d) => `https://${d}`)
        : configService
            .get<string>("ALLOWED_DOMAIN")
            ?.split(",")
            .map((d) => `http://${d}`),
    credentials: true,
  });

  await app.register(fastifyCookie);
  await app.register(fastifyMultipart, {
    limits: {
      fileSize: 20 * 1024 * 1024,
      files: 5,
    },
  });

  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useGlobalInterceptors(...importToArray(interceptors).map((i) => new i()));

  await CustomSwaggerSetup(app);

  const port = configService.get<number>("APPLICATION_PORT") ?? 3000;
  await app.listen(port, "0.0.0.0");

  const validationService = app.get<ValidationService>(ValidationService);
  await validationService.validatePermissionEnum();
  await validationService.validateSession();
  await validationService.validateLaundrySchedulePriority();
}

bootstrap();
