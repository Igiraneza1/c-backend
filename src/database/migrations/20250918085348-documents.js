'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Ensure the vector extension exists
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS vector;');

    // Create documents table if it doesn't exist
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.tables WHERE table_name = 'documents'
        ) THEN
          CREATE TABLE documents (
            id SERIAL PRIMARY KEY,
            filename TEXT NOT NULL,
            filepath TEXT NOT NULL,
            content TEXT NOT NULL,
            embedding vector(384) NOT NULL,
            created_at TIMESTAMP DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMP DEFAULT NOW() NOT NULL
          );
        END IF;
      END
      $$;
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables WHERE table_name = 'documents'
        ) THEN
          DROP TABLE documents;
        END IF;
      END
      $$;
    `);

    await queryInterface.sequelize.query('DROP EXTENSION IF EXISTS vector;');
  },
};
