// oxlint-disable unicorn/no-null -- Sequelize uses null to express SQL NULL in migration definitions.
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.addColumn("product_items", "variant_signature", {
			type: Sequelize.TEXT,
			allowNull: true,
		});

		await queryInterface.sequelize.query(`
			UPDATE product_items AS product_item
			SET variant_signature = signatures.value
			FROM (
				SELECT
					attribute_value.product_item_id,
					string_agg(
						attribute_value.category_attribute_id::text || ':' ||
						attribute_value.category_attribute_option_id::text,
						'|' ORDER BY attribute_value.category_attribute_id
					) AS value
				FROM product_item_attribute_values AS attribute_value
				INNER JOIN category_attributes AS attribute
					ON attribute.id = attribute_value.category_attribute_id
				WHERE attribute.is_variant = TRUE
				GROUP BY attribute_value.product_item_id
			) AS signatures
			WHERE signatures.product_item_id = product_item.id
		`);

		await queryInterface.addIndex(
			"product_items",
			["product_id", "variant_signature"],
			{
				name: "product_items_product_variant_signature_unique",
				unique: true,
				where: {
					variant_signature: { [Sequelize.Op.ne]: null },
					deleted_at: null,
				},
			},
		);
	},

	async down(queryInterface) {
		await queryInterface.removeIndex(
			"product_items",
			"product_items_product_variant_signature_unique",
		);
		await queryInterface.removeColumn("product_items", "variant_signature");
	},
};
