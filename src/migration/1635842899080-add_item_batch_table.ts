import {MigrationInterface, QueryRunner} from "typeorm";

export class addItemBatchTable1635842899080 implements MigrationInterface {
    name = 'addItemBatchTable1635842899080'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "batch" DROP CONSTRAINT "FK_9973844b631348e29cf44971278"`);
        await queryRunner.query(`CREATE TABLE "item_batch" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createDateTime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "lastChangedDateTime" TIMESTAMP WITH TIME ZONE DEFAULT now(), "quantity" integer NOT NULL, "batchId" uuid, "salesId" uuid, CONSTRAINT "PK_0249035ec82edaf34e24749e674" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "batch" DROP COLUMN "quantity"`);
        await queryRunner.query(`ALTER TABLE "batch" DROP COLUMN "itemId"`);
        await queryRunner.query(`ALTER TABLE "item_batch" ADD CONSTRAINT "FK_5cbccb148c9edf93e69cbe3c7b4" FOREIGN KEY ("batchId") REFERENCES "batch"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "item_batch" ADD CONSTRAINT "FK_c72257f87a78e1088d6f2572f4c" FOREIGN KEY ("salesId") REFERENCES "item"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "item_batch" DROP CONSTRAINT "FK_c72257f87a78e1088d6f2572f4c"`);
        await queryRunner.query(`ALTER TABLE "item_batch" DROP CONSTRAINT "FK_5cbccb148c9edf93e69cbe3c7b4"`);
        await queryRunner.query(`ALTER TABLE "batch" ADD "itemId" uuid`);
        await queryRunner.query(`ALTER TABLE "batch" ADD "quantity" integer NOT NULL`);
        await queryRunner.query(`DROP TABLE "item_batch"`);
        await queryRunner.query(`ALTER TABLE "batch" ADD CONSTRAINT "FK_9973844b631348e29cf44971278" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
