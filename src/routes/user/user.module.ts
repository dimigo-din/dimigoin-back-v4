import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import importToArray from "import-to-array";

import { AuthModule } from "../../auth";
import { LaundryApply, Login, StayApply, User } from "../../schemas";
import { PersonalInformationSchema } from "../../schemas/personal-information.schema";

import * as controllers from "./controllers";
import * as providers from "./providers";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Login, StayApply, LaundryApply, PersonalInformationSchema]),
    forwardRef(() => AuthModule),
  ],
  controllers: importToArray(controllers),
  providers: [...importToArray(providers)],
  exports: importToArray(providers),
})
export class UserModule {}
