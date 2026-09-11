import { useCallback, useState } from "react";

import { createUser, type CreateUserPayload } from "../../../services/users";
import Button from "../../ui/button";
import Checkbox from "../../ui/checkbox";
import Input from "../../ui/input";
import Modal, { ModalBody, ModalFooter } from "../../ui/modal";
import Select from "../../ui/select";

export default function RegisterUserModal({
	open,
	onOpenChange,
	onSuccess,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	onSuccess?: () => void;
}) {
	const [fullname, setFullname] = useState("");
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [role, setRole] = useState<"admin" | "cashier">("cashier");
	const [isActive, setIsActive] = useState(true);
	const [errors, setErrors] = useState<
		Partial<Record<keyof CreateUserPayload, string>>
	>({});
	const [serverError, setServerError] = useState<string | null>(null);
	const [serverSuccess, setServerSuccess] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	const reset = useCallback(() => {
		setFullname("");
		setUsername("");
		setPassword("");
		setRole("cashier");
		setIsActive(true);
		setErrors({});
		setServerError(null);
		setServerSuccess(null);
	}, []);

	const handleOpenChange = useCallback(
		(next: boolean) => {
			if (!next) reset();
			onOpenChange(next);
		},
		[onOpenChange, reset],
	);

	const validate = useCallback((): boolean => {
		const next: typeof errors = {};
		if (!fullname.trim()) next.fullname = "Fullname wajib diisi";
		else if (fullname.trim().length > 150) next.fullname = "Maks 150 karakter";
		if (!username.trim()) next.username = "Username wajib diisi";
		else if (username.trim().length < 3 || username.trim().length > 100)
			next.username = "3-100 karakter";
		else if (!/^[a-zA-Z0-9._-]+$/.test(username.trim()))
			next.username = "Hanya huruf, angka, . _ -";
		if (!password) next.password = "Password wajib diisi";
		else if (password.length < 8 || password.length > 128)
			next.password = "8-128 karakter";
		if (role !== "admin" && role !== "cashier")
			next.role = "Role harus admin atau cashier";
		setErrors(next);
		return Object.keys(next).length === 0;
	}, [fullname, username, password, role]);

	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			setServerError(null);
			setServerSuccess(null);
			if (!validate()) return;
			setSubmitting(true);
			try {
				const data = await createUser({
					fullname: fullname.trim(),
					username: username.trim(),
					password,
					role,
					isActive,
				});
				setServerSuccess(data?.message ?? "User created successfully");
				setTimeout(() => {
					handleOpenChange(false);
					onSuccess?.();
				}, 700);
			} catch (error) {
				setServerError(
					error instanceof Error ? error.message : "Terjadi kesalahan jaringan",
				);
			} finally {
				setSubmitting(false);
			}
		},
		[
			fullname,
			username,
			password,
			role,
			isActive,
			validate,
			handleOpenChange,
			onSuccess,
		],
	);

	return (
		<Modal
			open={open}
			onOpenChange={handleOpenChange}
			title="Register Cashier"
			description="Buat akun baru. Role hanya admin atau cashier."
			size="lg"
		>
			<form
				onSubmit={handleSubmit}
				noValidate
			>
				<ModalBody>
					{serverError && (
						<div
							className="rounded-lg border border-danger bg-danger px-3 py-2 text-xs text-deep-danger"
							role="alert"
						>
							{serverError}
						</div>
					)}
					{serverSuccess && (
						<div
							className="rounded-lg border border-valid bg-valid px-3 py-2 text-xs text-deep-valid"
							role="status"
						>
							{serverSuccess}
						</div>
					)}
					<div className="flex flex-col gap-1">
						<label
							htmlFor="fullname"
							className="text-xs font-medium text-text-h"
						>
							Fullname <span className="text-deep-danger">*</span>
						</label>
						<Input
							id="fullname"
							placeholder="Demo Cashier"
							value={fullname}
							onChange={(e) => setFullname(e.currentTarget.value)}
							invalid={Boolean(errors.fullname)}
							autoComplete="name"
						/>
						{errors.fullname && (
							<span className="text-[11px] text-deep-danger">
								{errors.fullname}
							</span>
						)}
					</div>
					<div className="flex flex-col gap-1">
						<label
							htmlFor="username"
							className="text-xs font-medium text-text-h"
						>
							Username <span className="text-deep-danger">*</span>
						</label>
						<Input
							id="username"
							placeholder="cashier2"
							value={username}
							onChange={(e) => setUsername(e.currentTarget.value)}
							invalid={Boolean(errors.username)}
							autoComplete="username"
						/>
						{errors.username ? (
							<span className="text-[11px] text-deep-danger">
								{errors.username}
							</span>
						) : (
							<span className="text-[11px] text-text">
								3-100 karakter, huruf/angka/._-
							</span>
						)}
					</div>
					<div className="flex flex-col gap-1">
						<label
							htmlFor="password"
							className="text-xs font-medium text-text-h"
						>
							Password <span className="text-deep-danger">*</span>
						</label>
						<Input
							id="password"
							type="password"
							placeholder="Cashier123!"
							value={password}
							onChange={(e) => setPassword(e.currentTarget.value)}
							invalid={Boolean(errors.password)}
							autoComplete="new-password"
						/>
						{errors.password ? (
							<span className="text-[11px] text-deep-danger">
								{errors.password}
							</span>
						) : (
							<span className="text-[11px] text-text">8-128 karakter</span>
						)}
					</div>
					<div className="flex flex-col gap-1">
						<span className="text-xs font-medium text-text-h">
							Role <span className="text-deep-danger">*</span>
						</span>
						<Select
							label="Role"
							value={role}
							onValueChange={(v) => setRole(v as "admin" | "cashier")}
							items={[
								{ label: "Cashier", value: "cashier" },
								{ label: "Admin", value: "admin" },
							]}
							className="w-full"
						/>
						{errors.role && (
							<span className="text-[11px] text-deep-danger">
								{errors.role}
							</span>
						)}
					</div>
					<label
						htmlFor="register-isActive"
						className="flex items-center gap-2 py-1 text-sm text-text-h select-none"
					>
						<Checkbox
							id="register-isActive"
							checked={isActive}
							onCheckedChange={(c) => setIsActive(c === true)}
							aria-label="Active status"
						/>
						<span className="text-xs font-medium">Active</span>
						<span className="text-[11px] text-text">— isActive</span>
					</label>
				</ModalBody>
				<ModalFooter className="mt-4 -mx-5 -mb-4">
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => handleOpenChange(false)}
						disabled={submitting}
					>
						Cancel
					</Button>
					<Button
						type="submit"
						size="sm"
						disabled={submitting}
					>
						{submitting ? "Creating..." : "Create User"}
					</Button>
				</ModalFooter>
			</form>
		</Modal>
	);
}
