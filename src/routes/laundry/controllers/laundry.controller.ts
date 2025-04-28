import { Body, Controller, Delete, Get, HttpStatus, Post, Query, Req } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { CustomJwtAuthGuard } from "../../../auth/guards";
import { PermissionGuard } from "../../../auth/guards/permission.guard";
import { UseGuardsWithSwagger } from "../../../auth/guards/useGuards";
import { PermissionEnum } from "../../../common/mapper/permissions";
import { LaundryApply, LaundryTimeline } from "../../../schemas";
import { LaundryApplyDTO, LaundryApplyIdDTO } from "../dto/laundry.dto";
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
  @ApiResponse({
    status: HttpStatus.OK,
    type: LaundryTimeline,
  })
  @UseGuardsWithSwagger(CustomJwtAuthGuard)
  @Get("/timeline")
  async getLaundryTimeline() {
    return await this.laundryService.getTimeline();
  }

  @ApiOperation({
    summary: "세탁 신청 목록",
    description: "전체 세탁 신청 목록을 가져옵니다.",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [LaundryApply],
  })
  @UseGuardsWithSwagger(CustomJwtAuthGuard)
  @Get("/")
  async getLaundryApplies() {
    return await this.laundryService.getApplies();
  }

  @ApiOperation({
    summary: "세탁 신청",
    description: "세탁을 신청합니다.",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: LaundryApply,
  })
  @UseGuardsWithSwagger(CustomJwtAuthGuard)
  @Post("/")
  async createApply(@Req() req, @Body() data: LaundryApplyDTO) {
    return await this.laundryService.createApply(req.user, data);
  }

  @ApiOperation({
    summary: "세탁 취소",
    description: "세탁 신청을 취소합니다.",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: LaundryApply,
  })
  @UseGuardsWithSwagger(CustomJwtAuthGuard)
  @Delete("/")
  async deleteApply(@Req() req) {
    return await this.laundryService.deleteApply(req.user);
  }
}
