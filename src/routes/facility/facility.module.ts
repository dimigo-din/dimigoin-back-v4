import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import importToArray from "import-to-array";

import { FacilityImg, FacilityReport, FacilityReportComment, Login, User } from "../../schemas";
import { UserManageService } from "../user/providers";

import * as controllers from "./controllers";
import * as providers from "./providers";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Login, FacilityReport, FacilityReportComment, FacilityImg]),
  ],
  controllers: importToArray(controllers),
  providers: [...importToArray(providers), UserManageService],
  exports: importToArray(providers),
})
export class FacilityModule {}
