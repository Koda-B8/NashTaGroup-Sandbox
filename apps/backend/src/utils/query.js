export const parseBoolean = (value) => {
	if (value === "true") return true;
	if (value === "false") return false;

	return;
};

export const parseSearch = (value) =>
	typeof value === "string" ? value.trim() : "";
