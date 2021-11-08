import {MigrationInterface, QueryRunner} from "typeorm";

export class initialMigration1635718123689 implements MigrationInterface {
    name = 'initialMigration1635718123689'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "item" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createDateTime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "lastChangedDateTime" TIMESTAMP WITH TIME ZONE DEFAULT now(), "name" character varying NOT NULL, "minimumExpiryGap" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_d3c0c71f23e7adcf952a1d13423" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "batch" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createDateTime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "lastChangedDateTime" TIMESTAMP WITH TIME ZONE DEFAULT now(), "quantity" integer NOT NULL, "expiryTime" integer NOT NULL, "itemId" uuid, CONSTRAINT "PK_57da3b830b57bec1fd329dcaf43" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "disposal" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createDateTime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "lastChangedDateTime" TIMESTAMP WITH TIME ZONE DEFAULT now(), "disposalType" character varying NOT NULL, "quantity" integer NOT NULL, CONSTRAINT "PK_d815f4e5712e8c00ff7b2f09e73" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "expired_disposal" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createDateTime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "lastChangedDateTime" TIMESTAMP WITH TIME ZONE DEFAULT now(), "quantity" integer NOT NULL, "disposalId" uuid, "itemId" uuid, CONSTRAINT "PK_3b5d91385604a48b7da5a605b0a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "expired_disposal_batch" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createDateTime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "lastChangedDateTime" TIMESTAMP WITH TIME ZONE DEFAULT now(), "quantity" integer NOT NULL, "expiredDisposalId" uuid, CONSTRAINT "PK_aa83240272da2dc977e3002bd2b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "sales" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createDateTime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "lastChangedDateTime" TIMESTAMP WITH TIME ZONE DEFAULT now(), "quantity" integer NOT NULL, "itemId" uuid, CONSTRAINT "PK_4f0bc990ae81dba46da680895ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "sales_batch" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createDateTime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "lastChangedDateTime" TIMESTAMP WITH TIME ZONE DEFAULT now(), "quantity" integer NOT NULL, "batchId" uuid, "salesId" uuid, CONSTRAINT "PK_b19d0c682a84a07894d1a7412ac" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "batch" ADD CONSTRAINT "FK_9973844b631348e29cf44971278" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expired_disposal" ADD CONSTRAINT "FK_a5bf5974f19143f00bc8f6079d7" FOREIGN KEY ("disposalId") REFERENCES "disposal"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expired_disposal" ADD CONSTRAINT "FK_b417813df394a4b002f0fe12cfe" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expired_disposal_batch" ADD CONSTRAINT "FK_34f9fefaba7cd0ba31646c28c59" FOREIGN KEY ("expiredDisposalId") REFERENCES "expired_disposal"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sales" ADD CONSTRAINT "FK_cb0a5898d1c04cc45827058807f" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sales_batch" ADD CONSTRAINT "FK_e7849e1d6e606b13148b88531f2" FOREIGN KEY ("batchId") REFERENCES "batch"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sales_batch" ADD CONSTRAINT "FK_154b3d418a3cc318f70599d3794" FOREIGN KEY ("salesId") REFERENCES "sales"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sales_batch" DROP CONSTRAINT "FK_154b3d418a3cc318f70599d3794"`);
        await queryRunner.query(`ALTER TABLE "sales_batch" DROP CONSTRAINT "FK_e7849e1d6e606b13148b88531f2"`);
        await queryRunner.query(`ALTER TABLE "sales" DROP CONSTRAINT "FK_cb0a5898d1c04cc45827058807f"`);
        await queryRunner.query(`ALTER TABLE "expired_disposal_batch" DROP CONSTRAINT "FK_34f9fefaba7cd0ba31646c28c59"`);
        await queryRunner.query(`ALTER TABLE "expired_disposal" DROP CONSTRAINT "FK_b417813df394a4b002f0fe12cfe"`);
        await queryRunner.query(`ALTER TABLE "expired_disposal" DROP CONSTRAINT "FK_a5bf5974f19143f00bc8f6079d7"`);
        await queryRunner.query(`ALTER TABLE "batch" DROP CONSTRAINT "FK_9973844b631348e29cf44971278"`);
        await queryRunner.query(`DROP TABLE "sales_batch"`);
        await queryRunner.query(`DROP TABLE "sales"`);
        await queryRunner.query(`DROP TABLE "expired_disposal_batch"`);
        await queryRunner.query(`DROP TABLE "expired_disposal"`);
        await queryRunner.query(`DROP TABLE "disposal"`);
        await queryRunner.query(`DROP TABLE "batch"`);
        await queryRunner.query(`DROP TABLE "item"`);
    }

}
