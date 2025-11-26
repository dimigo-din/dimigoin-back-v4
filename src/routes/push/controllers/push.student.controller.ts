import { Body, Controller, Delete, HttpCode, HttpStatus, Post, Put, Query, Req } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { CustomJwtAuthGuard } from "src/auth/guards";
import { PermissionGuard } from "src/auth/guards/permission.guard";
import { UseGuardsWithSwagger } from "src/auth/guards/useGuards";
import { ApiResponseFormat } from "src/common/dto/response_format.dto";
import { PermissionEnum } from "src/common/mapper/permissions";

import { PushSubscription } from "../../../schemas";
import { CreateFCMTokenDTO, DeleteFCMTokenDTO } from "../dto/push.student.dto";
import { PushStudentService } from "../providers/push.student.service";

@ApiTags("Push Student")
@Controller("/student/push")
@UseGuardsWithSwagger(CustomJwtAuthGuard, PermissionGuard([PermissionEnum.STUDENT]))
export class PushStudentController {
  constructor(private readonly pushService: PushStudentService) {}

  @ApiOperation({
    summary: "FCM 토큰 등록",
    description: "앱 푸시알림을 위한 FCM 토큰을 등록합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.CREATED,
    type: PushSubscription,
  })
  @Put("/fcm-token")
  async createFCMToken(@Req() req: any, @Body() data: CreateFCMTokenDTO) {
    return await this.pushService.upsertToken(req.user, data);
  }

  @ApiOperation({
    summary: "FCM 토큰 등록 해제",
    description: "앱 푸시알림을 위한 FCM 토큰을 등록 해제합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.NO_CONTENT,
    type: PushSubscription,
  })
  @Delete("/fcm-token")
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeFCMToken(@Body() data: DeleteFCMTokenDTO) {
    return await this.pushService.removeToken(data);
  }

  @ApiOperation({
    summary: "푸시 구독 전체 해지",
    description: "사용자가 구독한 모든 기기의 푸시 알림 구독을 해지합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.NO_CONTENT,
    type: [PushSubscription],
  })
  @Delete("/unsubscribe/all")
  @HttpCode(HttpStatus.NO_CONTENT)
  async unsubscribeAll(@Req() req: any) {
    return await this.pushService.removeAllByUser(req.user);
  }
}
