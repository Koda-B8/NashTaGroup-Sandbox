import { apiFetch, setCsrfToken } from "../../libs/api";
import type { AuthUser } from "../../store/slices/auth";

export interface LoginPayload {
	username: string;
	password: string;
}

interface LoginResponse {
	message?: string;
	data?: AuthUser & { csrfToken?: string };
}

export async function login(payload: LoginPayload): Promise<AuthUser> {
	const res = await fetch("/api/v1/auth/login", {
		method: "POST",
		credentials: "include",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	});
	const body = (await res.json().catch(() => ({}))) as LoginResponse;

	if (!res.ok) {
		throw new Error(
			body?.message ?? "Login failed. Silakan periksa kredensial Anda.",
		);
	}

	const { csrfToken, ...user } = (body.data ?? {}) as AuthUser & {
		csrfToken?: string;
	};
	if (csrfToken) setCsrfToken(csrfToken);

	return user as AuthUser;
}

export async function logout(): Promise<boolean> {
	try {
		const res = await apiFetch("/api/v1/auth/logout", { method: "POST" });
		return res.ok;
	} catch {
		return false;
	}
}
