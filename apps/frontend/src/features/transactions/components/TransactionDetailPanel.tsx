import { useMemo } from "react";

import Avatar from "../../../components/ui/avatar";
import Badge from "../../../components/ui/badge";
import Button from "../../../components/ui/button";
import Card from "../../../components/ui/card";
import { formatRupiah } from "../../../libs/formatRupiah";
import type { Transaction } from "../api";
import {
	asString,
	formatDateTime,
	isAmountKey,
	isPrimitive,
	paymentStatusVariant,
	prettifyKey,
	toNumber,
} from "../format";
import { useTransactionDetail } from "../hooks/useTransactionDetail";
import TransactionStatusBadge from "./TransactionStatusBadge";

function formatValue(label: string, value: string | number | boolean): string {
	if (isAmountKey(label) && typeof value !== "boolean")
		return formatRupiah(toNumber(value));
	return String(value);
}

export default function TransactionDetailPanel({
	transaction,
	onCopyNumber,
}: {
	transaction: Transaction | undefined;
	onCopyNumber: (value: string) => void;
}) {
	const { detail, loading, error, fetchDetail } = useTransactionDetail(
		transaction?.id,
	);

	const summaryRows = useMemo(() => {
		const entries = Object.entries(detail?.summary ?? {}).filter(
			(entry): entry is [string, string | number | boolean] => {
				const value = entry[1];
				return isPrimitive(value) && String(value).length > 0;
			},
		);
		return entries.sort(([a], [b]) => {
			const aTotal = a.toLowerCase() === "total";
			const bTotal = b.toLowerCase() === "total";
			if (aTotal === bTotal) return 0;
			return aTotal ? 1 : -1;
		});
	}, [detail]);

	const paymentRows = useMemo(
		() =>
			Object.entries(detail?.payment ?? {}).filter(
				(entry): entry is [string, string | number | boolean] => {
					const [key, value] = entry;
					return (
						key !== "method" &&
						key !== "status" &&
						isPrimitive(value) &&
						String(value).length > 0
					);
				},
			),
		[detail],
	);

	if (!transaction)
		return (
			<Card
				padding="md"
				className="flex h-fit flex-col gap-4 xl:sticky xl:top-4"
			>
				<p className="py-10 text-center text-sm text-text">
					Pilih transaksi untuk melihat detail.
				</p>
			</Card>
		);

	const items = detail?.items ?? [];
	const paymentMethod =
		asString(detail?.payment?.method) ?? transaction.payment.method;
	const paymentStatus =
		asString(detail?.payment?.status) ?? transaction.payment.status;

	return (
		<Card
			padding="md"
			className="flex h-fit flex-col gap-4 xl:sticky xl:top-4"
		>
			<div className="flex flex-col gap-1">
				<p
					className="truncate text-sm font-bold text-text-h"
					title={transaction.transactionNumber}
				>
					{transaction.transactionNumber}
				</p>
				<p className="text-2xs text-text">
					{formatDateTime(transaction.createdAt)}
				</p>
			</div>

			<TransactionStatusBadge status={transaction.status} />

			<div className="border-t border-base-border" />

			<div className="flex flex-col gap-2">
				<p className="text-2xs font-semibold tracking-wider text-text uppercase">
					Customer
				</p>
				<div className="flex items-center gap-2.5">
					<Avatar
						name={transaction.customer?.name ?? "Non-member"}
						size="md"
					/>
					<div className="min-w-0">
						<p className="truncate text-sm font-semibold text-text-h">
							{transaction.customer?.name ?? "Non-member"}
						</p>
						<p className="truncate text-2xs text-text">
							{transaction.customer?.phone ?? "Guest checkout"}
						</p>
					</div>
				</div>
			</div>

			<div className="flex flex-col gap-2">
				<p className="text-2xs font-semibold tracking-wider text-text uppercase">
					Cashier
				</p>
				<div className="flex items-center gap-2.5">
					<Avatar
						name={transaction.cashier?.fullname ?? "Cashier"}
						size="md"
					/>
					<div className="min-w-0">
						<p className="truncate text-sm font-semibold text-text-h">
							{transaction.cashier?.fullname ?? "—"}
						</p>
						<p className="text-2xs text-text">Processed by</p>
					</div>
				</div>
			</div>

			<div className="border-t border-base-border" />

			<div className="flex flex-col gap-1">
				<p className="text-2xs font-semibold tracking-wider text-text uppercase">
					Items Ordered
				</p>
				{loading ? (
					<p className="py-6 text-center text-xs text-text">Memuat detail...</p>
				) : error ? (
					<div className="flex flex-col gap-2 rounded-lg border border-danger bg-danger px-3 py-2 text-xs text-deep-danger">
						<span>{error}</span>
						<button
							type="button"
							onClick={fetchDetail}
							className="self-start font-semibold underline"
						>
							Coba lagi
						</button>
					</div>
				) : items.length === 0 ? (
					<p className="py-6 text-center text-xs text-text">
						Tidak ada item pada transaksi ini.
					</p>
				) : (
					<div className="flex flex-col divide-y divide-base-border">
						{items.map((item, index) => (
							<div
								key={`${item.productItemId ?? item.productName}-${index}`}
								className="flex items-start justify-between gap-3 py-2"
							>
								<div className="min-w-0">
									<p className="truncate text-sm text-text-h">
										{item.productName}
									</p>
									<p className="truncate text-2xs text-text">
										{item.productCode ? `${item.productCode} · ` : ""}
										{item.qty} × {formatRupiah(toNumber(item.unitPrice))}
									</p>
								</div>
								<p className="shrink-0 text-sm font-medium text-text-h">
									{formatRupiah(toNumber(item.subtotal))}
								</p>
							</div>
						))}
					</div>
				)}
			</div>

			{summaryRows.length > 0 && (
				<>
					<div className="border-t border-base-border" />
					<div className="flex flex-col gap-1.5">
						<p className="text-2xs font-semibold tracking-wider text-text uppercase">
							Summary
						</p>
						{summaryRows.map(([key, value]) => {
							const isTotal = key.toLowerCase() === "total";
							return (
								<div
									key={key}
									className="flex items-center justify-between gap-3"
								>
									<span
										className={
											isTotal
												? "text-xs font-semibold text-text-h"
												: "text-xs text-text"
										}
									>
										{prettifyKey(key)}
									</span>
									<span
										className={
											isTotal
												? "text-sm font-bold text-text-h"
												: "text-xs text-text-h"
										}
									>
										{formatValue(key, value)}
									</span>
								</div>
							);
						})}
					</div>
				</>
			)}

			<div className="border-t border-base-border" />

			<div className="flex flex-col gap-2">
				<p className="text-2xs font-semibold tracking-wider text-text uppercase">
					Payment
				</p>
				<div className="flex flex-wrap items-center gap-2">
					<Badge
						variant="neutral"
						size="sm"
					>
						{paymentMethod ?? "—"}
					</Badge>
					{paymentStatus && (
						<Badge
							variant={paymentStatusVariant(paymentStatus)}
							size="sm"
						>
							{prettifyKey(paymentStatus)}
						</Badge>
					)}
				</div>
				{paymentRows.map(([key, value]) => (
					<div
						key={key}
						className="flex items-center justify-between gap-3"
					>
						<span className="text-xs text-text">{prettifyKey(key)}</span>
						<span className="text-xs text-text-h">
							{formatValue(key, value)}
						</span>
					</div>
				))}
			</div>

			<div className="border-t border-base-border" />

			<div className="grid grid-cols-2 gap-2">
				<Button
					size="sm"
					onClick={() => onCopyNumber(transaction.transactionNumber)}
				>
					Copy Number
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={fetchDetail}
					disabled={loading}
				>
					Refresh
				</Button>
			</div>
		</Card>
	);
}
