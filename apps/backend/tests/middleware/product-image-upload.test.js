import express from "express";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import productImageUpload from "../../src/middleware/product-image-upload.js";

const app = express();
app.post("/upload", productImageUpload, (_request, response) =>
	response.json({ accepted: true }),
);
app.use((error, _request, response, _next) =>
	response.status(error.statusCode ?? 400).json({ message: error.message }),
);

let server;
let url;
beforeAll(async () => {
	server = app.listen(0, "127.0.0.1");
	await new Promise((resolve) => server.once("listening", resolve));
	url = `http://127.0.0.1:${server.address().port}/upload`;
});
afterAll(async () => {
	await new Promise((resolve) => server.close(resolve));
});

const send = async (bytes, type, extraFields = {}) => {
	const form = new FormData();
	form.append("image", new Blob([bytes], { type }), "image.bin");
	for (const [name, value] of Object.entries(extraFields))
		form.append(name, value);
	return fetch(url, { method: "POST", body: form });
};

describe("product image multipart upload", () => {
	it("accepts matching PNG content", async () => {
		const response = await send(
			Buffer.from("89504e470d0a1a0a", "hex"),
			"image/png",
		);
		expect(response.status).toBe(200);
	});
	it("rejects spoofed image MIME", async () => {
		const response = await send(Buffer.from("not an image"), "image/png");
		expect(response.status).toBe(415);
	});
	it("accepts multipart product fields without an image", async () => {
		const form = new FormData();
		for (const [name, value] of Object.entries({
			categoryId: "category",
			brandId: "brand",
			name: "Product",
			description: "Description",
			isActive: "true",
		}))
			form.append(name, value);
		const response = await fetch(url, { method: "POST", body: form });
		expect(response.status).toBe(200);
	});
	it("rejects excessive form fields", async () => {
		const response = await send(Buffer.from("ffd8ff", "hex"), "image/jpeg", {
			a: "1",
			b: "2",
			c: "3",
			d: "4",
			e: "5",
			f: "6",
		});
		expect(response.status).toBe(400);
	});
});
