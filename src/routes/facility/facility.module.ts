import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FacilityImg, FacilityReport, FacilityReportComment, Login, User } from "#/schemas";
import { UserModule } from "~user/user.module";

import * as controllers from "./controllers";
import * as providers from "./providers";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Login, FacilityReport, FacilityReportComment, FacilityImg]),
    UserModule,
  ],
  controllers: Object.values(controllers),
  providers: [...Object.values(providers)],
  exports: Object.values(providers),
})
export class FacilityModule {}
