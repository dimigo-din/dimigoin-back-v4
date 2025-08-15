import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1755285087721 implements MigrationInterface {
    name = 'InitSchema1755285087721'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "laundry_apply" DROP CONSTRAINT "FK_445f0778710ce7785cc135c1ada"`);
        await queryRunner.query(`ALTER TABLE "laundry_apply" ADD CONSTRAINT "FK_445f0778710ce7785cc135c1ada" FOREIGN KEY ("laundryTimelineId") REFERENCES "laundry_timeline"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "laundry_apply" DROP CONSTRAINT "FK_445f0778710ce7785cc135c1ada"`);
        await queryRunner.query(`ALTER TABLE "laundry_apply" ADD CONSTRAINT "FK_445f0778710ce7785cc135c1ada" FOREIGN KEY ("laundryTimelineId") REFERENCES "laundry_timeline"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

}
