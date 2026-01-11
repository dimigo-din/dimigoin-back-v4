import { Body, Controller, Delete, Get, HttpStatus, Patch, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Stay, StayApply, StayOuting, StaySchedule, StaySeatPreset } from "#/schemas";
import { CustomJwtAuthGuard } from "#auth/guards";
import { PermissionGuard } from "#auth/guards/permission.guard";
import { UseGuardsWithSwagger } from "#auth/guards/useGuards";
import { ApiResponseFormat } from "$dto/response_format.dto";
import { PermissionEnum } from "$mapper/permissions";
import {
  AuditOutingDTO,
  CreateStayApplyDTO,
  CreateStayDTO,
  CreateStayScheduleDTO,
  CreateStaySeatPresetDTO,
  MoveToSomewhereDTO,
  StayApplyIdDTO,
  StayIdDTO,
  StayScheduleIdDTO,
  StaySeatPresetIdDTO,
  UpdateOutingMealCancelDTO,
  UpdateStayApplyDTO,
  UpdateStayDTO,
  UpdateStayScheduleDTO,
  UpdateStaySeatPresetDTO,
} from "~stay/dto/stay.manage.dto";
import { StayManageService } from "~stay/providers/stay.manage.service";

@ApiTags("Stay Manage")
@Controller("/manage/stay")
@UseGuardsWithSwagger(CustomJwtAuthGuard, PermissionGuard([PermissionEnum.TEACHER]))
export class StayManageController {
  constructor(private readonly stayManageService: StayManageService) {}

  @ApiOperation({
    summary: "좌석 프리셋 목록",
    description: "좌석 프리셋의 목록을 불러옵니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
  })
  @Get("/seat/preset/list")
  async getStaySeatPresetList() {
    return await this.stayManageService.getStaySeatPresetList();
  }

  @ApiOperation({
    summary: "좌석 프리셋",
    description: "좌석 프리셋의 세부정보를 가져옵니다",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: StaySeatPreset,
  })
  @Get("/seat/preset")
  async getStaySeatPreset(@Query() data: StaySeatPresetIdDTO) {
    return await this.stayManageService.getStaySeatPreset(data);
  }

  @ApiOperation({
    summary: "좌석 프리셋 생성",
    description: "잔류시 열람실에서 쓰일 좌석에 대한 프리셋을 생성합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: StaySeatPreset,
  })
  @Post("/seat/preset")
  async createStaySeatPreset(@Body() data: CreateStaySeatPresetDTO) {
    return await this.stayManageService.createStaySeatPreset(data);
  }

  @ApiOperation({
    summary: "좌석 프리셋 수정",
    description: "등록된 좌석 프리셋을 수정합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: StaySeatPreset,
  })
  @Patch("/seat/preset")
  async updateStaySeatPreset(@Body() data: UpdateStaySeatPresetDTO) {
    return await this.stayManageService.updateStaySeatPreset(data);
  }

  @ApiOperation({
    summary: "좌석 프리셋 삭제",
    description:
      "등록된 좌석 프리셋을 삭제합니다. 해당 프리셋을 사용하고있는 잔류 일정이나 진행중인 잔류가 있다면 삭제할 수 없습니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: StaySeatPreset,
  })
  @Delete("/seat/preset")
  async deleteStaySeatPreset(@Query() data: StaySeatPresetIdDTO) {
    return await this.stayManageService.deleteStaySeatPreset(data);
  }

  @ApiOperation({
    summary: "잔류 일정 목록",
    description: "현재 등록되어있는 주기적인 잔류 일정 목록을 가져옵니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
  })
  @Get("/schedule/list")
  async getStayScheduleList() {
    return await this.stayManageService.getStayScheduleList();
  }

  @ApiOperation({
    summary: "잔류 일정",
    description: "현재 등록되어있는 주기적인 잔류 일정을 자세히 가져옵니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: StaySchedule,
  })
  @Get("/schedule")
  async getStaySchedule(@Query() data: StayScheduleIdDTO) {
    return await this.stayManageService.getStaySchedule(data);
  }

  @ApiOperation({
    summary: "잔류 일정 추가",
    description: "주기적으로 있는 잔류 일정을 추가합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: StaySchedule,
  })
  @Post("/schedule")
  async createStaySchedule(@Body() data: CreateStayScheduleDTO) {
    return await this.stayManageService.createStaySchedule(data);
  }

  @ApiOperation({
    summary: "잔류 일정 수정",
    description: "주기적으로 있는 잔류 일정을 수정합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: StaySchedule,
  })
  @Patch("/schedule")
  async updateStaySchedule(@Body() data: UpdateStayScheduleDTO) {
    return await this.stayManageService.updateStaySchedule(data);
  }

  @ApiOperation({
    summary: "잔류 일정 삭제",
    description: "주기적으로 있는 잔류 일정을 삭제합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: StaySchedule,
  })
  @Delete("/schedule")
  async deleteStaySchedule(@Query() data: StayScheduleIdDTO) {
    return await this.stayManageService.deleteStaySchedule(data);
  }

  @ApiOperation({
    summary: "잔류 목록",
    description: "현재 잔류 목록을 가져옵니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
  })
  @Get("/list")
  async getStayList() {
    return await this.stayManageService.getStayList();
  }

  @ApiOperation({
    summary: "잔류",
    description: "잔류에 대한 디테일한 정보를 가져옵니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: Stay,
  })
  @Get("")
  async getStay(@Query() data: StayIdDTO) {
    return await this.stayManageService.getStay(data);
  }

  @ApiOperation({
    summary: "잔류 생성",
    description: "일회성 잔류를 생성합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: Stay,
  })
  @Post("")
  async createStay(@Body() data: CreateStayDTO) {
    return await this.stayManageService.createStay(data);
  }

  @ApiOperation({
    summary: "잔류 수정",
    description: "현재 진행중인 등록를 수정합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: Stay,
  })
  @Patch("")
  async updateStay(@Body() data: UpdateStayDTO) {
    return await this.stayManageService.updateStay(data);
  }

  @ApiOperation({
    summary: "잔류 삭제",
    description: "현재 진행중인 잔류를 삭제합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: Stay,
  })
  @Delete("")
  async deleteStay(@Query() data: StayIdDTO) {
    return await this.stayManageService.deleteStay(data);
  }

  @ApiOperation({
    summary: "잔류 인원 조회",
    description: "특정 잔류의 잔류 인원 목록을 가져옵니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: [StayApply],
  })
  @Get("/apply")
  async getStayApply(@Query() data: StayIdDTO) {
    return await this.stayManageService.getStayApply(data);
  }

  @ApiOperation({
    summary: "잔류 신청 등록",
    description: "학생의 잔류를 신청합니다",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: StayApply,
  })
  @Post("/apply")
  async createStayApply(@Body() data: CreateStayApplyDTO) {
    return await this.stayManageService.createStayApply(data);
  }

  @ApiOperation({
    summary: "잔류 신청 수정",
    description: "특정 잔류 신청을 수정합니다",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: StayApply,
  })
  @Patch("/apply")
  async updateStayApply(@Body() data: UpdateStayApplyDTO) {
    return await this.stayManageService.updateStayApply(data);
  }

  @ApiOperation({
    summary: "잔류 신청 삭제",
    description: "특정 잔류 신청을 삭제합니다",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: StayApply,
  })
  @Delete("/apply")
  async deleteStayApply(@Query() data: StayApplyIdDTO) {
    return await this.stayManageService.deleteStayApply(data);
  }

  @ApiOperation({
    summary: "외출 허가/반려",
    description: "외출을 허가하거나 반려합니다. Null값을 넘겨 허가나 반려를 취소할 수 있습니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: StayOuting,
  })
  @Patch("/outing/audit")
  async auditOuting(@Body() data: AuditOutingDTO) {
    return await this.stayManageService.auditOuting(data);
  }

  @ApiOperation({
    summary: "외출 식사 취소 업데이트",
    description: "외출시 취소할 식사를 변경합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: StayOuting,
  })
  @Patch("/outing/meal_cancel")
  async updateOutingMealCancel(@Body() data: UpdateOutingMealCancelDTO) {
    return await this.stayManageService.updateOutingMealCancel(data);
  }

  @ApiOperation({
    summary: "일괄 좌석 이동",
    description: "특정 잔류들의 좌석을 일괄 이동합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: [StayApply],
  })
  @Post("/change_seat")
  async moveToSomewhere(@Body() data: MoveToSomewhereDTO) {
    return await this.stayManageService.moveToSomewhere(data);
  }
}
