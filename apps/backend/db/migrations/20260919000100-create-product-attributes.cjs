module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable("category_attributes", {
			id: {
				type: Sequelize.UUID,
				allowNull: false,
				defaultValue: Sequelize.literal("gen_random_uuid()"),
				primaryKey: true,
			},
			category_id: {
				type: Sequelize.UUID,
				allowNull: false,
				references: { model: "categories", key: "id" },
				onUpdate: "CASCADE",
				onDelete: "CASCADE",
			},
			name: { type: Sequelize.STRING(100), allowNull: false },
			is_required: {
				type: Sequelize.BOOLEAN,
				allowNull: false,
				defaultValue: false,
			},
			is_variant: {
				type: Sequelize.BOOLEAN,
				allowNull: false,
				defaultValue: true,
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
		await queryInterface.addConstraint("category_attributes", {
			fields: ["category_id", "name"],
			type: "unique",
			name: "category_attributes_category_id_name_unique",
		});
		await queryInterface.addIndex("category_attributes", ["category_id"], {
			name: "category_attributes_category_id_idx",
		});

		await queryInterface.createTable("product_item_attribute_values", {
			id: {
				type: Sequelize.UUID,
				allowNull: false,
				defaultValue: Sequelize.literal("gen_random_uuid()"),
				primaryKey: true,
			},
			product_item_id: {
				type: Sequelize.UUID,
				allowNull: false,
				references: { model: "product_items", key: "id" },
				onUpdate: "CASCADE",
				onDelete: "CASCADE",
			},
			category_attribute_id: {
				type: Sequelize.UUID,
				allowNull: false,
				references: { model: "category_attributes", key: "id" },
				onUpdate: "CASCADE",
				onDelete: "RESTRICT",
			},
			value: { type: Sequelize.TEXT, allowNull: false },
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
		await queryInterface.addConstraint("product_item_attribute_values", {
			fields: ["product_item_id", "category_attribute_id"],
			type: "unique",
			name: "product_item_attribute_values_item_attribute_unique",
		});
		await queryInterface.addIndex(
			"product_item_attribute_values",
			["product_item_id"],
			{ name: "product_item_attribute_values_item_id_idx" },
		);
	},

	async down(queryInterface) {
		await queryInterface.dropTable("product_item_attribute_values");
		await queryInterface.dropTable("category_attributes");
	},
};
