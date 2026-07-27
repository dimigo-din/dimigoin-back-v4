import { S3Client } from "@aws-sdk/client-s3";
import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CustomConfigModule } from "$modules/config.module";

export const R2 = Symbol("R2");

@Global()
@Module({
  imports: [CustomConfigModule],
  providers: [
    {
      provide: R2,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        new S3Client({
          region: "auto",
          endpoint: `https://${configService.get<string>("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
          credentials: {
            accessKeyId: configService.get<string>("R2_ACCESS_KEY_ID") ?? "",
            secretAccessKey: configService.get<string>("R2_SECRET_ACCESS_KEY") ?? "",
          },
        }),
    },
  ],
  exports: [R2],
})
export class R2Module {}
