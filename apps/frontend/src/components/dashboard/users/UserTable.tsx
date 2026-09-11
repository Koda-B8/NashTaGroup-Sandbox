import { formatDate, getRoleName } from "../../../libs/format";
import type { User } from "../../../services/users";
import ActionMenu from "../../ui/action-menu";
import Avatar from "../../ui/avatar";
import Badge from "../../ui/badge";
import Card from "../../ui/card";
import Checkbox from "../../ui/checkbox";
import PaginationControls from "../shared/PaginationControls";

interface Props {
	loading: boolean;
	paged: User[];
	selectedId: string | undefined;
	selectedIds: Set<string>;
	allPageSelected: boolean;
	somePageSelected: boolean;
	onSelect: (id: string) => void;
	onToggleAll: (checked: boolean) => void;
	onToggleOne: (id: string, checked: boolean) => void;
	pageCount: number;
	safePage: number;
	onPageChange: (page: number) => void;
	totalLabel: string;
}

export default function UserTable({
	loading,
	paged,
	selectedId,
	selectedIds,
	allPageSelected,
	somePageSelected,
	onSelect,
	onToggleAll,
	onToggleOne,
	pageCount,
	safePage,
	onPageChange,
	totalLabel,
}: Props) {
	return (
		<Card
			padding="none"
			className="overflow-hidden"
		>
			<div className="overflow-x-auto">
				<table
					className="w-full text-left text-sm"
					aria-label="Users"
				>
					<thead className="border-b border-base-border bg-base">
						<tr>
							<th
								scope="col"
								className="w-10 px-3 py-3"
							>
								<Checkbox
									checked={allPageSelected}
									indeterminate={somePageSelected}
									onCheckedChange={(c) => onToggleAll(c === true)}
									aria-label="Select all users on this page"
								/>
							</th>
							<th
								scope="col"
								className="px-3 py-3 text-xs font-semibold text-text"
							>
								Name
							</th>
							<th
								scope="col"
								className="px-3 py-3 text-xs font-semibold text-text"
							>
								Username
							</th>
							<th
								scope="col"
								className="px-3 py-3 text-xs font-semibold text-text"
							>
								Role
							</th>
							<th
								scope="col"
								className="px-3 py-3 text-xs font-semibold text-text"
							>
								Status
							</th>
							<th
								scope="col"
								className="px-3 py-3 text-xs font-semibold text-text"
							>
								Created
							</th>
							<th
								scope="col"
								className="w-10 px-3 py-3"
								aria-label="Actions"
							/>
						</tr>
					</thead>
					<tbody className="divide-y divide-base-border">
						{loading ? (
							<tr>
								<td
									colSpan={7}
									className="px-4 py-10 text-center text-sm text-text"
								>
									Memuat users...
								</td>
							</tr>
						) : (paged.length === 0 ? (
							<tr>
								<td
									colSpan={7}
									className="px-4 py-10 text-center text-sm text-text"
								>
									No users found.
								</td>
							</tr>
						) : (
							paged.map((row) => {
								const isActiveRow = row.id === selectedId;
								const status = row.isActive ? "Active" : "Inactive";
								return (
									<tr
										key={row.id}
										onClick={() => onSelect(row.id)}
										onKeyDown={(e) => {
											if (e.key === "Enter" || e.key === " ") {
												e.preventDefault();
												onSelect(row.id);
											}
										}}
										tabIndex={0}
										className={`cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary ${isActiveRow ? "bg-primary-light/50" : "hover:bg-base/60"}`}
									>
										<td
											className="px-3 py-3"
											onClick={(e) => e.stopPropagation()}
										>
											<Checkbox
												checked={selectedIds.has(row.id)}
												onCheckedChange={(c) => onToggleOne(row.id, c === true)}
												aria-label={`Select ${row.fullname}`}
											/>
										</td>
										<td className="px-3 py-3">
											<div className="flex items-center gap-2.5">
												<Avatar
													name={row.fullname}
													size="sm"
												/>
												<div className="min-w-0">
													<p
														className={`truncate text-sm font-medium ${isActiveRow ? "text-primary" : "text-text-h"}`}
													>
														{row.fullname}
													</p>
													<p className="truncate text-[11px] text-text">
														{row.id.slice(0, 8)}…
													</p>
												</div>
											</div>
										</td>
										<td className="px-3 py-3 text-sm text-text-h">
											{row.username}
										</td>
										<td className="px-3 py-3">
											<Badge
												variant={
													getRoleName(row.role) === "admin" ? "info" : "neutral"
												}
												size="sm"
											>
												{getRoleName(row.role)}
											</Badge>
										</td>
										<td className="px-3 py-3">
											<Badge
												variant={status === "Active" ? "primary" : "neutral"}
												size="sm"
											>
												{status}
											</Badge>
										</td>
										<td className="px-3 py-3 text-sm text-text">
											{formatDate(row.createdAt)}
										</td>
										<td
											className="px-3 py-3"
											onClick={(e) => e.stopPropagation()}
										>
											<ActionMenu
												label={`Actions for ${row.fullname}`}
												items={[
													{
														label: "View detail",
														onSelect: () => onSelect(row.id),
													},
													{ label: "Edit", onSelect: () => onSelect(row.id) },
													{
														label:
															status === "Active" ? "Deactivate" : "Activate",
														onSelect: () => {},
														danger: status === "Active",
													},
												]}
											/>
										</td>
									</tr>
								);
							})
						))}
					</tbody>
				</table>
			</div>
			<PaginationControls
				totalLabel={totalLabel}
				pageCount={pageCount}
				safePage={safePage}
				onPageChange={onPageChange}
			/>
		</Card>
	);
}
