import { Loader2, LogOutIcon } from "lucide-react";

import Button from "./ui/button";

interface LogoutButtonProps {
	loading: boolean;
	onClick: () => void;
	className?: string;
}

export default function LogoutButton({
	loading,
	onClick,
	className,
}: Readonly<LogoutButtonProps>) {
	return (
		<Button
			variant="ghost"
			size="icon"
			className={className}
			aria-label="Log out"
			disabled={loading}
			onClick={onClick}
		>
			{loading ? (
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
