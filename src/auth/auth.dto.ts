import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsInt, IsOptional, Max, Min } from "class-validator";
import { IsString } from "nestjs-swagger-dto";
import { GenderValues } from "$mapper/types";

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

export class GoogleWebLoginDTO {
  @ApiProperty()
  @IsString()
  code: string;

  @ApiProperty()
  @IsString()
  redirect_uri: string;
}

export class GoogleAppLoginDTO {
  @ApiProperty()
  @IsString()
  idToken: string;
}

export class RefreshTokenDTO {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
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

export class SignupDTO {
  @ApiProperty({ minimum: 1, maximum: 3 })
  @IsInt()
  @Min(1)
  @Max(3)
  grade: number;

  @ApiProperty({ minimum: 1, maximum: 6 })
  @IsInt()
  @Min(1)
  @Max(6)
  class: number;

  @ApiProperty({ enum: GenderValues })
  @IsIn(GenderValues)
  gender: (typeof GenderValues)[number];
}
