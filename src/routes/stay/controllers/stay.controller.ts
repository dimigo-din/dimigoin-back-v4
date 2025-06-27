import { Body, Controller, Delete, Get, HttpStatus, Patch, Post, Query, Req } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { CustomJwtAuthGuard } from "../../../auth/guards";
import { PermissionGuard } from "../../../auth/guards/permission.guard";
import { UseGuardsWithSwagger } from "../../../auth/guards/useGuards";
import { ApiResponseFormat } from "../../../common/dto/response_format.dto";
import { PermissionEnum } from "../../../common/mapper/permissions";
import { Stay, StayApply } from "../../../schemas";
import { CreateUserStayApplyDTO, StayIdDTO } from "../dto/stay.dto";
import { StayService } from "../providers";

@ApiTags("Stay")
@Controller("/stay")
@UseGuardsWithSwagger(CustomJwtAuthGuard, PermissionGuard([PermissionEnum.STUDENT]))
export class StayController {
  constructor(private readonly stayService: StayService) {}

  @ApiOperation({
    summary: "잔류 목록",
    description: "활성화된 잔류 목록을 가져옵니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: [Stay],
  })
  @Get("")
  async getStayList(@Req() req) {
    return this.stayService.getStayList(req.user);
  }

  @ApiOperation({
    summary: "잔류 신청 목록",
    description: "자신이 신청한 잔류 목록을 불러옵니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: [StayApply],
  })
  @Get("/apply")
  async getStayApplies(@Req() req) {
    return await this.stayService.getStayApplies(req.user);
  }

  @ApiOperation({
    summary: "잔류 신청",
    description: "잔류를 신청합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.CREATED,
    type: StayApply,
  })
  @Post("/apply")
  async createStayApply(@Req() req, @Body() data: CreateUserStayApplyDTO) {
    return await this.stayService.createStayApply(req.user, data);
  }

  @ApiOperation({
    summary: "잔류 신청 수정",
    description: "신청한 잔류를 수정합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: StayApply,
  })
  @Patch("/apply")
  async updateStayApply(@Req() req, @Body() data: CreateUserStayApplyDTO) {
    return await this.stayService.updateStayApply(req.user, data);
  }

  @ApiOperation({
    summary: "잔류 신청 취소",
    description: "신청한 잔류를 취소합니다",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: StayApply,
  })
  @Delete("/apply")
  async deleteStayApply(@Req() req, @Query() data: StayIdDTO) {
    return await this.stayService.deleteStayApply(req.user, data);
  }
}
