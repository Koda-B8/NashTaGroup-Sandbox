export class HttpError extends Error {
	constructor(statusCode, message) {
		super(message);
		this.statusCode = statusCode;
	}
}

export const createHttpError = (statusCode, message) =>
	new HttpError(statusCode, message);
