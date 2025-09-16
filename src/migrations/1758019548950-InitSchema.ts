import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1758019548950 implements MigrationInterface {
    name = 'InitSchema1758019548950'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "push_subscription" DROP COLUMN "endpoint"`);
        await queryRunner.query(`ALTER TABLE "push_subscription" ADD "endpoint" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "push_subscription" DROP COLUMN "p256dh"`);
        await queryRunner.query(`ALTER TABLE "push_subscription" ADD "p256dh" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "push_subscription" DROP COLUMN "auth"`);
        await queryRunner.query(`ALTER TABLE "push_subscription" ADD "auth" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "push_subscription" DROP COLUMN "deviceName"`);
        await queryRunner.query(`ALTER TABLE "push_subscription" ADD "deviceName" character varying`);
        await queryRunner.query(`ALTER TABLE "push_subscription" DROP COLUMN "userAgent"`);
        await queryRunner.query(`ALTER TABLE "push_subscription" ADD "userAgent" character varying`);
        await queryRunner.query(`ALTER TABLE "push_subscription" DROP COLUMN "expirationTime"`);
        await queryRunner.query(`ALTER TABLE "push_subscription" ADD "expirationTime" integer`);
        await queryRunner.query(`ALTER TABLE "push_subscription" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "push_subscription" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "push_subscription" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "push_subscription" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "push_subscription" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "push_subscription" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "push_subscription" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "push_subscription" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "push_subscription" DROP COLUMN "expirationTime"`);
        await queryRunner.query(`ALTER TABLE "push_subscription" ADD "expirationTime" bigint`);
        await queryRunner.query(`ALTER TABLE "push_subscription" DROP COLUMN "userAgent"`);
        await queryRunner.query(`ALTER TABLE "push_subscription" ADD "userAgent" text`);
        await queryRunner.query(`ALTER TABLE "push_subscription" DROP COLUMN "deviceName"`);
        await queryRunner.query(`ALTER TABLE "push_subscription" ADD "deviceName" text`);
        await queryRunner.query(`ALTER TABLE "push_subscription" DROP COLUMN "auth"`);
        await queryRunner.query(`ALTER TABLE "push_subscription" ADD "auth" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "push_subscription" DROP COLUMN "p256dh"`);
        await queryRunner.query(`ALTER TABLE "push_subscription" ADD "p256dh" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "push_subscription" DROP COLUMN "endpoint"`);
        await queryRunner.query(`ALTER TABLE "push_subscription" ADD "endpoint" text NOT NULL`);
    }

}
