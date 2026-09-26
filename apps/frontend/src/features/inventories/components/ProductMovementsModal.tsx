import { useEffect, useState } from "react";

import Modal from "../../../components/ui/modal";
import {
	monthEnd,
	monthRangeLabel,
	monthStart,
	movementTypeFilterToParam,
	type MovementTypeFilter,
} from "../format";
import { useProductMovements } from "../hooks/useProductMovements";
import { downloadInventoryMovementReportPdf } from "../pdf/inventoryMovementPdf";
import { loadInventoryMovementReportPdfData } from "../pdf/loadInventoryMovementReport";
import MovementsPanel from "./MovementsPanel";

export interface ProductMovementsTarget {
	id: string;
	name: string;
	code?: string | null;
	itemIds: string[];
}

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	product: ProductMovementsTarget | null;
	generatedBy?: string;
	onNotify?: (message: string, variant?: "success" | "error") => void;
}

const PAGE_SIZE = 8;

export default function ProductMovementsModal({
	open,
	onOpenChange,
	product,
	generatedBy = "Admin",
	onNotify,
}: Props) {
	const variantCount = product?.itemIds.length ?? 0;
	return (
		<Modal
			open={open}
			onOpenChange={onOpenChange}
			title="Inventory Movement"
			description={
				product
					? `${product.name} · ${variantCount} varian${
							product.code ? ` · ${product.code}` : ""
						}`
					: undefined
			}
			size="3xl"
		>
			{open && product ? (
				<ProductMovementsContent
					product={product}
					generatedBy={generatedBy}
					onNotify={onNotify}
				/>
			) : null}
		</Modal>
	);
}

function ProductMovementsContent({
	product,
	generatedBy,
	onNotify,
}: {
	product: ProductMovementsTarget;
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
	}, [typeFilter, fromMonth, toMonth, product.id]);

	const {
		loading,
		error: fetchError,
		fetchMovements,
		paged,
		pageCount,
		safePage,
		totalItems,
	} = useProductMovements({
		productItemIds: product.itemIds,
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
				productItemIds: product.itemIds,
				scope: "product",
				type: movementTypeFilterToParam(typeFilter),
				from: monthStart(fromMonth),
				to: monthEnd(toMonth),
				rangeLabel: monthRangeLabel(fromMonth, toMonth),
				fallbackName: product.name,
				fallbackCode: product.code ?? "",
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
			showVariant
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
