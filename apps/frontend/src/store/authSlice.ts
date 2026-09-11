import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface AuthUser {
	id: string;
	fullname: string;
	role: string;
	exp?: number;
}

interface AuthState {
	user: AuthUser | null;
}

const AUTH_COOKIE = "auth_user";
const AUTH_COOKIE_MAX_AGE = 24 * 60 * 60;

function isExpired(user: Partial<AuthUser>): boolean {
	if (typeof user.exp !== "number") return false;
	return Date.now() / 1000 > user.exp;
}

function writeAuthCookie(user: AuthUser | null) {
	if (!user) {
		document.cookie = `${AUTH_COOKIE}=; max-age=0; path=/; samesite=lax`;
		return;
	}

	const exp = user.exp ?? Math.floor(Date.now() / 1000) + AUTH_COOKIE_MAX_AGE;
	const payload: AuthUser = { ...user, exp };
	const value = encodeURIComponent(JSON.stringify(payload));
	document.cookie = `${AUTH_COOKIE}=${value}; max-age=${AUTH_COOKIE_MAX_AGE}; path=/; samesite=lax`;
}

export function readAuthCookie(): AuthUser | null {
	const prefix = `${AUTH_COOKIE}=`;
	const raw = document.cookie
		.split("; ")
		.find((entry) => entry.startsWith(prefix))
		?.slice(prefix.length);

	if (!raw) return null;

	try {
		const parsed = JSON.parse(decodeURIComponent(raw)) as Partial<AuthUser>;

		if (
			typeof parsed.id !== "string" ||
			typeof parsed.fullname !== "string" ||
			typeof parsed.role !== "string"
		) {
			return null;
		}

		if (isExpired(parsed)) return null;

		return {
			id: parsed.id,
			fullname: parsed.fullname,
			role: parsed.role,
			exp: typeof parsed.exp === "number" ? parsed.exp : undefined,
		};
	} catch {
		return null;
	}
}

export function isAuthExpired(user: AuthUser | null): boolean {
	if (!user) return true;
	return isExpired(user);
}

const initialUser = readAuthCookie();

const authSlice = createSlice({
	name: "auth",
	initialState: { user: initialUser } as AuthState,
	reducers: {
		setCredentials(state, action: PayloadAction<AuthUser>) {
			const exp =
				action.payload.exp ??
				Math.floor(Date.now() / 1000) + AUTH_COOKIE_MAX_AGE;
			const user: AuthUser = { ...action.payload, exp };
			state.user = user;
			writeAuthCookie(user);
		},
		clearCredentials(state) {
			state.user = null;
			writeAuthCookie(null);
		},
		checkExpiry(state) {
			if (isAuthExpired(state.user)) {
				state.user = null;
				writeAuthCookie(null);
			}
		},
	},
});

export const { setCredentials, clearCredentials, checkExpiry } =
	authSlice.actions;

export default authSlice.reducer;
