import { Plus, Trash2 } from "lucide-react";

import Button from "../../../components/ui/button";
import Checkbox from "../../../components/ui/checkbox";
import Eyebrow from "../../../components/ui/eyebrow";
import Input from "../../../components/ui/input";

export interface OptionDraft {
	key: string;
	id?: string;
	name: string;
	hex: string;
}

export interface AttributeDraft {
	key: string;
	id?: string;
	name: string;
	value: string;
	isRequired: boolean;
	isVariant: boolean;
	options: OptionDraft[];
}

export const HEX_PATTERN = /^#[\dA-Fa-f]{6}$/;

export const newDraftKey = () => crypto.randomUUID();

export function emptyOptionDraft(): OptionDraft {
	return { key: newDraftKey(), name: "", hex: "" };
}

export function emptyAttributeDraft(): AttributeDraft {
	return {
		key: newDraftKey(),
		name: "",
		value: "",
		isRequired: false,
		isVariant: true,
		options: [],
	};
}

interface Props {
	attributes: AttributeDraft[];
	onChange: (next: AttributeDraft[]) => void;
	/** Highlight attribute names that failed validation. */
	invalid?: boolean;
}

export default function CategoryAttributeEditor({
	attributes,
	onChange,
	invalid = false,
}: Props) {
	const patch = (key: string, next: Partial<AttributeDraft>) =>
		onChange(attributes.map((a) => (a.key === key ? { ...a, ...next } : a)));

	const patchOption = (
		attributeKey: string,
		optionKey: string,
		next: Partial<OptionDraft>,
	) =>
		onChange(
			attributes.map((attribute) =>
				attribute.key === attributeKey
					? {
							...attribute,
							options: attribute.options.map((option) =>
								option.key === optionKey ? { ...option, ...next } : option,
							),
						}
					: attribute,
			),
		);

	return (
		<div className="flex flex-col gap-3">
			<div className="flex items-start justify-between gap-2">
				<div>
					<Eyebrow size="sm">Atribut</Eyebrow>
					<p className="text-2xs text-text">
						Opsional — definisi varian &amp; spesifikasi category.
					</p>
				</div>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => onChange([...attributes, emptyAttributeDraft()])}
				>
					<Plus size={12} />
					Tambah atribut
				</Button>
			</div>

			{attributes.length === 0 ? (
				<p className="rounded-lg border border-dashed border-base-border px-3 py-4 text-center text-xs text-text">
					Belum ada atribut.
				</p>
			) : (
				<ul className="flex flex-col divide-y divide-base-border rounded-lg border border-base-border">
					{attributes.map((attribute, index) => (
						<li
							key={attribute.key}
							className="flex flex-col gap-3 p-3"
						>
							<div className="flex items-center justify-between gap-2">
								<Eyebrow size="sm">Atribut {index + 1}</Eyebrow>
								<Button
									type="button"
									aria-label={`Hapus atribut ${index + 1}`}
									onClick={() =>
										onChange(attributes.filter((a) => a.key !== attribute.key))
									}
									variant="ghostDanger"
									size="icon"
									className="size-6"
								>
									<Trash2 size={13} />
								</Button>
							</div>

							<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
								<div className="flex flex-col gap-1">
									<label
										htmlFor={`attr-name-${attribute.key}`}
										className="text-2xs font-medium text-text-h"
									>
										Nama atribut <span className="text-deep-danger">*</span>
									</label>
									<Input
										id={`attr-name-${attribute.key}`}
										placeholder="Warna"
										value={attribute.name}
										onChange={(e) =>
											patch(attribute.key, { name: e.currentTarget.value })
										}
										invalid={invalid && !attribute.name.trim()}
										autoComplete="off"
									/>
								</div>
								<div className="flex flex-col gap-1">
									<label
										htmlFor={`attr-value-${attribute.key}`}
										className="text-2xs font-medium text-text-h"
									>
										Nilai{" "}
										<span className="text-3xs font-normal text-text">
											(opsional)
										</span>
									</label>
									<Input
										id={`attr-value-${attribute.key}`}
										placeholder="Storage"
										value={attribute.value}
										onChange={(e) =>
											patch(attribute.key, { value: e.currentTarget.value })
										}
										autoComplete="off"
									/>
								</div>
							</div>

							<div className="flex flex-wrap items-center gap-x-5 gap-y-2">
								<label
									htmlFor={`attr-variant-${attribute.key}`}
									className="flex items-center gap-2 text-text-h select-none"
								>
									<Checkbox
										id={`attr-variant-${attribute.key}`}
										checked={attribute.isVariant}
										onCheckedChange={(c) =>
											patch(attribute.key, { isVariant: c === true })
										}
										aria-label={`Atribut ${index + 1} bikin varian`}
									/>
									<span className="text-2xs font-medium">Bikin varian</span>
									<span className="text-3xs text-text">— isVariant</span>
								</label>
								<label
									htmlFor={`attr-required-${attribute.key}`}
									className="flex items-center gap-2 text-text-h select-none"
								>
									<Checkbox
										id={`attr-required-${attribute.key}`}
										checked={attribute.isRequired}
										onCheckedChange={(c) =>
											patch(attribute.key, { isRequired: c === true })
										}
										aria-label={`Atribut ${index + 1} wajib diisi`}
									/>
									<span className="text-2xs font-medium">Wajib diisi</span>
									<span className="text-3xs text-text">— isRequired</span>
								</label>
							</div>

							{attribute.isVariant && (
								<div className="flex flex-col gap-2 border-t border-base-border pt-3">
									<div className="flex items-center justify-between gap-2">
										<Eyebrow size="sm">Opsi</Eyebrow>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={() =>
												patch(attribute.key, {
													options: [...attribute.options, emptyOptionDraft()],
												})
											}
										>
											<Plus size={12} />
											Tambah opsi
										</Button>
									</div>
									{attribute.options.length === 0 ? (
										<p className="text-2xs text-text">Belum ada opsi.</p>
									) : (
										<ul className="flex flex-col gap-2">
											{attribute.options.map((option, optionIndex) => (
												<li
													key={option.key}
													className="flex items-center gap-2"
												>
													<span
														className="size-8 shrink-0 rounded-lg border border-base-border"
														style={{
															backgroundColor: HEX_PATTERN.test(
																option.hex.trim(),
															)
																? option.hex.trim()
																: undefined,
														}}
														aria-hidden
													/>
													<Input
														size="sm"
														placeholder="#3B82F6"
														value={option.hex}
														onChange={(e) =>
															patchOption(attribute.key, option.key, {
																hex: e.currentTarget.value,
															})
														}
														className="w-24 shrink-0 font-mono"
														aria-label={`Warna opsi ${optionIndex + 1}`}
														autoComplete="off"
													/>
													<Input
														size="sm"
														placeholder="Biru"
														value={option.name}
														onChange={(e) =>
															patchOption(attribute.key, option.key, {
																name: e.currentTarget.value,
															})
														}
														className="min-w-0 flex-1"
														aria-label={`Nama opsi ${optionIndex + 1}`}
														autoComplete="off"
													/>
													<Button
														type="button"
														aria-label={`Hapus opsi ${optionIndex + 1}`}
														onClick={() =>
															patch(attribute.key, {
																options: attribute.options.filter(
																	(o) => o.key !== option.key,
																),
															})
														}
														variant="ghostDanger"
														size="icon"
														className="size-7 shrink-0"
													>
														<Trash2 size={13} />
													</Button>
												</li>
											))}
										</ul>
									)}
								</div>
							)}
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
