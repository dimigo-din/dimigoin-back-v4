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

export class GoogleLoginDTO {
  @ApiProperty()
  @IsString()
  code: string;
}

export class RefreshTokenDTO {
  @ApiProperty()
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
