import { useEffect, useState } from "react";

import Modal from "../../../components/ui/modal";
import {
	monthEnd,
	monthRangeLabel,
	monthStart,
	movementTypeFilterToParam,
	type MovementTypeFilter,
} from "../format";
import { useProductItemMovements } from "../hooks/useProductItemMovements";
import { downloadInventoryMovementReportPdf } from "../pdf/inventoryMovementPdf";
import { loadInventoryMovementReportPdfData } from "../pdf/loadInventoryMovementReport";
import MovementsPanel from "./MovementsPanel";

export interface ProductItemMovementsTarget {
	id: string;
	label: string;
	code?: string | null;
}

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	item: ProductItemMovementsTarget | null;
	generatedBy?: string;
	onNotify?: (message: string, variant?: "success" | "error") => void;
}

const PAGE_SIZE = 8;

export default function ProductItemMovementsModal({
	open,
	onOpenChange,
	item,
	generatedBy = "Admin",
	onNotify,
}: Props) {
	return (
		<Modal
			open={open}
			onOpenChange={onOpenChange}
			title="Inventory Movement"
			description={
				item ? [item.label, item.code].filter(Boolean).join(" · ") : undefined
			}
			size="3xl"
		>
			{open && item ? (
				<ItemMovementsContent
					item={item}
					generatedBy={generatedBy}
					onNotify={onNotify}
				/>
			) : null}
		</Modal>
	);
}

function ItemMovementsContent({
	item,
	generatedBy,
	onNotify,
}: {
	item: ProductItemMovementsTarget;
	generatedBy: string;
	onNotify?: (message: string, variant?: "success" | "error") => void;
}) {
	const [typeFilter, setTypeFilter] = useState<MovementTypeFilter>("All");
	const [fromMonth, setFromMonth] = useState("");
	const [toMonth, setToMonth] = useState("");
	const [page, setPage] = useState(0);
	const [exporting, setExporting] = useState(false);
	const [exportError, setExportError] = useState<string | null>(null);

	useEffect(() => {
		queueMicrotask(() => setPage(0));
	}, [typeFilter, fromMonth, toMonth, item.id]);

	const {
		loading,
		error: fetchError,
		fetchMovements,
		paged,
		pageCount,
		safePage,
		totalItems,
	} = useProductItemMovements({
		productItemId: item.id,
		typeFilter,
		fromMonth,
		toMonth,
		page,
		pageSize: PAGE_SIZE,
	});

	const handleExport = async () => {
		setExporting(true);
		setExportError(null);
		try {
			const data = await loadInventoryMovementReportPdfData({
				productItemIds: [item.id],
				scope: "item",
				type: movementTypeFilterToParam(typeFilter),
				from: monthStart(fromMonth),
				to: monthEnd(toMonth),
				rangeLabel: monthRangeLabel(fromMonth, toMonth),
				fallbackName: item.label,
				fallbackCode: item.code ?? "",
				generatedBy,
			});
			await downloadInventoryMovementReportPdf(data, data.fileName);
			onNotify?.(`PDF "${data.fileName}" berhasil dibuat.`);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Gagal membuat PDF";
			setExportError(message);
			onNotify?.(message, "error");
		} finally {
			setExporting(false);
		}
	};

	return (
		<MovementsPanel
			loading={loading}
			error={fetchError}
			onRetry={fetchMovements}
			paged={paged}
			totalItems={totalItems}
			pageCount={pageCount}
			safePage={safePage}
			onPageChange={setPage}
			typeFilter={typeFilter}
			onTypeFilterChange={setTypeFilter}
			fromMonth={fromMonth}
			toMonth={toMonth}
			onFromMonthChange={setFromMonth}
			onToMonthChange={setToMonth}
			onReset={() => {
				setFromMonth("");
				setToMonth("");
			}}
			exporting={exporting}
			exportError={exportError}
			onExport={handleExport}
		/>
	);
}
