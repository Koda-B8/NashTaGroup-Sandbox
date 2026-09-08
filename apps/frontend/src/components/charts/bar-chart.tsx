import { barY, defineChart } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { tooltip } from "@tanstack/charts/tooltip";
import { useMemo } from "react";

import { highlightColor, seriesColor } from "./palette";

export interface BarChartProps {
	data: { label: string; value: number }[];
	ariaLabel: string;
	height?: number;
	format?: (value: number) => string;
}

export default function BarChart({
	data,
	ariaLabel,
	height = 320,
	format,
}: BarChartProps) {
	const definition = useMemo(() => {
		const peak =
			data.length > 0 ? Math.max(...data.map((row) => row.value)) : 0;

		return defineChart({
			marks: [
				barY(data, {
					x: "label",
					y: "value",
					fill: (row) => (row.value === peak ? highlightColor : seriesColor),
					radius: 4,
				}),
			],
			scales: {
				x: { scale: () => scaleBand().padding(0.3) },
				y: {
					scale: scaleLinear,
					nice: true,
					grid: true,
					axis: format ? { ticks: { format } } : {},
				},
			},
			tooltip,
		});
	}, [data, format]);

	return (
		<Chart
			definition={definition}
			height={height}
			ariaLabel={ariaLabel}
		/>
	);
}
