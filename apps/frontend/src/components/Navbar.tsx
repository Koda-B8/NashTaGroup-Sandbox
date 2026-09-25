import { useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router";

import { logout } from "../features/auth/api";
import { useCrumbs } from "../hooks/useCrumbs";
import { clearCsrfCache } from "../libs/api";
import { APP_NAME } from "../libs/app";
import type { AppDispatch } from "../store";
import { clearCredentials } from "../store/slices/auth";
import { clearCart } from "../store/slices/cart";
import AppHeader from "./AppHeader";
import LogoutButton from "./LogoutButton";
import Input from "./ui/input";

interface SearchBoxProps {
	onSearch?: (value: string) => void;
}

interface CartActionProps {
	count: number;
}

export default function Navbar() {
	const crumbs = useCrumbs();

	return (
		<AppHeader
			leading={
				<Link
					to={"/"}
					className="font-semibold text-text-h"
				>
					{APP_NAME}
				</Link>
			}
			items={crumbs}
			actions={
				<>
					<CartAction />
					<LogoutAction />
				</>
			}
		/>
	);
}

function SearchBox({ onSearch }: SearchBoxProps) {
	function handleSearchProduct(e: React.ChangeEvent<HTMLInputElement>): void {
		onSearch?.(e.target.value);
	}

	return (
		<Input
			size="sm"
			type="search"
			placeholder="Search Product.."
			className="hidden w-52 lg:block"
			onChange={handleSearchProduct}
		/>
	);
}

function LogoutAction() {
	const dispatch = useDispatch<AppDispatch>();
	const navigate = useNavigate();
	const [isLoggingOut, setIsLoggingOut] = useState(false);

	async function handleLogout(): Promise<void> {
		setIsLoggingOut(true);
		await logout();
		dispatch(clearCredentials());
		dispatch(clearCart());
		clearCsrfCache();
		navigate("/login", { replace: true });
	}

	return (
		<LogoutButton
			loading={isLoggingOut}
			onClick={handleLogout}
		/>
	);
}

function CartAction() {
	return (
		<div className="centerized relative size-9 cursor-pointer rounded-full border border-primary bg-base">
			<h6>C</h6>
		</div>
	);
}
