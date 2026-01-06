import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsIn, IsObject, IsOptional, IsString, ValidateNested } from "class-validator";
import {
  PushNotificationSubjectIdentifier,
  PushNotificationSubjectIdentifierValues,
} from "../../../common/mapper/types";

export class PushNotificationPayloadDTO {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  body: string;

  @ApiProperty({ enum: PushNotificationSubjectIdentifierValues })
  @IsIn(PushNotificationSubjectIdentifierValues)
  category: PushNotificationSubjectIdentifier;

  @ApiProperty()
  @IsString()
  @IsOptional()
  url: string;

  @ApiProperty()
  @IsObject()
  @IsOptional()
  data: unknown = {};

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

export class GetSubscriptionsByCategoryDTO {
  @ApiProperty({ enum: PushNotificationSubjectIdentifierValues })
  @IsIn(PushNotificationSubjectIdentifierValues)
  category: PushNotificationSubjectIdentifier;
}

export class GetSubscriptionsByUserDTO {
  @ApiProperty({ description: "userid" })
  @IsString()
  id: string;
}

export class GetSubscriptionsByUserAndCategoryDTO {
  @ApiProperty({ description: "userid" })
  @IsString()
  id: string;

  @ApiProperty({ enum: PushNotificationSubjectIdentifierValues })
  @IsIn(PushNotificationSubjectIdentifierValues)
  category: PushNotificationSubjectIdentifier;
}

export class PushNotificationResultResponseDTO {
  @ApiProperty()
  sent: number;

  @ApiProperty()
  failed: number;
}
