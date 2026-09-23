import { Loader2, LogOutIcon } from "lucide-react";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router";

import { logout } from "../features/auth/api";
import { clearCsrfCache } from "../libs/api";
import type { AppDispatch } from "../store";
import { clearCredentials } from "../store/slices/auth";
import { clearCart } from "../store/slices/cart";
import Breadcrumb from "./ui/breadcrumb";
import Button from "./ui/button";

interface SearchBoxProps {
	onSearch?: (value: string) => void;
}

interface CartActionProps {
	count: number;
}

export default function Navbar() {
	return (
		<nav className="w-full bg-white h-17 shadow-sm flex items-center px-7 justify-between">
			<section className="flex text-xs gap-xp lg:text-lg lg:items-center lg:gap-10 flex-col-reverse lg:flex-row">
				<Link to={"/"}>
					<p>NashTa Group</p>
				</Link>
				<Breadcrumb
					items={[
						{ label: "Products", to: "/" },
						{ label: "Browse", to: "/" },
					]}
				/>
			</section>
			<section className="flex items-center gap-3">
				<SearchBox />
				<CartAction count={4} />
				<LogoutAction />
			</section>
		</nav>
	);
}

function SearchBox({ onSearch }: SearchBoxProps) {
	function handleSearchProduct(e: React.ChangeEvent<HTMLInputElement>): void {
		onSearch?.(e.target.value);
	}

	return (
		<form className="w-60 border hidden lg:flex border-base-border h-9 bg-base rounded-md">
			<input
				onChange={handleSearchProduct}
				className="w-full h-full outline-none text-sm pl-3"
				placeholder="Search Product.."
				type="text"
			/>
		</form>
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
		<Button
			variant="ghost"
			size="icon"
			aria-label="Log out"
			disabled={isLoggingOut}
			onClick={handleLogout}
		>
			{isLoggingOut ? (
				<Loader2
					size={16}
					className="animate-spin"
				/>
			) : (
				<LogOutIcon size={16} />
			)}
		</Button>
	);
}

function CartAction({ count }: Readonly<CartActionProps>) {
	return (
		<div className="h-9 w-9 cursor-pointer rounded-full bg-base border border-primary relative">
			<div
				className="absolute text-white bg-primary rounded-full text-xs -top-2 
			-right-1 w-5 h-5 centerized"
			>
				{count}
			</div>
		</div>
	);
}
