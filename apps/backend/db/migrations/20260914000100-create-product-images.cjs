module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable("product_images", {
			id: {
				type: Sequelize.UUID,
				allowNull: false,
				defaultValue: Sequelize.literal("gen_random_uuid()"),
				primaryKey: true,
			},
			product_id: {
				type: Sequelize.UUID,
				allowNull: false,
				references: { model: "products", key: "id" },
				onUpdate: "CASCADE",
				onDelete: "CASCADE",
			},
			product_item_id: {
				type: Sequelize.UUID,
				allowNull: true,
				references: { model: "product_items", key: "id" },
				onUpdate: "CASCADE",
				onDelete: "CASCADE",
			},
			image_url: {
				type: Sequelize.STRING(2048),
				allowNull: false,
			},
			alt: {
				type: Sequelize.STRING(255),
				allowNull: false,
			},
			is_primary: {
				type: Sequelize.BOOLEAN,
				allowNull: false,
				defaultValue: false,
			},
			sort_order: {
				type: Sequelize.INTEGER,
				allowNull: false,
				defaultValue: 0,
			},
			created_at: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.fn("NOW"),
			},
			updated_at: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.fn("NOW"),
			},
		});

		await queryInterface.addIndex("product_images", ["product_id"], {
			name: "product_images_product_id_idx",
		});
		await queryInterface.addIndex("product_images", ["product_item_id"], {
			name: "product_images_product_item_id_idx",
		});
	},

	async down(queryInterface) {
		await queryInterface.dropTable("product_images");
	},
};
