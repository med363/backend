import { MigrationInterface, QueryRunner } from "typeorm";

export class FixPostulerEtablissementNullValues1696000000000 implements MigrationInterface {
    name = 'FixPostulerEtablissementNullValues1696000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // First, delete all records with NULL etablissementId
        await queryRunner.query(`DELETE FROM "postulerofferforuser" WHERE "etablissementId" IS NULL`);
        
        // Then make the column NOT NULL
        await queryRunner.query(`ALTER TABLE "postulerofferforuser" ALTER COLUMN "etablissementId" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert: Make column nullable again
        await queryRunner.query(`ALTER TABLE "postulerofferforuser" ALTER COLUMN "etablissementId" DROP NOT NULL`);
        
        // Note: We can't restore the deleted records in the down migration
        // This is a destructive operation
    }
}