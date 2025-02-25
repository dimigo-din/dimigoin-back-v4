import { Body, Controller, HttpStatus, Post } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { CustomJwtAuthGuard } from "../../../auth/guards";
import { PermissionGuard } from "../../../auth/guards/permission.guard";
import { UseGuardsWithSwagger } from "../../../auth/guards/useGuards";
import { PermissionEnum } from "../../../common/mapper/permissions";
import { User } from "../../../schemas";
import { AddPermissionDTO, RemovePermissionDTO, SetPermissionDTO } from "../dto";
import { UserService } from "../providers";

@ApiTags("User")
@Controller("/user")
export class UserController {
  constructor(private readonly userManageService: UserService) {}

  // @ApiOperation({
  //   summary: "회원가입",
  //   description: "유저 및 로그인 정보 생성",
  // })
  // @ApiResponse({
  //   status: HttpStatus.OK,
  //   description: "성공",
  //   type: User,
  // })
  // // @UseGuards(CustomJwtAuthGuard)
  // @Post("/register")
  // async register(@Body() data: CreateUserDTO) {
  //   return await this.userManageService.createUser(data);
  // }

  @ApiOperation({
    summary: "권한 설정",
    description: "유저 권한 설정",
  })
  @ApiResponse({
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
  @ApiResponse({
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
  @ApiResponse({
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
