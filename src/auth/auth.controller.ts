import { Body, Controller, Get, HttpStatus, Post, Req } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { JWTResponse, PasswordLoginDTO, RefreshTokenDTO } from "./auth.dto";
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
