import type { ComponentProps, ReactNode } from "react";
import { cn } from "tailwind-variants";

import Card from "./ui/card";
import Separator from "./ui/separator";

export default function Aside({
	padding = "sm",
	className,
	...props
}: Readonly<ComponentProps<typeof Card>>) {
	return (
		<Card
			padding={padding}
			className={cn("relative flex h-full w-64 flex-col gap-2", className)}
			{...props}
		/>
	);
}

export function AsideHeader({
	title,
	children,
}: Readonly<{ title: string; children?: ReactNode }>) {
	return (
		<>
			<header className="flex items-center justify-between">
				<h6 className="text-sm font-semibold text-text-h">{title}</h6>
				<div className="text-xs">{children}</div>
			</header>
			<Separator className="-mx-4" />
		</>
	);
}

export function AsideContent(props: Readonly<ComponentProps<"div">>) {
	return <div {...props} />;
}

export function AsideFooter({
	className,
	...props
}: Readonly<ComponentProps<"footer">>) {
	return (
		<footer
			className={cn("mt-auto w-full", className)}
			{...props}
		/>
	);
}
