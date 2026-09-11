import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router";

import type { RootState } from "../store";
import { checkExpiry, isAuthExpired, readAuthCookie } from "../store/authSlice";

interface ProtectedRouteProps {
	allowedRoles?: string[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
	const dispatch = useDispatch();
	const user = useSelector((state: RootState) => state.auth?.user ?? null);
	const location = useLocation();

	const cookieUser = readAuthCookie();
	const isExpired =
		isAuthExpired(user) || !cookieUser || isAuthExpired(cookieUser);

	useEffect(() => {
		if (isExpired) dispatch(checkExpiry());
		const id = setInterval(() => dispatch(checkExpiry()), 30_000);
		return () => clearInterval(id);
	}, [dispatch, isExpired]);

	if (!user || isExpired) {
		return (
			<Navigate
				to="/login"
				replace
				state={{ from: location.pathname + location.search }}
			/>
		);
	}

	if (
		allowedRoles &&
		allowedRoles.length > 0 &&
		!allowedRoles.includes(user.role)
	) {
		return (
			<Navigate
				to="/"
				replace
			/>
		);
	}

	return <Outlet />;
}

export function GuestRoute() {
	const user = useSelector((state: RootState) => state.auth?.user ?? null);
	const location = useLocation() as { state?: { from?: string } };

	const cookieUser = readAuthCookie();
	const isValid =
		user && !isAuthExpired(user) && cookieUser && !isAuthExpired(cookieUser);

	if (isValid) {
		const redirectTo = location.state?.from ?? "/dashboard";
		return (
			<Navigate
				to={redirectTo}
				replace
			/>
		);
	}

	return <Outlet />;
}
