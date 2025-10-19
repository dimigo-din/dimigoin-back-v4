import * as process from "node:process";

import { INestApplication, Logger } from "@nestjs/common";
import { DocumentBuilder, SwaggerCustomOptions, SwaggerModule } from "@nestjs/swagger";
import { SwaggerTheme, SwaggerThemeNameEnum } from "swagger-themes";

import { AppService } from "src/app/app.service";

export const CustomSwaggerSetup = async (app: INestApplication) => {
  const logger = new Logger(CustomSwaggerSetup.name);

  if (process.env.NODE_ENV !== "dev") {
    logger.log("Swagger not initializing in production");
    return;
  }

  const cluster = await new AppService().getBackendInfo();
  const config = new DocumentBuilder()
    .setTitle(cluster.name)
    .setDescription(cluster.description)
    .setVersion(cluster.version)
    .addBearerAuth(
      {
        description: "Please enter token in following format: Bearer [JWT]",
        name: "Authorization",
        bearerFormat: "Bearer",
        scheme: "Bearer",
        type: "http",
        in: "Header",
      },
      "access-token",
    )
    // .addSecurityRequirements("access-token")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  const theme = new SwaggerTheme();
  const options: SwaggerCustomOptions = {
    explorer: false,
    customSiteTitle: cluster.name,
    customCss: theme.getBuffer(SwaggerThemeNameEnum.DARK),
  };

  SwaggerModule.setup("api-docs", app, document, options);
  logger.log("Swagger Initialized");
};
