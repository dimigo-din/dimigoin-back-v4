import { Body, Controller, Get, HttpStatus, Post, Query, Req, Res } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import {
  GoogleLoginDTO,
  GoogleLoginRequestDTO,
  JWTResponse,
  OAuthCodeExchangeDTO,
  PasswordLoginDTO,
  RefreshTokenDTO,
} from "./auth.dto";
import { AuthService } from "./auth.service";
import { CustomJwtAuthGuard } from "./guards";
import { UseGuardsWithSwagger } from "./guards/useGuards";

@ApiTags("Auth")
@Controller("/auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
  async passwordLogin(@Body() data: PasswordLoginDTO) {
    return await this.authService.loginByIdPassword(data.email, data.password);
  }

  @ApiOperation({
    summary: "로그인 - 구글",
    description: "구글 OAuth2 로그인 화면으로 리다이렉트하는 엔드포인트입니다.",
  })
  @ApiResponse({
    status: HttpStatus.FOUND,
  })
  @Get("/login/google")
  async googleLogin(@Res() res, @Query() data: GoogleLoginRequestDTO) {
    return res.redirect(
      await this.authService.getGoogleLoginUrl(data.client_id, data.redirect_uri, data.state),
    );
  }

  @ApiOperation({
    summary: "로그인 콜백 - 구글",
    description: "구글 로그인 콜백 엔드포인트입니다.",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: JWTResponse,
  })
  @Get("/login/google/callback")
  async googleLoginCallback(@Query() data: GoogleLoginDTO) {
    return await this.authService.loginByGoogle(data.code, data.state);
  }

  @ApiOperation({
    summary: "OAuth code 교환",
    description: "OAuth 인증 코드를 인증 토큰으로 변환합니다.",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: JWTResponse,
  })
  @Post("/login/exchange")
  async oauthCodeExchange(@Body() data: OAuthCodeExchangeDTO) {
    return await this.authService.oauthCodeExchange(data.client_id, data.client_pw, data.code);
  }

  @ApiOperation({
    summary: "토큰 재발급",
    description: "만료된 accessToken을 재발급받습니다.",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: JWTResponse,
  })
  @Post("/refresh")
  async refreshToken(@Body() data: RefreshTokenDTO) {
    return await this.authService.refresh(data.refreshToken);
  }

  @ApiOperation({
    summary: "로그아웃",
    description: "로그아웃합니다.",
  })
  @ApiResponse({
    status: HttpStatus.OK,
  })
  @UseGuardsWithSwagger(CustomJwtAuthGuard)
  @Post("/logout")
  async logout(@Req() req) {
    return await this.authService.logout(req.user);
  }
}
