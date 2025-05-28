import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import importToArray from "import-to-array";

import {
  FacilityImg,
  FacilityReport,
  FacilityReportComment,
  Login,
  PersonalInformationSchema,
  User,
} from "../../schemas";

import * as controllers from "./controllers";
import * as providers from "./providers";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Login,
      FacilityReport,
      FacilityReportComment,
      FacilityImg,
      PersonalInformationSchema, // temporally
    ]),
  ],
  controllers: importToArray(controllers),
  providers: [...importToArray(providers)],
  exports: importToArray(providers),
})
export class FacilityModule {}
