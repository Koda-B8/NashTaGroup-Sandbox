import { barY, defineChart } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { useMemo } from "react";

import { highlightColor, seriesColor } from "./palette";

export interface SparklineProps {
	data: { label: string; value: number }[];
	ariaLabel: string;
	height?: number;
}

export default function Sparkline({
	data,
	ariaLabel,
	height = 56,
}: SparklineProps) {
	const definition = useMemo(() => {
		const peak =
			data.length > 0 ? Math.max(...data.map((row) => row.value)) : 0;
		// labels repeat across a week (M T W T F S S), so the band keys off position
		const rows = data.map((row, index) => ({ ...row, index }));

		return defineChart({
			marks: [
				barY(rows, {
					x: "index",
					y: "value",
					fill: (row) => (row.value === peak ? highlightColor : seriesColor),
					radius: 2,
				}),
			],
			scales: {
				x: { scale: () => scaleBand().padding(0.28), axis: false },
				// bars must read against a zero baseline, not the data minimum
				y: { scale: () => scaleLinear().domain([0, peak || 1]), axis: false },
			},
		});
	}, [data]);

	return (
		<Chart
			definition={definition}
			height={height}
			ariaLabel={ariaLabel}
		/>
	);
}
