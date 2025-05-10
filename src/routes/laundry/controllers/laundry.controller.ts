import { Body, Controller, Delete, Get, HttpStatus, Post, Query, Req } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { CustomJwtAuthGuard } from "../../../auth/guards";
import { PermissionGuard } from "../../../auth/guards/permission.guard";
import { UseGuardsWithSwagger } from "../../../auth/guards/useGuards";
import { ApiResponseFormat } from "../../../common/dto/response_format.dto";
import { PermissionEnum } from "../../../common/mapper/permissions";
import { LaundryApply, LaundryTimeline } from "../../../schemas";
import { LaundryApplyDTO } from "../dto/laundry.dto";
import { LaundryService } from "../providers/laundry.service";

@ApiTags("Laundry")
@Controller("/laundry")
@UseGuardsWithSwagger(CustomJwtAuthGuard, PermissionGuard([PermissionEnum.STUDENT]))
export class LaundryController {
  constructor(private readonly laundryService: LaundryService) {}

  @ApiOperation({
    summary: "세탁 시간표",
    description: "현재 세탁 시간표를 불러옵니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: LaundryTimeline,
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
    type: [LaundryApply],
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
    type: LaundryApply,
  })
  @Post("/")
  async createApply(@Req() req, @Body() data: LaundryApplyDTO) {
    return await this.laundryService.createApply(req.user, data);
  }

  @ApiOperation({
    summary: "세탁 취소",
    description: "세탁 신청을 취소합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: LaundryApply,
  })
  @Delete("/")
  async deleteApply(@Req() req) {
    return await this.laundryService.deleteApply(req.user);
  }
}
