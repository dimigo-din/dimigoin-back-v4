import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app";
import {
  DIMINotFoundFilter,
  DIMISwaggerSetup,
  DIMIWrapperInterceptor,
  DIMIValidationPipe,
} from "./common";

import helmet from "helmet";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.use(helmet({ contentSecurityPolicy: false }));

  app.useGlobalPipes(DIMIValidationPipe());
  app.useGlobalFilters(new DIMINotFoundFilter());
  app.useGlobalInterceptors(new DIMIWrapperInterceptor());

  await DIMISwaggerSetup(app);

  await app.listen(3000);
}

bootstrap();
