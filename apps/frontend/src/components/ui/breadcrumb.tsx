import { Fragment } from "react";
import { Link } from "react-router";

export interface Crumb {
	label: string;
	to?: string;
}

export interface BreadcrumbProps {
	items: Crumb[];
	className?: string;
}

export default function Breadcrumb({ items, className = "" }: BreadcrumbProps) {
	return (
		<nav
			aria-label="Breadcrumb"
			className={className}
		>
			<ol className="flex items-center gap-2 text-sm">
				{items.map((item, index) => {
					const isLast = index === items.length - 1;

					return (
						<Fragment key={`${index}-${item.label}`}>
							{index > 0 && (
								<li
									aria-hidden
									className="text-text"
								>
									/
								</li>
							)}
							<li>
								{isLast || !item.to ? (
									<span
										aria-current={isLast ? "page" : undefined}
										className={isLast ? "font-semibold text-text-h" : ""}
									>
										{item.label}
									</span>
								) : (
									<Link
										to={item.to}
										className="hover:text-text-h"
									>
										{item.label}
									</Link>
								)}
							</li>
						</Fragment>
					);
				})}
			</ol>
		</nav>
	);
}
