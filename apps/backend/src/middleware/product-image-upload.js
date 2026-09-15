import { constants } from "node:http2";

import multer from "multer";

import { createHttpError } from "../utils/http-error.js";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
	"image/avif",
	"image/jpeg",
	"image/png",
	"image/webp",
]);

const detectedImageType = (buffer) => {
	if (
		buffer.length >= 3 &&
		buffer.subarray(0, 3).equals(Buffer.from("ffd8ff", "hex"))
	)
		return "image/jpeg";
	if (
		buffer.length >= 8 &&
		buffer.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))
	)
		return "image/png";
	if (
		buffer.length >= 12 &&
		buffer.toString("ascii", 0, 4) === "RIFF" &&
		buffer.toString("ascii", 8, 12) === "WEBP"
	)
		return "image/webp";
	if (
		buffer.length >= 16 &&
		buffer.toString("ascii", 4, 8) === "ftyp" &&
		buffer.toString("ascii", 8, 12) === "avif"
	)
		return "image/avif";
	return;
};

const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fieldNameSize: 30,
		fieldSize: 512,
		fields: 5,
		fileSize: MAX_IMAGE_SIZE,
		files: 1,
		parts: 6,
		headerPairs: 32,
	},
	fileFilter: (_request, file, callback) => {
		if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
			callback(
				createHttpError(
					constants.HTTP_STATUS_UNSUPPORTED_MEDIA_TYPE,
					"Image must be an AVIF, JPEG, PNG, or WebP file",
				),
			);
			return;
		}

		callback(undefined, true);
	},
}).single("image");

export default function productImageUpload(request, response, next) {
	upload(request, response, (error) => {
		if (!error) {
			if (
				request.file &&
				detectedImageType(request.file.buffer) !== request.file.mimetype
			) {
				return next(
					createHttpError(
						constants.HTTP_STATUS_UNSUPPORTED_MEDIA_TYPE,
						"Image content does not match its declared type",
					),
				);
			}
			return next();
		}

		if (error instanceof multer.MulterError) {
			const statusCode =
				error.code === "LIMIT_FILE_SIZE"
					? constants.HTTP_STATUS_PAYLOAD_TOO_LARGE
					: constants.HTTP_STATUS_BAD_REQUEST;

			return next(createHttpError(statusCode, error.message));
		}

		return next(error);
	});
}
