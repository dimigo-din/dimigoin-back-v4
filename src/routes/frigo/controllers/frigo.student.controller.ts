import { Body, Controller, Delete, Get, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CustomJwtAuthGuard } from '../../../auth/guards';
import { PermissionGuard } from '../../../auth/guards/permission.guard';
import { UseGuardsWithSwagger } from '../../../auth/guards/useGuards';
import { CurrentUser } from '../../../common/decorators/user.decorator';
import { ApiResponseFormat } from '../../../common/dto/response_format.dto';
import { PermissionEnum } from '../../../common/mapper/permissions';
import { FrigoApply, type User } from '../../../schemas';
import type { ClientFrigoApplyDTO } from '../dto/frigo.dto';
import type { FrigoStudentService } from '../providers';

@ApiTags('Frigo Student')
@Controller('/student/frigo')
@UseGuardsWithSwagger(CustomJwtAuthGuard, PermissionGuard([PermissionEnum.STUDENT]))
export class FrigoStudentController {
  constructor(private readonly frigoService: FrigoStudentService) {}

  @ApiOperation({
    summary: '신청정보 확인',
    description: '금요귀가 신청 정보를 확인합니다.',
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: FrigoApply,
  })
  @Get('/')
  async getApply(@CurrentUser() user: User) {
    return await this.frigoService.getApply(user);
  }

  @ApiOperation({
    summary: '금요귀가 신청',
    description: '금요귀가를 신청합니다.',
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: FrigoApply,
  })
  @Post('/')
  async apply(@CurrentUser() user: User, @Body() data: ClientFrigoApplyDTO) {
    return await this.frigoService.frigoApply(user, data);
  }

  @ApiOperation({
    summary: '금요귀가 신청 취소',
    description: '금요귀가를 신청 취소합니다.',
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: FrigoApply,
  })
  @Delete('/')
  async cancel(@CurrentUser() user: User) {
    return await this.frigoService.cancelApply(user);
  }
}
