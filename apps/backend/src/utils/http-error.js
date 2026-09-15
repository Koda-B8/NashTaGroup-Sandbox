export class HttpError extends Error {
	constructor(statusCode, message, errors) {
		super(message);
		this.statusCode = statusCode;

		if (errors !== undefined) {
			this.errors = errors;
		}
	}
}

export const createHttpError = (statusCode, message, errors) =>
	new HttpError(statusCode, message, errors);
