import { Body, Controller, Get, HttpStatus, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { User } from "#/schemas";
import { CustomJwtAuthGuard } from "#auth/guards";
import { PermissionGuard } from "#auth/guards/permission.guard";
import { UseGuardsWithSwagger } from "#auth/guards/useGuards";
import { CurrentUser } from "$decorators/user.decorator";
import { ApiResponseFormat } from "$dto/response_format.dto";
import { PermissionEnum } from "$mapper/permissions";
import {
  AddPasswordLoginDTO,
  AddPermissionDTO,
  RemovePermissionDTO,
  SearchUserDTO,
  SetPermissionDTO,
} from "~user/dto";
import { UserManageService } from "~user/providers";

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
  async addPasswordLogin(@CurrentUser() user: User, @Body() data: AddPasswordLoginDTO) {
    return await this.userManageService.addPasswordLogin(user.id, data.password);
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

  @ApiOperation({
    summary: "유저 검색",
    description: "이름을 통하여 유저를 검색합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: [User],
  })
  @UseGuardsWithSwagger(CustomJwtAuthGuard, PermissionGuard([PermissionEnum.TEACHER]))
  @Get("/search")
  async searchUser(@Query() data: SearchUserDTO) {
    return await this.userManageService.searchUser(data);
  }
}
