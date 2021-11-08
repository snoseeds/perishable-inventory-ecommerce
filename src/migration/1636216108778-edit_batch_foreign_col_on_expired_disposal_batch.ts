import {MigrationInterface, QueryRunner} from "typeorm";

export class editBatchForeignColOnExpiredDisposalBatch1636216108778 implements MigrationInterface {
    name = 'editBatchForeignColOnExpiredDisposalBatch1636216108778'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "expired_disposal_batch" ADD "batchId" uuid`);
        await queryRunner.query(`ALTER TABLE "expired_disposal_batch" ADD CONSTRAINT "FK_86e55e0f33d097f2ef62df5f2ac" FOREIGN KEY ("batchId") REFERENCES "batch"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "expired_disposal_batch" DROP CONSTRAINT "FK_86e55e0f33d097f2ef62df5f2ac"`);
        await queryRunner.query(`ALTER TABLE "expired_disposal_batch" DROP COLUMN "batchId"`);
    }

}
