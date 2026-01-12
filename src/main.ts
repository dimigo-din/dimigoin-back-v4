import fastifyCompress from '@fastify/compress';
import fastifyCookie from "@fastify/cookie";
import fastifyMultipart from "@fastify/multipart";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";

import { AppModule } from "#/app";
import * as interceptors from "$/interceptors";
import { CustomSwaggerSetup } from "$modules/swagger.module";
import { ValidationService } from "$modules/validation.module";
import { ClusterLogger } from "$utils/logger.util";

export async function bootstrap(isInit: boolean = true) {
  const logger = new ClusterLogger(isInit);
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      bodyLimit: 50 * 1024 * 1024,
    }),
    { logger },
  );

  const configService = app.get(ConfigService);

  app.enableCors({
    origin:
      Bun.env.NODE_ENV !== "dev"
        ? configService
            .get<string>("ALLOWED_DOMAIN")
            ?.split(",")
            .map((d) => `https://${d}`)
        : configService
            .get<string>("ALLOWED_DOMAIN")
            ?.split(",")
            .map((d) => `http://${d}`),
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PUT", "DELETE", "PATCH"],
  });

  await app.register(fastifyCompress, {
    encodings: ['gzip', 'deflate'],
  });
  await app.register(fastifyCookie);
  await app.register(fastifyMultipart, {
    limits: {
      fileSize: 20 * 1024 * 1024,
      files: 5,
    },
  });

  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useGlobalInterceptors(...Object.values(interceptors).map((i) => new i()));

  await CustomSwaggerSetup(app);

  const port = configService.get<number>("APPLICATION_PORT") ?? 3000;
  await app.listen(port, "0.0.0.0");

  if (isInit) {
    const validationService = app.get<ValidationService>(ValidationService);
    await validationService.validatePermissionEnum();
    await validationService.validateSession();
    await validationService.validateLaundrySchedulePriority();
  }
}

if (import.meta.main) {
  bootstrap();
}
