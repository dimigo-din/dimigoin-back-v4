import { Body, Controller, Delete, Get, HttpStatus, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CustomJwtAuthGuard } from '../../../auth/guards';
import { PermissionGuard } from '../../../auth/guards/permission.guard';
import { UseGuardsWithSwagger } from '../../../auth/guards/useGuards';
import { ApiResponseFormat } from '../../../common/dto/response_format.dto';
import { PermissionEnum } from '../../../common/mapper/permissions';
import { WakeupSongApplication } from '../../../schemas';
import {
  type WakeupSongDeleteDTO,
  WakeupSongListResponseDTO,
  type WakeupSongSelectDTO,
} from '../dto/wakeup.manage.dto';
import { WakeupManageService } from '../providers/';

@ApiTags('Wakeup Manage')
@Controller('/manage/wakeup')
@UseGuardsWithSwagger(CustomJwtAuthGuard, PermissionGuard([PermissionEnum.TEACHER]))
export class WakeupManageController {
  constructor(private readonly wakeupManageService: WakeupManageService) {}

  @ApiOperation({
    summary: '기상송 목록 불러오기',
    description: '기상속 목록와 투표자 목록을 불러옵니다.',
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: [WakeupSongListResponseDTO],
  })
  @Get('/')
  async getList() {
    return await this.wakeupManageService.getList();
  }

  @ApiOperation({
    summary: '기상송 확정',
    description: '해당 기상송을 확정합니다.',
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: WakeupSongApplication,
  })
  @Post('/')
  async selectApply(@Body() data: WakeupSongSelectDTO) {
    return await this.wakeupManageService.selectApply(data);
  }

  @ApiOperation({
    summary: '기상송 삭제',
    description: '해당 기상송을 삭제합니다.',
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: WakeupSongApplication,
  })
  @Delete('/')
  async deleteApply(@Query() data: WakeupSongDeleteDTO) {
    return await this.wakeupManageService.deleteApply(data);
  }
}
