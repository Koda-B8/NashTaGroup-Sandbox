import { Eye, EyeOff, Loader2, Lock, ShieldCheck, User } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router";

import Button from "../../components/ui/button";
import Checkbox from "../../components/ui/checkbox";
import ErrorBanner from "../../components/ui/error-banner";
import Input from "../../components/ui/input";
import { login } from "../../features/auth/api";
import { APP_NAME } from "../../libs/app";
import type { AppDispatch } from "../../store";
import { roleHomePath, setCredentials } from "../../store/slices/auth";

interface LocationState {
	from?: string;
}

const CURRENT_YEAR = new Date().getFullYear();

function BrandingPanel() {
	return (
		<div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-12 text-white lg:flex lg:w-1/2">
			<div className="absolute -top-24 -left-24 size-96 rounded-full bg-white/10 blur-3xl" />
			<div className="absolute -right-24 -bottom-24 size-96 rounded-full bg-black/10 blur-3xl" />

			<div className="relative z-10 flex items-center gap-3">
				<div className="flex size-10 items-center justify-center rounded-lg border border-white/20 bg-white/15 backdrop-blur-md">
					<ShieldCheck className="size-6 text-white" />
				</div>
				<div>
					<h2 className="text-xl font-bold tracking-tight text-white">
						{APP_NAME}
					</h2>
					<p className="text-xs text-white/80">Enterprise Management System</p>
				</div>
			</div>

			<div className="relative z-10 flex max-w-md flex-col gap-4">
				<h3 className="text-3xl leading-tight font-bold text-white">
					Portal Operasional Kasir & Administrasi
				</h3>
				<p className="text-sm leading-relaxed text-white/80">
					Satu pintu masuk untuk layanan Kasir (POS), Manajemen Inventaris,
					Analitik, dan Pengaturan Sistem {APP_NAME}.
				</p>
			</div>

			<p className="relative z-10 text-xs text-white/60">
				&copy; {CURRENT_YEAR} {APP_NAME}. All rights reserved.
			</p>
		</div>
	);
}

export default function LoginPage() {
	const dispatch = useDispatch<AppDispatch>();
	const navigate = useNavigate();
	const location = useLocation();
	const from = (location.state as LocationState | null)?.from;

	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setErrorMessage(null);
		setIsLoading(true);

		const formData = new FormData(e.currentTarget);
		const username = String(formData.get("username") ?? "").trim();
		const password = String(formData.get("password") ?? "");

		try {
			const user = await login({ username, password });
			dispatch(setCredentials(user));
			navigate(from ?? roleHomePath(user.role), { replace: true });
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "Terjadi kesalahan jaringan. Silakan coba lagi.";
			setErrorMessage(message);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex min-h-screen w-full bg-base">
			<BrandingPanel />

			<div className="flex w-full items-center justify-center p-6 sm:p-12 lg:w-1/2">
				<div className="flex w-full max-w-md flex-col gap-8">
					<header className="flex flex-col gap-2 text-center lg:text-left">
						<h1 className="text-2xl font-bold text-text-h">
							Selamat Datang Kembali
						</h1>
						<p className="text-sm text-text">
							Silakan masuk dengan akun Kasir atau Admin Anda.
						</p>
					</header>

					{errorMessage && <ErrorBanner message={errorMessage} />}

					<form
						onSubmit={handleSubmit}
						className="flex flex-col gap-5"
						noValidate
					>
						<div className="flex flex-col gap-1.5">
							<label
								htmlFor="username"
								className="text-xs font-medium text-text-h"
							>
								Username
							</label>
							<div className="relative">
								<User className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-text" />
								<Input
									id="username"
									name="username"
									placeholder="Masukkan username Anda"
									required
									disabled={isLoading}
									autoComplete="username"
									className="pl-10"
								/>
							</div>
						</div>

						<div className="flex flex-col gap-1.5">
							<div className="flex items-center justify-between">
								<label
									htmlFor="password"
									className="text-xs font-medium text-text-h"
								>
									Password
								</label>
								<a
									href="#forgot"
									className="text-xs font-medium text-primary hover:underline"
								>
									Lupa password?
								</a>
							</div>
							<div className="relative">
								<Lock className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-text" />
								<Input
									id="password"
									name="password"
									type={showPassword ? "text" : "password"}
									placeholder="Masukkan password Anda"
									required
									disabled={isLoading}
									autoComplete="current-password"
									className="pr-10 pl-10"
								/>
								<button
									type="button"
									onClick={() => setShowPassword((prev) => !prev)}
									disabled={isLoading}
									tabIndex={-1}
									aria-label={
										showPassword ? "Sembunyikan password" : "Tampilkan password"
									}
									className="absolute top-1/2 right-3 -translate-y-1/2 text-text transition-colors hover:text-text-h focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
								>
									{showPassword ? (
										<EyeOff className="size-4" />
									) : (
										<Eye className="size-4" />
									)}
								</button>
							</div>
						</div>

						<div className="flex items-center gap-2">
							<Checkbox
								id="rememberMe"
								name="rememberMe"
								disabled={isLoading}
							/>
							<label
								htmlFor="rememberMe"
								className="cursor-pointer text-sm text-text select-none"
							>
								Ingat saya
							</label>
						</div>

						<Button
							type="submit"
							block
							size="md"
							disabled={isLoading}
							className="mt-2"
						>
							{isLoading ? (
								<>
									<Loader2 className="size-4 animate-spin" />
									Memproses...
								</>
							) : (
								"Masuk Sekarang"
							)}
						</Button>
					</form>
				</div>
			</div>
		</div>
	);
}
