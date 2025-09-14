import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Post, Query, Req } from '@nestjs/common';
import { CreateSubscriptionDto } from '../dto/push.dto';
import { PushManageService } from '../providers/push.manage.service';
import { ApiOperation } from '@nestjs/swagger';
import { ApiResponseFormat } from 'src/common/dto/response_format.dto';
import { PermissionGuard } from 'src/auth/guards/permission.guard';
import { CustomJwtAuthGuard } from 'src/auth/guards';
import { UseGuardsWithSwagger } from 'src/auth/guards/useGuards';
import { PermissionEnum } from 'src/common/mapper/permissions';

@Controller('manage/push')
@UseGuardsWithSwagger(CustomJwtAuthGuard, PermissionGuard([PermissionEnum.TEACHER]))
export class PushManageController {
  constructor(private readonly pushService: PushManageService) {}

  
  @ApiOperation({
    summary: "푸시 알림 전송",
    description: "특정 사용자들에게 푸시 알림을 전송합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.NO_CONTENT
  })
  @Post('send/user')
  async sendToUser(@Body() body: { userId: string[]; title?: string; body?: string; url?: string; data?: any }) {
    const payload = {
      title: body.title ?? '알림',
      body: body.body ?? '',
      url: body.url ?? '/',
      data: body.data ?? {},
    };

    if(!body.userId.length) return { ok: true, sent: 0, failed: 0 };

    if(body.userId.length === 1){
      const res = await this.pushService.sendToUser(body.userId[0], payload);
      return { ok: true, ...res };
    } else {
      const res = await this.pushService.sendToUsers(body.userId, payload);
      return { ok: true, ...res };
    }
  }

  @ApiOperation({
    summary: "푸시 알림 전송",
    description: "모든 사용자에게 푸시 알림을 전송합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.NO_CONTENT
  })
  @Post('send') // 테스트 발송: 전체
  async sendAll(@Body() body: { title?: string; body?: string; url?: string; data?: any }) {
    const payload = {
      title: body.title ?? '테스트 알림',
      body: body.body ?? '본문',
      url: body.url ?? '/',
      data: body.data ?? {},
    };
    const res = await this.pushService.sendToAll(payload);
    return { ok: true, results: res };
  }

  @ApiOperation({
    summary: "푸시 구독 정보 조회",
    description: "특정 사용자의 푸시 구독 정보를 조회합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.NO_CONTENT
  })
  @Get('userSubscriptions')
  async getUserSubscriptions(@Query('userId') userId: string) {
    const subscriptions = await this.pushService.getSubscriptionsByUser(userId);
    return { ok: true, subscriptions };
  }
}
