import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PushSubscription } from '../../schemas';
import { PushStudentService } from './providers/push.student.service';
import { PushManageService } from './providers/push.manage.service';
import { PushStudentController } from './controllers/push.student.controller';
import { PushManageController } from './controllers/push.manage.controller';

import {User} from "../../schemas";

@Module({
  imports: [TypeOrmModule.forFeature([User, PushSubscription])],
  controllers: [PushStudentController, PushManageController],
  providers: [PushStudentService, PushManageService],
  exports: [PushStudentService, PushManageService],
})
export class PushModule {}
