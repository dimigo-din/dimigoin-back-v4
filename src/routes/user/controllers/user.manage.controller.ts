import { Body, Controller, HttpStatus, Post, Req } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { CustomJwtAuthGuard } from "../../../auth/guards";
import { PermissionGuard } from "../../../auth/guards/permission.guard";
import { UseGuardsWithSwagger } from "../../../auth/guards/useGuards";
import { ApiResponseFormat } from "../../../common/dto/response_format.dto";
import { PermissionEnum } from "../../../common/mapper/permissions";
import { User } from "../../../schemas";
import {
  AddPasswordLoginDTO,
  AddPermissionDTO,
  RemovePermissionDTO,
  SetPermissionDTO,
} from "../dto";
import { UserManageService } from "../providers";

@ApiTags("User Manage")
@Controller("/manage/user")
export class UserManageController {
  constructor(private readonly userManageService: UserManageService) {}

  @ApiOperation({
    summary: "비밀번호 설정",
    description: "비밀번호 로그인 방식을 추가합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
  })
  @UseGuardsWithSwagger(CustomJwtAuthGuard)
  @Post("/login/password")
  async addPasswordLogin(@Req() req, @Body() data: AddPasswordLoginDTO) {
    return await this.userManageService.addPasswordLogin(req.user.id, data.password);
  }

  @ApiOperation({
    summary: "권한 설정",
    description: "유저 권한 설정",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    description: "성공",
    type: User,
  })
  @UseGuardsWithSwagger(CustomJwtAuthGuard, PermissionGuard([PermissionEnum.MANAGE_PERMISSION]))
  @Post("/permission/set")
  async setPermission(@Body() data: SetPermissionDTO) {
    return await this.userManageService.setPermission(data);
  }

  @ApiOperation({
    summary: "권한 추가",
    description: "유저 권한 추가",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    description: "성공",
    type: User,
  })
  @UseGuardsWithSwagger(CustomJwtAuthGuard, PermissionGuard([PermissionEnum.MANAGE_PERMISSION]))
  @Post("/permission/add")
  async addPermission(@Body() data: AddPermissionDTO) {
    return await this.userManageService.addPermission(data);
  }

  @ApiOperation({
    summary: "권한 제거",
    description: "유저 권한 제거",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    description: "성공",
    type: User,
  })
  @UseGuardsWithSwagger(CustomJwtAuthGuard, PermissionGuard([PermissionEnum.MANAGE_PERMISSION]))
  @Post("/permission/remove")
  async removePermission(@Body() data: RemovePermissionDTO) {
    return await this.userManageService.removePermission(data);
  }
}
