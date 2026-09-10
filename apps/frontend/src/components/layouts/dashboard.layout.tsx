import {
	SearchIcon,
	HomeIcon,
	InboxIcon,
	BarChart3Icon,
	PackageIcon,
	ShoppingCartIcon,
	CreditCardIcon,
	UsersIcon,
	WalletIcon,
	LayoutDashboardIcon,
	FileDownIcon,
	ChevronDownIcon,
	ChevronsLeftIcon,
} from "lucide-react";
import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router";

import Avatar from "../ui/avatar";
import Badge from "../ui/badge";
import Breadcrumb from "../ui/breadcrumb";
import Input from "../ui/input";

interface SidebarNavItem {
	id?: string;
	label: string;
	path?: string;
	icon?: React.ReactNode;
	badge?: string;
	shortcut?: string;
	children?: SidebarNavItem[];
}

interface SidebarNavGroup {
	heading?: string;
	items: SidebarNavItem[];
}

const SIDEBAR_NAV_GROUPS: SidebarNavGroup[] = [
	{
		items: [
			{
				id: "search",
				label: "Search",
				icon: <SearchIcon size={14} />,
				shortcut: "⌘K",
			},
			{
				id: "home",
				label: "Home",
				path: "/dashboard",
				icon: <HomeIcon size={14} />,
			},
			{
				id: "inbox",
				label: "Inbox",
				path: "/dashboard/inbox",
				icon: <InboxIcon size={14} />,
				badge: "12",
			},
			{
				id: "analytics",
				label: "Analytics",
				path: "/dashboard/analytics",
				icon: <BarChart3Icon size={14} />,
			},
		],
	},
	{
		heading: "WORKSPACE",
		items: [
			{
				id: "products",
				label: "Products",
				path: "/dashboard/products",
				icon: <PackageIcon size={14} />,
				children: [
					{ label: "All Products", path: "/dashboard/products" },
					{ label: "Categories", path: "/dashboard/products/categories" },
					{ label: "Inventory", path: "/dashboard/products/inventory" },
				],
			},
			{
				id: "orders",
				label: "Orders",
				path: "/dashboard/orders",
				icon: <ShoppingCartIcon size={14} />,
				children: [
					{ label: "All Orders", path: "/dashboard/orders" },
					{ label: "Pending", path: "/dashboard/orders/pending" },
				],
			},
			{
				id: "cashier",
				label: "Cashier",
				path: "/dashboard/cashier",
				icon: <CreditCardIcon size={14} />,
				children: [{ label: "All Cashiers", path: "/dashboard/cashier" }],
			},
			{
				id: "customers",
				label: "Customers",
				path: "/dashboard/customers",
				icon: <UsersIcon size={14} />,
			},
			{
				id: "finance",
				label: "Finance",
				path: "/dashboard/finance",
				icon: <WalletIcon size={14} />,
			},
		],
	},
	{
		heading: "REPORTS",
		items: [
			{
				id: "report-dashboard",
				label: "Dashboard",
				path: "/dashboard/reports",
				icon: <LayoutDashboardIcon size={14} />,
			},
			{
				id: "exports",
				label: "Exports",
				path: "/dashboard/exports",
				icon: <FileDownIcon size={14} />,
			},
		],
	},
];

function WorkspaceSwitcher() {
	return (
		<button
			type="button"
			className="flex w-full items-center gap-3 rounded-lg px-1 py-1 text-left hover:bg-base"
		>
			<span className="flex size-7.5 items-center justify-center rounded-md bg-primary text-xs font-bold text-white">
				N
			</span>
			<span className="flex-1">
				<span className="block text-[13px] font-medium text-text-h">
					Nashta Group
				</span>
				<span className="block text-[10px] text-text">Dashboard</span>
			</span>
			<ChevronDownIcon
				size={14}
				className="text-text"
			/>
		</button>
	);
}

interface SidebarNavNodeProps {
	item: SidebarNavItem;
	depth?: number;
}

function SidebarNavNode({ item, depth = 0 }: SidebarNavNodeProps) {
	const [isExpanded, setIsExpanded] = useState(true);
	const location = useLocation();
	const hasChildren = Boolean(item.children && item.children.length > 0);
	const isActive = item.path
		? location.pathname === item.path ||
			(hasChildren && location.pathname.startsWith(item.path))
		: false;

	const rowClass = `flex h-8 w-full items-center gap-2 rounded-md px-2.5 text-[13px] select-none ${
		isActive
			? "bg-primary-light font-medium text-primary"
			: "text-text hover:bg-base hover:text-text-h"
	}`;

	if (hasChildren) {
		return (
			<div>
				<div className="relative">
					<Link
						to={item.path ?? "#"}
						className={rowClass}
					>
						{item.icon && <span className="shrink-0">{item.icon}</span>}
						<span className="flex-1">{item.label}</span>
					</Link>
					<button
						type="button"
						aria-label={isExpanded ? "Collapse" : "Expand"}
						onClick={() => setIsExpanded((prev) => !prev)}
						className="absolute top-1/2 right-2 -translate-y-1/2 text-current"
					>
						<ChevronDownIcon
							size={12}
							className={`transition-transform ${isExpanded ? "" : "-rotate-90"}`}
						/>
					</button>
				</div>
				{isExpanded && (
					<div className="mt-0.5 pl-6">
						{item.children?.map((childItem) => (
							<SidebarNavNode
								key={childItem.id ?? childItem.label}
								item={childItem}
								depth={depth + 1}
							/>
						))}
					</div>
				)}
			</div>
		);
	}

	return (
		<div>
			<Link
				to={item.path ?? "#"}
				className={rowClass}
			>
				{item.icon && <span className="shrink-0">{item.icon}</span>}
				<span className="flex-1">{item.label}</span>
				{item.badge && (
					<Badge
						variant="primary"
						size="sm"
					>
						{item.badge}
					</Badge>
				)}
				{item.shortcut && (
					<span className="text-[10px] text-text">{item.shortcut}</span>
				)}
			</Link>
		</div>
	);
}

function Sidebar() {
	return (
		<aside className="flex h-screen w-64 shrink-0 flex-col border-r border-base-border bg-[#fcfcfd]">
			<div className="flex-1 overflow-y-auto p-3">
				<WorkspaceSwitcher />
				<div className="my-3 border-t border-base-border" />
				<nav className="flex flex-col gap-0.5">
					{SIDEBAR_NAV_GROUPS.map((group, groupIndex) => (
						<div
							key={group.heading ?? groupIndex}
							className="flex flex-col gap-0.5"
						>
							{group.heading && (
								<p className="mt-3 px-2.5 pb-1 text-[9px] font-semibold tracking-wider text-text">
									{group.heading}
								</p>
							)}
							{group.items.map((item) => (
								<SidebarNavNode
									key={item.id ?? item.label}
									item={item}
								/>
							))}
						</div>
					))}
				</nav>
			</div>
			<div className="flex items-center gap-3 border-t border-base-border px-4 py-3">
				<Avatar
					size="sm"
					name="Admin"
				/>
				<div>
					<p className="text-xs font-medium text-text-h">Admin User</p>
					<p className="text-[10px] text-text">Administrator</p>
				</div>
			</div>
		</aside>
	);
}

function Header() {
	return (
		<header className="flex h-14 shrink-0 items-center gap-4 border-b border-base-border bg-white px-4">
			<button
				type="button"
				aria-label="Toggle sidebar"
				className="flex size-8 items-center justify-center rounded-lg text-text hover:bg-base hover:text-text-h"
			>
				<ChevronsLeftIcon size={16} />
			</button>
			<Breadcrumb
				items={[
					{ label: "Nashta Group", to: "/dashboard" },
					{ label: "Orders" },
				]}
			/>
			<div className="ml-auto flex items-center gap-3">
				<Input
					size="sm"
					placeholder="Search..."
					className="w-52"
				/>
				<Avatar
					size="sm"
					name="Admin"
				/>
			</div>
		</header>
	);
}

export default function DashboardLayout() {
	return (
		<div className="flex min-h-screen bg-base">
			<Sidebar />
			<div className="flex min-w-0 flex-1 flex-col">
				<Header />
				<main className="flex-1 p-4">
					<Outlet />
				</main>
			</div>
		</div>
	);
}
