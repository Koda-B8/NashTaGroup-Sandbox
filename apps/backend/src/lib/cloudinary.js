import { v2 as cloudinary } from "cloudinary";

cloudinary.config({ secure: true });

const PRODUCT_IMAGE_FOLDER =
	process.env.CLOUDINARY_PRODUCT_IMAGE_FOLDER ?? "Sandbox/products";

export const uploadProductImage = (buffer) =>
	new Promise((resolve, reject) => {
		const uploadStream = cloudinary.uploader.upload_stream(
			{
				allowed_formats: ["avif", "jpg", "jpeg", "png", "webp"],
				folder: PRODUCT_IMAGE_FOLDER,
				overwrite: false,
				resource_type: "image",
				unique_filename: true,
			},
			(error, result) => {
				if (error) {
					reject(error);
					return;
				}
				if (!result?.public_id || !result.secure_url) {
					reject(
						new Error("Cloudinary returned an incomplete upload response"),
					);
					return;
				}

				resolve({
					publicId: result.public_id,
					url: cloudinary.url(result.public_id, {
						fetch_format: "auto",
						quality: "auto",
						secure: true,
					}),
				});
			},
		);

		uploadStream.end(buffer);
	});

export const deleteProductImage = (publicId) =>
	cloudinary.uploader.destroy(publicId, {
		invalidate: true,
		resource_type: "image",
	});
