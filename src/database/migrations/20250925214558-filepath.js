'use strict';

export async function up(queryInterface, Sequelize) {
  await queryInterface.changeColumn('documents', 'filepath', {
    type: Sequelize.TEXT,
    allowNull: true,  
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.changeColumn('documents', 'filepath', {
    type: Sequelize.TEXT,
    allowNull: false, 
  });
}
