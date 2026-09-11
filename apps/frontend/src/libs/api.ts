let csrfToken: string | null = null;

let pendingRefresh: Promise<string | null> | null = null;

export async function refreshCsrfToken(): Promise<string | null> {
	if (pendingRefresh) return pendingRefresh;

	pendingRefresh = (async () => {
		try {
			const res = await fetch("/api/v1/auth/csrf-token", {
				method: "GET",
				credentials: "include",
				headers: { Accept: "application/json" },
			});

			if (!res.ok) {
				if (res.status === 401) clearCsrfCache();
				return null;
			}

			const body = (await res.json().catch(() => ({}))) as {
				data?: { csrfToken?: string };
				csrfToken?: string;
			};
			const token = body?.data?.csrfToken ?? body?.csrfToken ?? null;
			if (token) setCsrfToken(token);
			return token;
		} catch {
			return null;
		} finally {
			pendingRefresh = null;
		}
	})();

	return pendingRefresh;
}

export async function getCsrfToken(): Promise<string | null> {
	if (csrfToken) return csrfToken;
	return refreshCsrfToken();
}

export const ensureCsrfToken = getCsrfToken;
export const fetchCsrfToken = refreshCsrfToken;

export function setCsrfToken(token: string | null) {
	csrfToken = token;
}

export function clearCsrfCache() {
	csrfToken = null;
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
		let token = csrfToken;
		if (!token) token = await refreshCsrfToken();
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
				const body = (await clone.json()) as {
					message?: string;
					error?: string;
				};
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
			const fresh = await refreshCsrfToken();
			if (fresh && fresh !== headers["X-CSRF-Token"]) {
				csrfToken = fresh;
				headers["X-CSRF-Token"] = fresh;
				res = await doFetch(headers);
			}
		}
	}

	const newToken =
		res.headers.get("X-CSRF-Token") ?? res.headers.get("x-csrf-token");
	if (newToken) setCsrfToken(newToken);

	return res;
}
