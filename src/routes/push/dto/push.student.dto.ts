import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsString, IsOptional, IsNumber, ValidateNested } from "class-validator";

export class SubscriptionKeysDTO {
  @ApiProperty()
  @IsString()
  p256dh: string;

  @ApiProperty()
  @IsString()
  auth: string;
}

export class CreateSubscriptionDTO {
  @ApiProperty()
  @IsString()
  endpoint: string;

  @ApiProperty({ type: () => SubscriptionKeysDTO })
  @ValidateNested()
  @Type(() => SubscriptionKeysDTO)
  keys: SubscriptionKeysDTO;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  expirationTime?: number | null;
}

export class DeleteSubscriptionByEndpointDTO {
  @ApiProperty()
  @IsString()
  endpoint: string;
}
