import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import importToArray from "import-to-array";

import {
  Stay,
  StayApplyPeriod_Stay,
  StayApplyPeriod_StaySchedule,
  StaySchedule,
  StaySeatPreset,
  StaySeatPresetRange,
} from "../../schemas/stay.schema";

import * as controllers from "./controllers";
import * as providers from "./providers";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Stay,
      StaySeatPreset,
      StaySeatPresetRange,
      StaySchedule,
      StayApplyPeriod_Stay,
      StayApplyPeriod_StaySchedule,
    ]),
  ],
  controllers: importToArray(controllers),
  providers: [...importToArray(providers)],
  exports: importToArray(providers),
})
export class StayModule {}
