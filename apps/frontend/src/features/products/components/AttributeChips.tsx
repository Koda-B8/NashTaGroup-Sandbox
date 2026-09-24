import { cn } from "tailwind-variants";

import type { AttributeDefinition } from "../format";

interface Props {
	definition: AttributeDefinition;
	selected: string[];
	onChange: (next: string[]) => void;
	invalid?: boolean;
}

export default function AttributeChips({
	definition,
	selected,
	onChange,
	invalid = false,
}: Props) {
	const toggle = (optionId: string) => {
		if (definition.isVariant) {
			onChange(
				selected.includes(optionId)
					? selected.filter((id) => id !== optionId)
					: [...selected, optionId],
			);
			return;
		}
		onChange(selected.includes(optionId) ? [] : [optionId]);
	};

	return (
		<div className="flex items-start gap-3.5">
			<div className="w-[108px] shrink-0 pt-1">
				<span className="text-xs font-semibold text-text-h">
					{definition.name}
				</span>
				{definition.isRequired && (
					<span className="ml-0.5 font-bold text-deep-danger">*</span>
				)}
				<span className="mt-0.5 block text-3xs text-text">
					{definition.isVariant ? "pilih beberapa" : "pilih satu"}
				</span>
			</div>
			<div className="flex flex-wrap items-center gap-2">
				{definition.options.map((option) => {
					const active = selected.includes(option.id);
					return (
						<button
							key={option.id}
							type="button"
							aria-pressed={active}
							onClick={() => toggle(option.id)}
							className={cn(
								"inline-flex h-8 items-center gap-[7px] rounded-lg border px-2.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
								active
									? "border-primary bg-primary-light text-primary"
									: "border-base-border bg-surface text-text-h hover:bg-base",
								invalid && !active && "border-deep-danger",
							)}
						>
							{option.hex && (
								<span
									className="size-3 shrink-0 rounded-full border border-black/10"
									style={{ backgroundColor: option.hex }}
									aria-hidden
								/>
							)}
							{option.name}
						</button>
					);
				})}
			</div>
		</div>
	);
}
