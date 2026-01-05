import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import importToArray from 'import-to-array';

import { FacilityImg, FacilityReport, FacilityReportComment, Login, User } from '../../schemas';
import { UserModule } from '../user/user.module';

import * as controllers from './controllers';
import * as providers from './providers';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Login, FacilityReport, FacilityReportComment, FacilityImg]),
    UserModule,
  ],
  controllers: importToArray(controllers),
  providers: [...importToArray(providers)],
  exports: importToArray(providers),
})
export class FacilityModule {}
