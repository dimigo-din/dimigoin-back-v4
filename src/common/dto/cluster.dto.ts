import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { IsString } from 'nestjs-swagger-dto';

export const deployment = ['prod', 'stg', 'dev', 'test'] as const;
export type Deployment = (typeof deployment)[number];

export class ClusterDto {
  @IsString({
    description: '프로젝트 이름',
    example: 'Backend',
  })
  name: string;

  @IsString({
    description: '프로젝트 버전',
    example: '1.0.0',
  })
  version: string;

  @IsString({
    description: '프로젝트 설명',
    example: '~~~ 프로젝트의 백엔드입니다.',
  })
  description: string;

  @ApiProperty({
    description: '배포 모드',
    example: deployment[0] as string,
  })
  @IsIn(deployment)
  mode: Deployment;

  @IsString({
    description: '작성자',
    example: '<이름> (이메일)',
  })
  author: string;
}
