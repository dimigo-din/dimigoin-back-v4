import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { type PermissionValidationType, PermissionValidationTypeValues } from "$mapper/types";

@Entity()
export class PermissionValidator {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "enum", enum: PermissionValidationTypeValues })
  type: PermissionValidationType;

  @Column()
  key: string;

  @Column("int8")
  value: string;
}
