import { Body, Controller, Delete, Get, HttpStatus, Patch, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { FrigoApply, FrigoApplyPeriod } from "src/schemas";

import { CustomJwtAuthGuard } from "../../../auth/guards";
import { PermissionGuard } from "../../../auth/guards/permission.guard";
import { UseGuardsWithSwagger } from "../../../auth/guards/useGuards";
import { PermissionEnum } from "../../../common/mapper/permissions";
import {
  AuditFrigoApply,
  FrigoApplyDTO,
  FrigoApplyIdDTO,
  FrigoApplyPeriodIdDTO,
  SetFrigoApplyPeriodDTO,
} from "../dto/frigo.manage.dto";
import { FrigoManageService } from "../providers";

@ApiTags("Frigo Manage")
@Controller("/manage/frigo")
@UseGuardsWithSwagger(CustomJwtAuthGuard, PermissionGuard([PermissionEnum.TEACHER]))
export class FrigoManageController {
  constructor(private readonly frigoManageService: FrigoManageService) {}

  @ApiOperation({
    summary: "금요귀가 신청 기간 확인",
    description: "금요귀가 신청 기간을 불러옵니다.",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [FrigoApplyPeriod],
  })
  @Get("/period")
  async getApplyPeriod() {
    return await this.frigoManageService.getApplyPeriod();
  }

  @ApiOperation({
    summary: "금요귀가 신청 기간 설정",
    description: "금요귀가 신청 기간을 설정합니다. 신청 기간이 존재하지 않을 시, 새로 생성합니다.",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: FrigoApply,
  })
  @Post("/period")
  async setApplyPeriod(@Body() data: SetFrigoApplyPeriodDTO) {
    return await this.frigoManageService.setApplyPeriod(data);
  }

  @ApiOperation({
    summary: "금요귀가 신청 기간 삭제",
    description:
      "금요귀가 신청 기간을 삭제합니다. 삭제할시 해당 학년의 금요귀가 신청이 다시 일정이 생성될때까지 불가합니다.",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: FrigoApplyPeriod,
  })
  @Delete("/period")
  async removeApplyPeriod(@Query() data: FrigoApplyPeriodIdDTO) {
    return await this.frigoManageService.removeApplyPeriod(data);
  }

  @ApiOperation({
    summary: "금요귀가 신청자 리스트",
    description: "금요귀가 신청자 목록을 불러옵니다.",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [FrigoApply],
  })
  @Get("/")
  async getApplyList() {
    return await this.frigoManageService.getApplyList();
  }

  @ApiOperation({
    summary: "금요귀가 신청",
    description: "학생의 금요귀가를 신청하고 자동으로 수리합니다.",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: FrigoApply,
  })
  @Post("/")
  async apply(@Body() data: FrigoApplyDTO) {
    return await this.frigoManageService.apply(data);
  }

  @ApiOperation({
    summary: "금요귀가 신청 삭제",
    description: "학생의 금요귀가 신청을 삭제합니다.",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: FrigoApply,
  })
  @Delete("/")
  async removeApply(@Query() data: FrigoApplyIdDTO) {
    return await this.frigoManageService.removeApply(data);
  }

  @ApiOperation({
    summary: "금요귀가 신청 수리/반려",
    description:
      "학생의 금요귀가 신청을 수리하거나 반려시킵니다. null값을 apporved에 제공시 심사대기상태로 기록됩니다.",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: FrigoApply,
  })
  @Patch("/")
  async auditApply(@Body() data: AuditFrigoApply) {
    return await this.frigoManageService.auditApply(data);
  }
}
