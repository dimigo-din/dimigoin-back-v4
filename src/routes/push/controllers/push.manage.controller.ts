import { Body, Controller, Get, HttpStatus, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { CustomJwtAuthGuard } from "#auth/guards";
import { PermissionGuard } from "#auth/guards/permission.guard";
import { UseGuardsWithSwagger } from "#auth/guards/useGuards";
import { ApiResponseFormat } from "$dto/response_format.dto";
import { PermissionEnum } from "$mapper/permissions";
import {
  GetSubscriptionsByUserDTO,
  PushNotificationPayloadDTO,
  PushNotificationResultResponseDTO,
  PushNotificationToSpecificDTO,
} from "~push/dto/push.manage.dto";
import { PushManageService } from "~push/providers";

@ApiTags("Push Manage")
@Controller("/manage/push")
@UseGuardsWithSwagger(CustomJwtAuthGuard, PermissionGuard([PermissionEnum.TEACHER]))
export class PushManageController {
  constructor(private readonly pushService: PushManageService) {}

  @ApiOperation({
    summary: "푸시 알림 전송",
    description: "특정 사용자들에게 푸시 알림을 전송합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.NO_CONTENT,
    type: PushNotificationResultResponseDTO,
  })
  @Post("/send/user")
  async sendToUser(@Body() data: PushNotificationToSpecificDTO) {
    return await this.pushService.sendToSpecificUsers(data);
  }

  @ApiOperation({
    summary: "푸시 알림 전송",
    description: "모든 사용자에게 푸시 알림을 전송합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.NO_CONTENT,
    type: PushNotificationResultResponseDTO,
  })
  @Post("/send")
  async sendAll(@Body() data: PushNotificationPayloadDTO) {
    return await this.pushService.sendToAll(data);
  }

  @ApiOperation({
    summary: "푸시 구독 정보 조회",
    description: "특정 사용자의 푸시 구독 정보를 조회합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.NO_CONTENT,
  })
  @Get("/userSubscriptions")
  async getUserSubscriptions(@Query() data: GetSubscriptionsByUserDTO) {
    return await this.pushService.getSubscriptionsByUser(data);
  }
}
