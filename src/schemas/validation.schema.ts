import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

import type { PermissionValidationType } from '../common/mapper/types';

@Entity()
export class PermissionValidator {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  type: PermissionValidationType;

  @Column()
  key: string;

  @Column('int8')
  value: string;
}
