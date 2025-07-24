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

export class RedirectUriDTO {
  @ApiProperty()
  @IsString()
  redirect_uri?: string;
}

export class GoogleLoginDTO {
  @ApiProperty()
  @IsString()
  code: string;
}

export class RefreshTokenDTO {
  @ApiProperty({ required: false })
  refreshToken?: string;
}

export class JWTResponse {
  @ApiProperty()
  @IsString()
  accessToken: string;

  @ApiProperty()
  @IsString()
  refreshToken: string;
}

export class RunPersonalInformationVerifyTokenDTO {
  @ApiProperty()
  @IsString()
  token: string;
}
