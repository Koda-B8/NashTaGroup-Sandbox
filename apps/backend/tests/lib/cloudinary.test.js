import { PassThrough } from "node:stream";

import { v2 as cloudinary } from "cloudinary";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { uploadProductImage } from "../../src/lib/cloudinary.js";

const cloudinaryMocks = vi.hoisted(() => ({ uploadResult: vi.fn() }));

vi.mock("cloudinary", () => ({
	v2: {
		config: vi.fn(),
		url: vi.fn(),
		uploader: {
			upload_stream: vi.fn((_options, callback) => {
				const stream = new PassThrough();
				const noError = undefined;
				stream.once("finish", () =>
					callback(noError, cloudinaryMocks.uploadResult()),
				);
				return stream;
			}),
			destroy: vi.fn(),
		},
	},
}));

const publicId = "nashtagroup/products/galaxy-a55";
const secureUrl =
	"https://res.cloudinary.com/nashta/image/upload/galaxy-a55.jpg";
const optimizedUrl =
	"https://res.cloudinary.com/nashta/image/upload/f_auto,q_auto/galaxy-a55";

describe("Cloudinary product image upload", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns an optimized delivery URL built from the uploaded public ID", async () => {
		vi.mocked(cloudinary.url).mockReturnValue(optimizedUrl);
		cloudinaryMocks.uploadResult.mockReturnValue({
			public_id: publicId,
			secure_url: secureUrl,
		});

		const result = await uploadProductImage(Buffer.from("image"));

		expect(cloudinary.url).toHaveBeenCalledWith(publicId, {
			fetch_format: "auto",
			quality: "auto",
			secure: true,
		});
		expect(result).toEqual({ publicId, url: optimizedUrl });
	});

	it("rejects an incomplete Cloudinary upload response", async () => {
		cloudinaryMocks.uploadResult.mockReturnValue({ secure_url: secureUrl });

		await expect(uploadProductImage(Buffer.from("image"))).rejects.toThrow(
			"Cloudinary returned an incomplete upload response",
		);
		expect(cloudinary.url).not.toHaveBeenCalled();
	});
});
