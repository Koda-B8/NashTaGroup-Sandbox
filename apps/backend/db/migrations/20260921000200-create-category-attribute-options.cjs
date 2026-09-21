module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable("category_attribute_options", {
			id: {
				type: Sequelize.UUID,
				allowNull: false,
				defaultValue: Sequelize.literal("gen_random_uuid()"),
				primaryKey: true,
			},
			category_attribute_id: {
				type: Sequelize.UUID,
				allowNull: false,
				references: { model: "category_attributes", key: "id" },
				onUpdate: "CASCADE",
				onDelete: "CASCADE",
			},
			name: { type: Sequelize.STRING(100), allowNull: false },
			hex: { type: Sequelize.STRING(7), allowNull: true },
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
		await queryInterface.addConstraint("category_attribute_options", {
			fields: ["category_attribute_id", "name"],
			type: "unique",
			name: "category_attribute_options_attribute_name_unique",
		});
		await queryInterface.addIndex(
			"category_attribute_options",
			["category_attribute_id"],
			{ name: "category_attribute_options_attribute_id_idx" },
		);

		await queryInterface.addColumn(
			"product_item_attribute_values",
			"category_attribute_option_id",
			{
				type: Sequelize.UUID,
				allowNull: true,
				references: { model: "category_attribute_options", key: "id" },
				onUpdate: "CASCADE",
				onDelete: "RESTRICT",
			},
		);
		await queryInterface.addIndex(
			"product_item_attribute_values",
			["category_attribute_option_id"],
			{ name: "product_item_attribute_values_option_id_idx" },
		);

		await queryInterface.sequelize.query(`
			INSERT INTO category_attribute_options
				(id, category_attribute_id, name, sort_order, created_at, updated_at)
			SELECT gen_random_uuid(), category_attribute_id, value, 0, NOW(), NOW()
			FROM product_item_attribute_values
			GROUP BY category_attribute_id, value
		`);
		await queryInterface.sequelize.query(`
			UPDATE product_item_attribute_values AS values
			SET category_attribute_option_id = options.id
			FROM category_attribute_options AS options
			WHERE options.category_attribute_id = values.category_attribute_id
				AND options.name = values.value
		`);
		await queryInterface.changeColumn(
			"product_item_attribute_values",
			"category_attribute_option_id",
			{
				type: Sequelize.UUID,
				allowNull: false,
				references: { model: "category_attribute_options", key: "id" },
				onUpdate: "CASCADE",
				onDelete: "RESTRICT",
			},
		);
	},

	async down(queryInterface) {
		await queryInterface.removeColumn(
			"product_item_attribute_values",
			"category_attribute_option_id",
		);
		await queryInterface.dropTable("category_attribute_options");
	},
};
