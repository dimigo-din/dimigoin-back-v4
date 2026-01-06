import { Body, Controller, Delete, Get, HttpStatus, Patch, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { CustomJwtAuthGuard } from "../../../auth/guards";
import { PermissionGuard } from "../../../auth/guards/permission.guard";
import { UseGuardsWithSwagger } from "../../../auth/guards/useGuards";
import { ApiResponseFormat } from "../../../common/dto/response_format.dto";
import { PermissionEnum } from "../../../common/mapper/permissions";
import { LaundryApply, LaundryMachine, LaundryTimeline } from "../../../schemas";
import {
  CreateLaundryApplyDTO,
  CreateLaundryMachineDTO,
  CreateLaundryTimelineDTO,
  LaundryApplyIdDTO,
  LaundryMachineIdDTO,
  LaundryTimelineIdDTO,
  LaundryTimelineListResponseDTO,
  UpdateLaundryApplyDTO,
  UpdateLaundryMachineDTO,
  UpdateLaundryTimelineDTO,
} from "../dto/laundry.manage.dto";
import { LaundryManageService } from "../providers";

@ApiTags("Laundry Manage")
@Controller("/manage/laundry")
@UseGuardsWithSwagger(CustomJwtAuthGuard, PermissionGuard([PermissionEnum.TEACHER]))
export class LaundryManageController {
  constructor(private readonly laundryManageService: LaundryManageService) {}

  @ApiOperation({
    summary: "세탁 일정 목록",
    description: "세탁 일정 목록을 가져옵니다",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: [LaundryTimelineListResponseDTO],
  })
  @Get("/timeline/list")
  async getLaundryTimelineList() {
    return await this.laundryManageService.getLaundryTimelineList();
  }

  @ApiOperation({
    summary: "세탁 일정 세부정보",
    description: "세탁 일정의 세부정보를 불러옵니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: LaundryTimeline,
  })
  @Get("/timeline")
  async getLaundryTimeline(@Query() data: LaundryTimelineIdDTO) {
    return await this.laundryManageService.getLaundryTimeline(data);
  }

  @ApiOperation({
    summary: "세탁 일정 생성",
    description: "세탁 일정을 생성합니다",
  })
  @ApiResponseFormat({
    status: HttpStatus.CREATED,
    type: LaundryTimeline,
  })
  @Post("/timeline")
  async createLaundryTimeline(@Body() data: CreateLaundryTimelineDTO) {
    return await this.laundryManageService.createLaundryTimeline(data);
  }

  @ApiOperation({
    summary: "세탁 일정 수정",
    description: "세탁 일정을 수정합니다",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: LaundryTimeline,
  })
  @Patch("/timeline")
  async updateLaundryTimeline(@Body() data: UpdateLaundryTimelineDTO) {
    return await this.laundryManageService.updateLaundryTimeline(data);
  }

  @ApiOperation({
    summary: "세탁 일정 삭제",
    description: "세탁 일정을 삭제합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: LaundryTimeline,
  })
  @Delete("/timeline")
  async deleteLaundryTimeline(@Query() data: LaundryTimelineIdDTO) {
    return await this.laundryManageService.deleteLaundryTimeline(data);
  }

  @ApiOperation({
    summary: "세탁 일정 활성화",
    description: "특정 세탁 일정을 활성화합니다. 다른 세탁 일정은 자동으로 비활성화됩니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: [LaundryTimeline],
  })
  @Patch("/timeline/enable")
  async enableLaundryTimeline(@Body() data: LaundryTimelineIdDTO) {
    return await this.laundryManageService.enableLaundryTimeline(data);
  }

  @ApiOperation({
    summary: "세탁/건조기 리스트",
    description: "세탁기와 건조기의 목록을 불러옵니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: [LaundryMachine],
  })
  @Get("/machine/list")
  async getLaundryMachineList() {
    return await this.laundryManageService.getLaundryMachineList();
  }

  @ApiOperation({
    summary: "세탁/건조기 생성",
    description: "세탁기나 건조기를 생성합니다",
  })
  @ApiResponseFormat({
    status: HttpStatus.CREATED,
    type: LaundryMachine,
  })
  @Post("/machine")
  async createLaundryMachine(@Body() data: CreateLaundryMachineDTO) {
    return await this.laundryManageService.createLaundryMachine(data);
  }

  @ApiOperation({
    summary: "세탁/건조기 수정",
    description: "세탁기나 건조기의 정보를 수정합니다",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: LaundryMachine,
  })
  @Patch("/machine")
  async updateLaundryMachine(@Body() data: UpdateLaundryMachineDTO) {
    return await this.laundryManageService.updateLaundryMachine(data);
  }

  @ApiOperation({
    summary: "세탁/건조기 삭제",
    description: "세탁기나 건조기를 삭제합니다",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: LaundryMachine,
  })
  @Delete("/machine")
  async deleteLaundryMachine(@Query() data: LaundryMachineIdDTO) {
    return await this.laundryManageService.deleteLaundryMachine(data);
  }

  @ApiOperation({
    summary: "세탁 신청 목록",
    description: "세탁 신청 목록을 반환합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: [LaundryApply],
  })
  @Get("/apply/list")
  async getLaundryApply() {
    return await this.laundryManageService.getLaundryApplyList();
  }

  @ApiOperation({
    summary: "세탁 신청",
    description: "유저의 세탁 신청을 등록합니다",
  })
  @ApiResponseFormat({
    status: HttpStatus.CREATED,
    type: LaundryApply,
  })
  @Post("/apply")
  async createLaundryApply(@Body() data: CreateLaundryApplyDTO) {
    return await this.laundryManageService.createLaundryApply(data);
  }

  @ApiOperation({
    summary: "세탁 신청 수정",
    description: "세탁 신청을 수정합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: LaundryApply,
  })
  @Patch("/apply")
  async updateLaundryApply(@Body() data: UpdateLaundryApplyDTO) {
    return await this.laundryManageService.updateLaundryApply(data);
  }

  @ApiOperation({
    summary: "세탁 신청 삭제",
    description: "세탁 신청을 삭제합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: LaundryApply,
  })
  @Delete("/apply")
  async deleteLaundryApply(@Query() data: LaundryApplyIdDTO) {
    return await this.laundryManageService.deleteLaundryApply(data);
  }
}
