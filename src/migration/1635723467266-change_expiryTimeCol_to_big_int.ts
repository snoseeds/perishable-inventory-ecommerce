import {MigrationInterface, QueryRunner} from "typeorm";

export class changeExpiryTimeColToBigInt1635723467266 implements MigrationInterface {
    name = 'changeExpiryTimeColToBigInt1635723467266'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "item" DROP COLUMN "minimumExpiryGap"`);
        await queryRunner.query(`ALTER TABLE "item" ADD "minimumExpiryGap" bigint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "batch" DROP COLUMN "expiryTime"`);
        await queryRunner.query(`ALTER TABLE "batch" ADD "expiryTime" bigint NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "batch" DROP COLUMN "expiryTime"`);
        await queryRunner.query(`ALTER TABLE "batch" ADD "expiryTime" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "item" DROP COLUMN "minimumExpiryGap"`);
        await queryRunner.query(`ALTER TABLE "item" ADD "minimumExpiryGap" integer NOT NULL DEFAULT '0'`);
    }

}
