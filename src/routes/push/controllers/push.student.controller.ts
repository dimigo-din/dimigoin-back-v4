import { Body, Controller, Delete, Get, HttpStatus, Patch, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CustomJwtAuthGuard } from 'src/auth/guards';
import { PermissionGuard } from 'src/auth/guards/permission.guard';
import { UseGuardsWithSwagger } from 'src/auth/guards/useGuards';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { ApiResponseFormat } from 'src/common/dto/response_format.dto';
import { PermissionEnum } from 'src/common/mapper/permissions';
import { PushSubject, PushSubscription, type User } from '../../../schemas';
import {
  type CreateFCMTokenDTO,
  type DeleteFCMTokenDTO,
  type GetSubscribedSubjectDTO,
  PushNotificationSubjectsResponseDTO,
  type SetSubscribeSubjectDTO,
} from '../dto/push.student.dto';
import type { PushStudentService } from '../providers';

@ApiTags('Push Student')
@Controller('/student/push')
@UseGuardsWithSwagger(CustomJwtAuthGuard, PermissionGuard([PermissionEnum.STUDENT]))
export class PushStudentController {
  constructor(private readonly pushService: PushStudentService) {}

  @ApiOperation({
    summary: '푸쉬 알림 구독',
    description: '앱 푸시알림을 위한 FCM 토큰을 등록합니다.',
  })
  @ApiResponseFormat({
    status: HttpStatus.CREATED,
    type: PushSubscription,
  })
  @Put('/subscribe')
  async createFCMToken(@CurrentUser() user: User, @Body() data: CreateFCMTokenDTO) {
    return await this.pushService.upsertToken(user, data);
  }

  @ApiOperation({
    summary: '푸쉬 알림 구독 해제',
    description: '앱 푸시알림을 위한 FCM 토큰을 등록 해제합니다.',
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: PushSubscription,
  })
  @Delete('/subscribe')
  async removeFCMToken(@CurrentUser() user: User, @Body() data: DeleteFCMTokenDTO) {
    return await this.pushService.removeToken(user, data);
  }

  @ApiOperation({
    summary: '푸시 구독 전체 해제',
    description: '사용자가 구독한 모든 기기의 푸시 알림 구독을 해지합니다.',
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: [PushSubscription],
  })
  @Delete('/unsubscribe/all')
  async unsubscribeAll(@CurrentUser() user: User) {
    return await this.pushService.removeAllByUser(user);
  }

  @ApiOperation({
    summary: '푸쉬 구독 Subject 목록',
    description: '푸쉬 구독 Subject 목록을 불러옵니다. identifier와 이름이 반환됩니다.',
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: PushNotificationSubjectsResponseDTO,
  })
  @Get('/subjects')
  async getSubjects() {
    return await this.pushService.getSubjects();
  }

  @ApiOperation({
    summary: '구독된 푸쉬 Subject 목록',
    description: '특정 디바이스에서 구독된 푸쉬 Subject 목록을 불러옵니다.',
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: [PushSubject],
  })
  @Get('/subjects/subscribed')
  async getSubscribedSubject(@CurrentUser() user: User, @Query() data: GetSubscribedSubjectDTO) {
    return await this.pushService.getSubscribedSubject(user, data);
  }

  @ApiOperation({
    summary: '푸쉬 Subject 구독 설정',
    description:
      '특정 디바이스에 대한 푸쉬 Subject 구독 목록을 설정합니다. 빈 배열이 들어오면 해당 기기는 자동 발송되는 푸쉬알림을 받지 않습니다.',
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: [PushSubject],
  })
  @Patch('/subjects/subscribed')
  async setSubscribeSubject(@CurrentUser() user: User, @Body() data: SetSubscribeSubjectDTO) {
    return await this.pushService.setSubscribeSubject(user, data);
  }
}
