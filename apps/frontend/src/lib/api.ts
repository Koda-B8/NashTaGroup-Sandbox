const STORAGE_KEY = "csrfToken";

function getCsrfFromCookie(): string | null {
	for (const name of ["csrfToken", "csrf_token"]) {
		const prefix = `${name}=`;
		const row = document.cookie.split("; ").find((c) => c.startsWith(prefix));
		if (row) {
			const val = row.slice(prefix.length);
			if (val) return decodeURIComponent(val);
		}
	}
	return null;
}

function getCsrfFromStorage(): string | null {
	try {
		const v = localStorage.getItem(STORAGE_KEY);
		if (v) return v;
	} catch {}
	return null;
}

let csrfToken: string | null = (() => {
	const fromCookie = getCsrfFromCookie();
	if (fromCookie) return fromCookie;
	return getCsrfFromStorage();
})();

export async function getCsrfToken(): Promise<string | null> {
	if (csrfToken) return csrfToken;
	const fromCookie = getCsrfFromCookie();
	if (fromCookie) {
		csrfToken = fromCookie;
		return csrfToken;
	}
	const fromStorage = getCsrfFromStorage();
	if (fromStorage) {
		csrfToken = fromStorage;
		return csrfToken;
	}
	return null;
}

export function setCsrfToken(token: string | null) {
	csrfToken = token;
	try {
		if (token) localStorage.setItem(STORAGE_KEY, token);
		else localStorage.removeItem(STORAGE_KEY);
	} catch {}
}

export function clearCsrfCache() {
	csrfToken = null;
	try {
		localStorage.removeItem(STORAGE_KEY);
	} catch {}
}

export async function apiFetch(
	input: RequestInfo | URL,
	init: RequestInit = {},
): Promise<Response> {
	const method = (init.method ?? "GET").toUpperCase();
	const isMutating = !["GET", "HEAD", "OPTIONS"].includes(method);
	const headers: Record<string, string> = {
		...(init.headers as Record<string, string>),
	};

	if (isMutating) {
		const token = csrfToken ?? getCsrfFromCookie() ?? getCsrfFromStorage() ?? (await getCsrfToken());
		if (token) headers["X-CSRF-Token"] = token;
		if (!headers["Content-Type"] && !(init.body instanceof FormData)) {
			headers["Content-Type"] = "application/json";
		}
	}

	const doFetch = (h: Record<string, string>) =>
		fetch(input, { ...init, credentials: "include", headers: h });

	let res = await doFetch(headers);

	if (isMutating && res.status === 403) {
		let shouldRetry = false;
		try {
			const clone = res.clone();
			const ct = clone.headers.get("content-type") ?? "";
			if (ct.includes("application/json")) {
				const body = (await clone.json()) as { message?: string; error?: string };
				const msg = `${body?.message ?? ""} ${body?.error ?? ""}`.toLowerCase();
				if (msg.includes("csrf")) shouldRetry = true;
			} else {
				const txt = (await clone.text()).toLowerCase();
				if (txt.includes("csrf")) shouldRetry = true;
			}
		} catch {
			shouldRetry = true;
		}
		if (shouldRetry) {
			const fresh = getCsrfFromCookie() ?? getCsrfFromStorage();
			if (fresh && fresh !== headers["X-CSRF-Token"]) {
				csrfToken = fresh;
				headers["X-CSRF-Token"] = fresh;
				res = await doFetch(headers);
			}
		}
	}

	const newToken = res.headers.get("X-CSRF-Token") ?? res.headers.get("x-csrf-token");
	if (newToken) setCsrfToken(newToken);

	return res;
}
