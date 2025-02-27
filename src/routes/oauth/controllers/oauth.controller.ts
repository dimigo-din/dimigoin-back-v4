import { Body, Controller, Delete, Get, HttpStatus, Patch, Post, Query, Req } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { CustomJwtAuthGuard } from "../../../auth/guards";
import { PermissionGuard } from "../../../auth/guards/permission.guard";
import { UseGuardsWithSwagger } from "../../../auth/guards/useGuards";
import { PermissionEnum } from "../../../common/mapper/permissions";
import { OAuth_Client, OAuth_Client_Redirect } from "../../../schemas";
import {
  CreateOAuthClientDTO,
  OAuthClientIdDTO,
  OAuthClientListResponseDTO,
  SetOAuthClientRedirectDTO,
} from "../dto/oauth.dto";
import { OAuthService } from "../providers";

@ApiTags("OAuth")
@Controller("/oauth")
export class OAuthController {
  constructor(private readonly oauthService: OAuthService) {}

  @ApiOperation({
    summary: "OAuth Client 리스트",
    description: "OAuth Client 리스트를 불러옵니다",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [OAuthClientListResponseDTO],
  })
  @UseGuardsWithSwagger(
    CustomJwtAuthGuard,
    PermissionGuard([PermissionEnum.MANAGE_OAUTH_CLIENT_SELF]),
  )
  @Get("/list")
  async getOAuthClientList(@Req() req) {
    return this.oauthService.getOauthClientList(req.user);
  }

  @ApiOperation({
    summary: "OAuth Client 세부정보",
    description: "OAuth Client의 세부정보를 불러옵니다",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: OAuth_Client,
  })
  @UseGuardsWithSwagger(
    CustomJwtAuthGuard,
    PermissionGuard([PermissionEnum.MANAGE_OAUTH_CLIENT_SELF]),
  )
  @Get()
  async getOAuthClient(@Req() req, @Query() data: OAuthClientIdDTO) {
    return await this.oauthService.getOAuthClient(req.user, data.client_id);
  }

  @ApiOperation({
    summary: "OAuth Client 생성",
    description: "OAuth Client를 생성합니다.",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: OAuth_Client,
  })
  @UseGuardsWithSwagger(
    CustomJwtAuthGuard,
    PermissionGuard([PermissionEnum.MANAGE_OAUTH_CLIENT_SELF]),
  )
  @Post()
  async createOAuthClient(@Req() req, @Body() data: CreateOAuthClientDTO) {
    return await this.oauthService.createOAuthClient(req.user, data.name, data.redirect);
  }

  @ApiOperation({
    summary: "OAuth Client redirect 설정",
    description: "OAuth Client redirect를 설정합니다.",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: OAuth_Client_Redirect,
  })
  @UseGuardsWithSwagger(
    CustomJwtAuthGuard,
    PermissionGuard([PermissionEnum.MANAGE_OAUTH_CLIENT_SELF]),
  )
  @Patch()
  async setOAuthClientRedirect(@Req() req, @Body() data: SetOAuthClientRedirectDTO) {
    return await this.oauthService.setOAuthClientRedirect(req.user, data.client_id, data.redirect);
  }

  @ApiOperation({
    summary: "OAuth Client 삭제",
    description: "OAuth Client를 삭제합니다.",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: OAuth_Client,
  })
  @UseGuardsWithSwagger(
    CustomJwtAuthGuard,
    PermissionGuard([PermissionEnum.MANAGE_OAUTH_CLIENT_SELF]),
  )
  @Delete()
  async deleteOAuthClient(@Req() req, @Query() data: OAuthClientIdDTO) {
    return await this.oauthService.deleteOAuthClient(req.user, data.client_id);
  }

  @ApiOperation({
    summary: "OAuth Client 비밀번호 재설정",
    description: "OAuth Client의 비밀번호를 재설정합니다",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: OAuth_Client,
  })
  @UseGuardsWithSwagger(
    CustomJwtAuthGuard,
    PermissionGuard([PermissionEnum.MANAGE_OAUTH_CLIENT_SELF]),
  )
  @Post("/password")
  async resetOAuthClientPw(@Req() req, @Body() data: OAuthClientIdDTO) {
    return await this.oauthService.resetOAuthClientPw(req.user, data.client_id);
  }
}
