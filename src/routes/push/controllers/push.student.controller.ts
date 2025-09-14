import { Body, Controller, Delete, HttpCode, HttpStatus, Post, Query, Req } from '@nestjs/common';
import { CreateSubscriptionDto } from '../dto/push.dto';
import { PushStudentService } from '../providers/push.student.service';
import { ApiOperation } from '@nestjs/swagger';
import { ApiResponseFormat } from 'src/common/dto/response_format.dto';
import { PermissionEnum } from 'src/common/mapper/permissions';
import { PermissionGuard } from 'src/auth/guards/permission.guard';
import { CustomJwtAuthGuard } from 'src/auth/guards';
import { UseGuardsWithSwagger } from 'src/auth/guards/useGuards';

@Controller('student/push')
@UseGuardsWithSwagger(CustomJwtAuthGuard, PermissionGuard([PermissionEnum.STUDENT]))
export class PushStudentController {
  constructor(private readonly pushService: PushStudentService) {}

  @ApiOperation({
    summary: "푸시 구독",
    description: "푸시 알림 구독을 생성합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.CREATED
  })
  @Post('subscribe')
  async subscribe(@Req() req, @Body() data: CreateSubscriptionDto) {
    await this.pushService.upsertSubscription(req.user, data);
    return { ok: true };
  }

  @ApiOperation({
    summary: "푸시 구독 해지",
    description: "푸시 알림 구독을 해지합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.NO_CONTENT
  })
  @Delete('subscribe')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unsubscribe(@Query('endpoint') endpoint: string) {
    await this.pushService.removeByEndpoint(endpoint);
  }

  @ApiOperation({
    summary: "푸시 구독 전체 해지",
    description: "사용자가 구독한 모든 기기의 푸시 알림 구독을 해지합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.NO_CONTENT
  })
  @Delete('unsubscribe-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unsubscribeAll(@Req() req: any) {
    await this.pushService.removeAllByUser(req.user);
  }
}
