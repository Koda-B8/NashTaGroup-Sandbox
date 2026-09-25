export interface PdfSalesSummary {
	revenue: number;
	transactions: number;
	avgOrder: number;
	unitsSold: number;
	variants: number;
	revenueDelta: number | null;
	transactionsDelta: number | null;
	avgDelta: number | null;
}

export interface PdfTrendPoint {
	label: string;
	value: number;
}

export interface PdfProductRow {
	name: string;
	code: string;
	qty: number;
	revenue: number;
	share: number;
}

export interface PdfCategoryRow {
	name: string;
	revenue: number;
	share: number;
}

export interface PdfMethodRow {
	name: string;
	txn: number;
	revenue: number;
	share: number;
}

export interface PdfCashierRow {
	name: string;
	username: string;
	txn: number;
	revenue: number;
	share: number;
}

export interface PdfStockRow {
	name: string;
	code: string;
	stock: number;
	sold: number;
	status: "out" | "low" | "ok";
}

export interface SalesReportPdfData {
	fileName: string;
	periodLabel: string;
	subtitle: string;
	generatedLabel: string;
	summary: PdfSalesSummary;
	trend: PdfTrendPoint[];
	trendSubtitle: string;
	topProducts: PdfProductRow[];
	categories: PdfCategoryRow[];
	paymentMethods: PdfMethodRow[];
	cashiers: PdfCashierRow[];
	stockAlerts: PdfStockRow[];
}
