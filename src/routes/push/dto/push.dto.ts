import { IsString, IsObject, IsOptional, IsNumber } from 'class-validator';

export class CreateSubscriptionDto {
  @IsString() endpoint: string;
  @IsObject() keys: { p256dh: string; auth: string };
  @IsOptional() @IsNumber() expirationTime?: number | null;
}

export type PushPayloadDTO = {
  title?: string;
  body?: string;
  url?: string;
  data?: any;
  actions?: Array<{ action: string; title: string }>;
  icon?: string;
  badge?: string;
};