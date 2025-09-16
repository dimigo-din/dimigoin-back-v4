import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsObject, IsOptional, IsString, ValidateNested } from "class-validator";

export class PushNotificationPayloadDTO {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  body: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  url: string;

  @ApiProperty()
  @IsObject()
  @IsOptional()
  data: any = {};

  @ApiProperty({ type: () => [PushNotificationActionsDTO] })
  @ValidateNested({ each: true })
  @Type(() => PushNotificationActionsDTO)
  actions: PushNotificationActionsDTO[];

  @ApiProperty()
  @IsString()
  icon: string;

  @ApiProperty()
  @IsString()
  badge: string;
}

export class PushNotificationActionsDTO {
  @ApiProperty()
  @IsString()
  action: string;

  @ApiProperty()
  @IsString()
  title: string;
}

export class PushNotificationToSpecificDTO extends PushNotificationPayloadDTO {
  @ApiProperty()
  @IsString({ each: true })
  to: string[];
}

export class PushNotificationResultResponseDTO {
  @ApiProperty()
  sent: number;

  @ApiProperty()
  failed: number;
}
