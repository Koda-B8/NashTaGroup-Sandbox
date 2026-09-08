import { defineChart } from "@tanstack/charts";
import { pie, polar, radialArc } from "@tanstack/charts/polar";
import { Chart } from "@tanstack/charts/react";
import { useMemo } from "react";

import { categorical } from "./palette";

const swatchStyles = categorical.map((color) => ({ backgroundColor: color }));

export interface DonutSlice {
	label: string;
	value: number;
}

export interface DonutChartProps {
	data: DonutSlice[];
	ariaLabel: string;
	height?: number;
	format?: (value: number) => string;
}

export default function DonutChart({
	data,
	ariaLabel,
	height = 220,
	format,
}: DonutChartProps) {
	const definition = useMemo(() => {
		const slices = pie(data, { value: "value", gapAngle: 0.02 });

		return defineChart({
			marks: [
				polar({
					inset: 8,
					radiusRatio: 0.9,
					marks: [
						radialArc(slices, {
							innerRadius: ({ radius }) => radius * 0.62,
							cornerRadius: 4,
							color: "label",
							key: "label",
						}),
					],
					// oxlint-disable-next-line unicorn/no-null
					scales: { angle: null, radius: null },
				}),
			],
			// oxlint-disable-next-line unicorn/no-null
			scales: { x: null, y: null },
			color: {
				domain: data.map((slice) => slice.label),
				range: categorical,
			},
		});
	}, [data]);

	return (
		<figure className="m-0">
			<Chart
				definition={definition}
				height={height}
				ariaLabel={ariaLabel}
			/>

			{/* legend doubles as the value table: identity is never colour-alone */}
			<ul className="mt-4 flex flex-col gap-2">
				{data.map((slice, index) => (
					<li
						key={slice.label}
						className="flex items-center gap-2 text-sm"
					>
						<span
							aria-hidden
							className="size-2 shrink-0 rounded-full"
							style={swatchStyles[index % swatchStyles.length]}
						/>
						<span className="text-text-h">{slice.label}</span>
						<span className="ml-auto font-medium text-text-h">
							{format ? format(slice.value) : slice.value}
						</span>
					</li>
				))}
			</ul>
		</figure>
	);
}
