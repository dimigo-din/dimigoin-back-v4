import * as process from "node:process";

import { Body, Controller, Get, HttpStatus, Post, Query, Req, Res } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "../common/mapper/constants";

import {
  GoogleLoginDTO,
  JWTResponse,
  PasswordLoginDTO,
  RedirectUriDTO,
  RefreshTokenDTO,
} from "./auth.dto";
import { AuthService } from "./auth.service";
import { CustomJwtAuthGuard } from "./guards";
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
  @ApiResponse({
    status: HttpStatus.OK,
    type: JWTResponse,
  })
  @Post("/login/password")
  async passwordLogin(@Res({ passthrough: true }) res, @Body() data: PasswordLoginDTO) {
    const token = await this.authService.loginByIdPassword(data.email, data.password);
    this.generateCookie(res, token);

    return token;
  }

  @ApiOperation({
    summary: "로그인 - 구글",
    description: "구글 OAuth2 로그인 화면으로 리다이렉트하는 엔드포인트입니다.",
  })
  @ApiResponse({
    status: HttpStatus.FOUND,
  })
  @Get("/login/google")
  async googleLogin(@Res() res, @Query() data: RedirectUriDTO) {
    return res.redirect(await this.authService.getGoogleLoginUrl(data));
  }

  @ApiOperation({
    summary: "로그인 콜백 - 구글",
    description: "구글 로그인 콜백 엔드포인트입니다.",
  })
  @ApiResponse({
    status: HttpStatus.FOUND,
    type: JWTResponse,
  })
  @Get("/login/google/callback")
  async googleLoginCallback(@Res({ passthrough: true }) res, @Query() data: GoogleLoginDTO) {
    const token = await this.authService.loginByGoogle(data.code);
    this.generateCookie(res, token);
    return token;
  }

  @ApiOperation({
    summary: "토큰 재발급",
    description: "만료된 accessToken을 재발급받습니다.",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: JWTResponse,
  })
  @Get("/refresh")
  async refreshToken(@Req() req, @Res({ passthrough: true }) res, @Body() data: RefreshTokenDTO) {
    let token;
    if (!data || !data.refreshToken) {
      token = await this.authService.refresh(req.cookies[REFRESH_TOKEN_COOKIE]);
    } else {
      token = await this.authService.refresh(data.refreshToken);
    }
    this.generateCookie(res, token);

    return token;
  }

  @ApiOperation({
    summary: "로그아웃",
    description: "로그아웃합니다.",
  })
  @ApiResponse({
    status: HttpStatus.OK,
  })
  @UseGuardsWithSwagger(CustomJwtAuthGuard)
  @Get("/logout")
  async logout(@Req() req) {
    return await this.authService.logout(req.user);
  }

  generateCookie(res: any, token) {
    const sameSite = process.env.NODE_ENV === "prod" ? "none" : undefined;
    const domain =
      process.env.NODE_ENV === "prod" ? `.${this.configService.get<string>("DOMAIN")}` : undefined;
    res.cookie(ACCESS_TOKEN_COOKIE, token.accessToken, {
      path: "/",
      maxAge: 1000 * 60 * 30,
      httpOnly: true,
      sameSite,
      domain,
    });
    res.cookie(REFRESH_TOKEN_COOKIE, token.refreshToken, {
      path: "/",
      maxAge: 1000 * 60 * 60 * 24 * 30,
      httpOnly: true,
      sameSite,
      domain,
    });
  }
}
