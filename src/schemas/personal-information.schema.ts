import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

import { Gender, Grade } from "../common/mapper/types";

// This is temporal entity for testing before auth server being built.
@Entity()
export class PersonalInformationSchema {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  email: string;

  @Column("int")
  grade: Grade;

  @Column("int")
  class: number;

  @Column("int")
  number: number;

  /** grade + class + number */
  @Column("varchar")
  hakbun: string;

  @Column()
  gender: Gender;
}
