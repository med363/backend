import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderStatusAndSharing1730423400000 implements MigrationInterface {
    name = 'AddOrderStatusAndSharing1730423400000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add status column with enum values
        await queryRunner.query(`
            ALTER TABLE \`orders\` 
            ADD COLUMN \`status\` ENUM('a_faire', 'en_cours', 'termine') NOT NULL DEFAULT 'a_faire'
        `);

        // Add sharedWithAcceptedUsers column
        await queryRunner.query(`
            ALTER TABLE \`orders\` 
            ADD COLUMN \`sharedWithAcceptedUsers\` BOOLEAN NOT NULL DEFAULT FALSE
        `);

        console.log('Migration: Added status and sharedWithAcceptedUsers columns to orders table');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove the columns
        await queryRunner.query(`ALTER TABLE \`orders\` DROP COLUMN \`sharedWithAcceptedUsers\``);
        await queryRunner.query(`ALTER TABLE \`orders\` DROP COLUMN \`status\``);

        console.log('Migration: Removed status and sharedWithAcceptedUsers columns from orders table');
    }
}