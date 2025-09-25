'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create history table if it doesn't exist
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.tables WHERE table_name = 'history'
        ) THEN
          CREATE TABLE history (
            id SERIAL PRIMARY KEY,
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            source VARCHAR(50) NOT NULL CHECK (source IN ('database', 'web')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
          );
        END IF;
      END
      $$;
    `);

    // Create index safely (if it doesn't exist)
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE c.relname = 'idx_history_created_at'
        ) THEN
          CREATE INDEX idx_history_created_at ON history (created_at);
        END IF;
      END
      $$;
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('history');
  },
};
