import { Body, Controller, Get, HttpStatus, Post, Req } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { CustomJwtAuthGuard } from "../../../auth/guards";
import { PermissionGuard } from "../../../auth/guards/permission.guard";
import { UseGuardsWithSwagger } from "../../../auth/guards/useGuards";
import { PermissionEnum } from "../../../common/mapper/permissions";
import { User } from "../../../schemas";
import { AddPermissionDTO, RemovePermissionDTO, SetPermissionDTO, SetUserDetailDTO } from "../dto";
import { UserService } from "../providers";

@ApiTags("User")
@Controller("/user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({
    summary: "회원가입 완료 여부 확인",
    description: "회원가입 후 학번 등록이 완료되었는지 확인합니다.",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "완료 여부",
    type: Boolean,
  })
  @UseGuardsWithSwagger(CustomJwtAuthGuard)
  @Get("/signup/complete")
  async checkSignUpCompleted(@Req() req) {
    return await this.userService.isSignUpCompleted(req.user.id);
  }

  @ApiOperation({
    summary: "유저 세부정보 설정",
    description: "회원가입 후, 학번 등록 프로세스입니다.",
  })
  @UseGuardsWithSwagger(CustomJwtAuthGuard)
  @Post("/signup/complete")
  async setUserDetail(@Req() req, @Body() data: SetUserDetailDTO) {
    return await this.userService.setUserDetail(req.user, data);
  }

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
    return await this.userService.setPermission(data);
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
    return await this.userService.addPermission(data);
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
    return await this.userService.removePermission(data);
  }
}
