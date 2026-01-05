import * as process from "node:process";

import { Body, Controller, Get, HttpStatus, Post, Query, Req, Res } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { FastifyReply, FastifyRequest } from "fastify";

import { ApiResponseFormat } from "src/common/dto/response_format.dto";

import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "../common/mapper/constants";
import { PermissionEnum } from "../common/mapper/permissions";

import {
  GoogleAppLoginDTO,
  GoogleWebLoginDTO,
  JWTResponse,
  PasswordLoginDTO,
  RedirectUriDTO,
  RefreshTokenDTO,
  RunPersonalInformationVerifyTokenDTO,
} from "./auth.dto";
import { AuthService } from "./auth.service";
import { CustomJwtAuthGuard } from "./guards";
import { PermissionGuard } from "./guards/permission.guard";
import { PersonalInformationVerifyTokenAuthGuard } from "./guards/personalInformationVerifyToken.guard";
import { UseGuardsWithSwagger } from "./guards/useGuards";

@ApiTags("Auth")
@Controller("/auth")
export class AuthController {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {}

  @ApiOperation({
    summary: "핑",
    description: "세션이 살아있는지 테스트합니다.",
  })
  @Get("/ping")
  @UseGuardsWithSwagger(CustomJwtAuthGuard)
  async ping() {
    return "퐁";
  }

  @ApiOperation({
    summary: "로그인 - 비밀번호",
    description: "비밀번호를 이용한 로그인입니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: JWTResponse,
  })
  @Post("/login/password")
  async passwordLogin(
    @Res({ passthrough: true }) res: FastifyReply,
    @Body() data: PasswordLoginDTO,
  ) {
    const token = await this.authService.loginByIdPassword(data.email, data.password);
    this.generateCookie(res, token);

    return token;
  }

  @ApiOperation({
    summary: "로그인 - 구글",
    description: "구글 OAuth2 로그인 화면으로 리다이렉트하는 Uri을 반환하는 엔드포인트입니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.FOUND,
  })
  @Get("/login/google")
  async googleLogin(@Query() data: RedirectUriDTO) {
    return await this.authService.getGoogleLoginUrl(data);
  }

  @ApiOperation({
    summary: "로그인 콜백 - 구글",
    description: "구글 로그인 콜백 엔드포인트입니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.FOUND,
    type: JWTResponse,
  })
  @Post("/login/google/callback")
  async googleWebLoginCallback(
    @Res({ passthrough: true }) res: FastifyReply,
    @Body() data: GoogleWebLoginDTO,
  ) {
    const token = await this.authService.loginByGoogle(data.code, null, data.redirect_uri);
    this.generateCookie(res, token);
    return token;
  }

  @ApiOperation({
    summary: "로그인 콜백 - 구글 앱 로그인",
    description: "구글 앱 로그인 콜백 엔드포인트입니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.FOUND,
    type: JWTResponse,
  })
  @Post("/login/google/callback/app")
  async googleAppLoginCallback(
    @Res({ passthrough: true }) res: FastifyReply,
    @Body() data: GoogleAppLoginDTO,
  ) {
    const token = await this.authService.loginByGoogle(null, data.idToken, null);
    this.generateCookie(res, token);
    return token;
  }

  @ApiOperation({
    summary: "토큰 재발급",
    description: "만료된 accessToken을 재발급받습니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: JWTResponse,
  })
  @Post("/refresh")
  async refreshToken(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
    @Body() data: RefreshTokenDTO,
  ) {
    let token: { accessToken: string; refreshToken: string };
    if (!data || !data.refreshToken) {
      token = await this.authService.refresh(req.cookies[REFRESH_TOKEN_COOKIE]!);
      this.generateCookie(res, token);
    } else {
      token = await this.authService.refresh(data.refreshToken);
      return token;
    }
  }

  @ApiOperation({
    summary: "로그아웃",
    description: "로그아웃합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
  })
  @UseGuardsWithSwagger(CustomJwtAuthGuard)
  @Get("/logout")
  async logout(
    @Req() req: FastifyRequest & { user: any },
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    await this.authService.logout(req.user);

    const sameSite = process.env.NODE_ENV !== "dev" ? "none" : "lax";
    const domains =
      process.env.NODE_ENV !== "dev"
        ? this.configService.get<string>("ALLOWED_DOMAIN")!.split(",")
        : [undefined];
    const secure = process.env.NODE_ENV !== "dev";

    res.header("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.header("Pragma", "no-cache");
    res.header("Expires", "0");

    for (const domain of domains) {
      res.clearCookie(ACCESS_TOKEN_COOKIE, {
        path: "/",
        httpOnly: true,
        secure,
        sameSite,
        domain,
      });
      res.clearCookie(REFRESH_TOKEN_COOKIE, {
        path: "/",
        httpOnly: true,
        secure,
        sameSite,
        domain,
      });
    }
    return { success: true };
  }

  @ApiOperation({
    summary: "신원확인 토큰 발급",
    description:
      "개인정보 서버에 개인정보 제공 요청을 넣을때 신원을 확인하기 위한 토큰을 발급합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
  })
  @UseGuardsWithSwagger(CustomJwtAuthGuard, PermissionGuard([PermissionEnum.STUDENT]))
  @Get("/personalInformationVerifyToken")
  async getPersonalInformationVerifyToken(@Req() req: FastifyRequest & { user: any }) {
    return await this.authService.generatePersonalInformationVerifyToken(req.user);
  }

  @ApiOperation({
    summary: "신원확인",
    description: "발급된 신원확인 토큰을 검증합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.CREATED,
  })
  @UseGuardsWithSwagger(PersonalInformationVerifyTokenAuthGuard)
  @Post("/personalInformationVerifyToken")
  async runPersonalInformationVerifyToken(
    @Req() req: FastifyRequest & { user: any },
    @Body() data: RunPersonalInformationVerifyTokenDTO,
  ) {
    return req.user.email;
  }

  generateCookie(res: FastifyReply, token: { accessToken: string; refreshToken: string }) {
    res.clearCookie(ACCESS_TOKEN_COOKIE);
    res.clearCookie(REFRESH_TOKEN_COOKIE);

    const sameSite = process.env.NODE_ENV !== "dev" ? "none" : "lax";
    const domains =
      process.env.NODE_ENV !== "dev"
        ? this.configService.get<string>("ALLOWED_DOMAIN")!.split(",")
        : [undefined];

    for (const domain of domains) {
      res.setCookie(ACCESS_TOKEN_COOKIE, token.accessToken, {
        path: "/",
        maxAge: 60 * 30,
        httpOnly: true,
        secure: process.env.NODE_ENV !== "dev",
        sameSite,
        domain,
      });
      res.setCookie(REFRESH_TOKEN_COOKIE, token.refreshToken, {
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
        httpOnly: true,
        secure: process.env.NODE_ENV !== "dev",
        sameSite,
        domain,
      });
    }
  }
}
