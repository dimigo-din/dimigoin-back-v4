import { Body, Controller, Delete, Get, HttpStatus, Post, Req } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { CustomJwtAuthGuard } from "../../../auth/guards";
import { PermissionGuard } from "../../../auth/guards/permission.guard";
import { UseGuardsWithSwagger } from "../../../auth/guards/useGuards";
import { ApiResponseFormat } from "../../../common/dto/response_format.dto";
import { PermissionEnum } from "../../../common/mapper/permissions";
import { FrigoApply } from "../../../schemas";
import { ClientFrigoApplyDTO } from "../dto/frigo.dto";
import { FrigoService } from "../providers";

@ApiTags("Frigo")
@Controller("/frigo")
@UseGuardsWithSwagger(CustomJwtAuthGuard, PermissionGuard([PermissionEnum.STUDENT]))
export class FrigoController {
  constructor(private readonly frigoService: FrigoService) {}

  @ApiOperation({
    summary: "신청정보 확인",
    description: "금요귀가 신청 정보를 확인합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: FrigoApply,
  })
  @Get("/")
  async getApply(@Req() req) {
    return await this.frigoService.getApply(req.user);
  }

  @ApiOperation({
    summary: "금요귀가 신청",
    description: "금요귀가를 신청합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: FrigoApply,
  })
  @Post("/")
  async apply(@Req() req, @Body() data: ClientFrigoApplyDTO) {
    return await this.frigoService.frigoApply(req.user, data);
  }

  @ApiOperation({
    summary: "금요귀가 신청 취소",
    description: "금요귀가를 신청 취소합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: FrigoApply,
  })
  @Delete("/")
  async cancel(@Req() req) {
    return await this.frigoService.cacelApply(req.user);
  }
}
