import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "nestjs-swagger-dto";

export class PasswordLoginDTO {
  @ApiProperty()
  @IsString()
  email: string;

  @ApiProperty()
  @IsString()
  password: string;
}

export class GoogleLoginRequestDTO {
  @ApiProperty()
  @IsString()
  client_id: string;

  @ApiProperty()
  @IsString()
  redirect_uri: string;

  @ApiProperty()
  @IsString({ nullable: true, default: "" })
  state: string;
}

export class GoogleLoginDTO {
  @ApiProperty()
  @IsString()
  code: string;

  @ApiProperty()
  @IsString()
  state: string;
}

export class OAuthCodeExchangeDTO {
  @ApiProperty()
  @IsString()
  client_id: string;

  @ApiProperty()
  @IsString()
  client_pw: string;

  @ApiProperty()
  @IsString()
  code: string;
}

export class RefreshTokenDTO {
  @ApiProperty()
  @IsString()
  refreshToken: string;
}

export class JWTResponse {
  @ApiProperty()
  @IsString()
  accessToken: string;

  @ApiProperty()
  @IsString()
  refreshToken: string;
}
