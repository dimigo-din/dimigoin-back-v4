import { Body, Controller, Delete, Get, HttpStatus, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type { User } from "#/db/schema";
import { AppCheckGuard, CustomJwtAuthGuard } from "#auth/guards";
import { UseGuardsWithSwagger, UseGuardWhenProduction } from "#auth/guards/useGuards";
import { CurrentUser } from "$decorators/user.decorator";
import { ApiResponseFormat } from "$dto/response_format.dto";
import { LaundryApplyIdDTO } from "~laundry/dto/laundry.manage.dto";
import { LaundryApplyDTO } from "~laundry/dto/laundry.student.dto";
import { LaundryStudentService } from "~laundry/providers/laundry.student.service";

@ApiTags("Laundry Student")
@Controller("/student/laundry")
@UseGuardsWithSwagger(CustomJwtAuthGuard)
export class LaundryStudentController {
  constructor(private readonly laundryService: LaundryStudentService) {}

  @ApiOperation({
    summary: "세탁 시간표",
    description: "현재 세탁 시간표를 불러옵니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
  })
  @Get("/timeline")
  async getLaundryTimeline() {
    return await this.laundryService.getTimeline();
  }

  @ApiOperation({
    summary: "세탁 신청 목록",
    description: "전체 세탁 신청 목록을 가져옵니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
  })
  @Get("/")
  async getLaundryApplies() {
    return await this.laundryService.getApplies();
  }

  @ApiOperation({
    summary: "세탁 신청",
    description: "세탁을 신청합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
  })
  @Post("/")
  @UseGuardWhenProduction(AppCheckGuard)
  async createApply(@CurrentUser() user: User, @Body() data: LaundryApplyDTO) {
    return await this.laundryService.createApply(user, data);
  }

  @ApiOperation({
    summary: "세탁 취소",
    description: "세탁 신청을 취소합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
  })
  @Delete("/")
  async deleteApply(@CurrentUser() user: User, @Query() data: LaundryApplyIdDTO) {
    return await this.laundryService.deleteApply(user, data);
  }
}
