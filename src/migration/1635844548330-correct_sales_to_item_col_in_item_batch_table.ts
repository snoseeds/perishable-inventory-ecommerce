import {MigrationInterface, QueryRunner} from "typeorm";

export class correctSalesToItemColInItemBatchTable1635844548330 implements MigrationInterface {
    name = 'correctSalesToItemColInItemBatchTable1635844548330'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "item_batch" DROP CONSTRAINT "FK_c72257f87a78e1088d6f2572f4c"`);
        await queryRunner.query(`ALTER TABLE "item_batch" RENAME COLUMN "salesId" TO "itemId"`);
        await queryRunner.query(`ALTER TABLE "item_batch" ADD CONSTRAINT "FK_94592ca4a1c76853a7c7ddc6e64" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "item_batch" DROP CONSTRAINT "FK_94592ca4a1c76853a7c7ddc6e64"`);
        await queryRunner.query(`ALTER TABLE "item_batch" RENAME COLUMN "itemId" TO "salesId"`);
        await queryRunner.query(`ALTER TABLE "item_batch" ADD CONSTRAINT "FK_c72257f87a78e1088d6f2572f4c" FOREIGN KEY ("salesId") REFERENCES "item"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
