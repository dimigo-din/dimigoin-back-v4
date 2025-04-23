import { Body, Controller, Delete, Get, HttpStatus, Patch, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { CustomJwtAuthGuard } from "../../../auth/guards";
import { PermissionGuard } from "../../../auth/guards/permission.guard";
import { UseGuardsWithSwagger } from "../../../auth/guards/useGuards";
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
  @ApiResponse({
    status: HttpStatus.OK,
    type: [LaundryTimelineListResponseDTO],
  })
  @UseGuardsWithSwagger(CustomJwtAuthGuard)
  @Get("/timeline/list")
  async getLaundryTimelineList() {
    return await this.laundryManageService.getLaundryTimelineList();
  }

  @ApiOperation({
    summary: "세탁 일정 세부정보",
    description: "세탁 일정의 세부정보를 불러옵니다.",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: LaundryTimeline,
  })
  @UseGuardsWithSwagger(CustomJwtAuthGuard)
  @Get("/timeline")
  async getLaundryTimeline(@Query() data: LaundryTimelineIdDTO) {
    return await this.laundryManageService.getLaundryTimeline(data);
  }

  @ApiOperation({
    summary: "세탁 일정 생성",
    description: "세탁 일정을 생성합니다",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: LaundryTimeline,
  })
  @UseGuardsWithSwagger(CustomJwtAuthGuard)
  @Post("/timeline")
  async createLaundryTimeline(@Body() data: CreateLaundryTimelineDTO) {
    return await this.laundryManageService.createLaundryTimeline(data);
  }

  @ApiOperation({
    summary: "세탁 일정 수정",
    description: "세탁 일정을 수정합니다",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: LaundryTimeline,
  })
  @UseGuardsWithSwagger(CustomJwtAuthGuard)
  @Patch("/timeline")
  async updateLaundryTimeline(@Body() data: UpdateLaundryTimelineDTO) {
    return await this.laundryManageService.updateLaundryTimeline(data);
  }

  @ApiOperation({
    summary: "세탁 일정 삭제",
    description: "세탁 일정을 삭제합니다.",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: LaundryTimeline,
  })
  @UseGuardsWithSwagger(CustomJwtAuthGuard)
  @Delete("/timeline")
  async deelteLaundryTimeline(@Query() data: LaundryTimelineIdDTO) {
    return await this.laundryManageService.deleteLaundryTimeline(data);
  }

  @ApiOperation({
    summary: "세탁/건조기 리스트",
    description: "세탁기와 건조기의 목록을 불러옵니다.",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [LaundryMachine],
  })
  @UseGuardsWithSwagger(CustomJwtAuthGuard)
  @Get("/machine/list")
  async getLaundryMachineList() {
    return await this.laundryManageService.getLaundryMachineList();
  }

  @ApiOperation({
    summary: "세탁/건조기 생성",
    description: "세탁기나 건조기를 생성합니다",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: LaundryMachine,
  })
  @UseGuardsWithSwagger(CustomJwtAuthGuard)
  @Post("/machine")
  async createLaundryMachine(@Body() data: CreateLaundryMachineDTO) {
    return await this.laundryManageService.createLaundryMachine(data);
  }

  @ApiOperation({
    summary: "세탁/건조기 수정",
    description: "세탁기나 건조기의 정보를 수정합니다",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: LaundryMachine,
  })
  @UseGuardsWithSwagger(CustomJwtAuthGuard)
  @Patch("/machine")
  async updateLaundryMachine(@Body() data: UpdateLaundryMachineDTO) {
    return await this.laundryManageService.updateLaundryMachine(data);
  }

  @ApiOperation({
    summary: "세탁/건조기 삭제",
    description: "세탁기나 건조기를 삭제합니다",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: LaundryMachine,
  })
  @UseGuardsWithSwagger(CustomJwtAuthGuard)
  @Delete("/machine")
  async deleteLaundryMachine(@Query() data: LaundryMachineIdDTO) {
    return await this.laundryManageService.deleteLaundryMachine(data);
  }

  @ApiOperation({
    summary: "세탁 신청 목록",
    description: "세탁 신청 목록을 반환합니다.",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [LaundryApply],
  })
  @UseGuardsWithSwagger(CustomJwtAuthGuard)
  @Get("/apply/list")
  async getLaundryApply() {
    return await this.laundryManageService.getLaundryApplyList();
  }

  @ApiOperation({
    summary: "세탁 신청",
    description: "유저의 세탁 신청을 등록합니다",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: LaundryApply,
  })
  @UseGuardsWithSwagger(CustomJwtAuthGuard)
  @Post("/apply")
  async createLaundryApply(@Body() data: CreateLaundryApplyDTO) {
    return await this.laundryManageService.createLaundryApply(data);
  }

  @ApiOperation({
    summary: "세탁 신청 수정",
    description: "세탁 신청을 수정합니다.",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: LaundryApply,
  })
  @UseGuardsWithSwagger(CustomJwtAuthGuard)
  @Patch("/apply")
  async updateLaundryApply(@Body() data: UpdateLaundryApplyDTO) {
    return await this.laundryManageService.updateLaundryApply(data);
  }

  @ApiOperation({
    summary: "세탁 신청 삭제",
    description: "세탁 신청을 삭제합니다.",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: LaundryApply,
  })
  @UseGuardsWithSwagger(CustomJwtAuthGuard)
  @Delete("/apply")
  async deleteLaundryApply(@Query() data: LaundryApplyIdDTO) {
    return await this.laundryManageService.deleteLaundryApply(data);
  }
}
