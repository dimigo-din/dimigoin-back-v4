import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  StreamableFile,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { FastifyReply, FastifyRequest } from "fastify";

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
  RenderHTMLDTO,
  SearchUserDTO,
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
  async addPasswordLogin(@Req() req: FastifyRequest & { user: any }, @Body() data: AddPasswordLoginDTO) {
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

  @ApiOperation({
    summary: "HTML 렌더",
    description: "HTML을 렌더하여 pdf 파일로 출력합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: StreamableFile,
  })
  @UseGuardsWithSwagger(CustomJwtAuthGuard, PermissionGuard([PermissionEnum.TEACHER]))
  @Post("/renderHtml")
  async renderHtml(@Res() res: FastifyReply, @Body() data: RenderHTMLDTO) {
    const buffer = await this.userManageService.renderHtml(data);

    res.header("Content-Type", "application/pdf");
    res.header("Content-Disposition", `attachment; filename="${encodeURIComponent(data.filename)}"`);
    res.header("Content-Length", buffer.length.toString());

    return res.send(buffer);
  }
}
