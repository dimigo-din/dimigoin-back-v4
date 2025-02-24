import type { INestApplication } from "@nestjs/common";

import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import { AppService } from "src/app/app.service";

export const CustomSwaggerSetup = async (app: INestApplication) => {
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
  const options = {
    explorer: false,
    customSiteTitle: cluster.name,
  };
  SwaggerModule.setup("api-docs", app, document, options);
};
