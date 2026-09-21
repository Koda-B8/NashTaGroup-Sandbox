// oxlint-disable unicorn/no-null -- SQL partial indexes require explicit NULL values.
module.exports = {
	async up(queryInterface) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.sequelize.query(
				'LOCK TABLE "product_images" IN ACCESS EXCLUSIVE MODE',
				{ transaction },
			);
			const [rows] = await queryInterface.sequelize.query(
				"SELECT COUNT(*)::int AS count FROM product_images WHERE product_item_id IS NOT NULL",
				{ transaction },
			);
			if (rows[0].count > 0) {
				throw new Error(
					"Cannot remove product item images while product item image records still exist",
				);
			}

			await queryInterface.removeIndex(
				"product_images",
				"product_images_one_primary_per_item",
				{ transaction },
			);
			await queryInterface.removeIndex(
				"product_images",
				"product_images_product_item_id_idx",
				{ transaction },
			);
			await queryInterface.removeIndex(
				"product_images",
				"product_images_one_primary_per_product",
				{ transaction },
			);
			await queryInterface.removeColumn("product_images", "product_item_id", {
				transaction,
			});
			await queryInterface.addIndex("product_images", ["product_id"], {
				name: "product_images_one_primary_per_product",
				unique: true,
				where: { is_primary: true },
				transaction,
			});
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.removeIndex(
				"product_images",
				"product_images_one_primary_per_product",
				{ transaction },
			);
			await queryInterface.addColumn(
				"product_images",
				"product_item_id",
				{
					type: Sequelize.UUID,
					allowNull: true,
					references: { model: "product_items", key: "id" },
					onUpdate: "CASCADE",
					onDelete: "CASCADE",
				},
				{ transaction },
			);
			await queryInterface.addIndex("product_images", ["product_item_id"], {
				name: "product_images_product_item_id_idx",
				transaction,
			});
			await queryInterface.addIndex("product_images", ["product_id"], {
				name: "product_images_one_primary_per_product",
				unique: true,
				where: { is_primary: true, product_item_id: null },
				transaction,
			});
			await queryInterface.addIndex("product_images", ["product_item_id"], {
				name: "product_images_one_primary_per_item",
				unique: true,
				where: {
					is_primary: true,
					product_item_id: { [Sequelize.Op.ne]: null },
				},
				transaction,
			});
		});
	},
};
