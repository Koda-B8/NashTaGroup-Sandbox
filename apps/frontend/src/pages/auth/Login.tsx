import { Eye, EyeOff, Loader2, Lock, ShieldCheck, User } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router";

import Button from "../../components/ui/button";
import Checkbox from "../../components/ui/checkbox";
import Input from "../../components/ui/input";
import { setCsrfToken } from "../../libs/api";
import type { AppDispatch } from "../../store";
import { setCredentials, type AuthUser } from "../../store/authSlice";

interface LocationState {
	from?: string;
}

interface LoginPayload {
	username: string;
	password: string;
}

interface LoginResponse {
	data: AuthUser & { csrfToken?: string };
	message?: string;
}

const CURRENT_YEAR = new Date().getFullYear();

async function loginRequest(payload: LoginPayload): Promise<LoginResponse> {
	const res = await fetch("/api/v1/auth/login", {
		method: "POST",
		credentials: "include",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	});

	const body = (await res.json()) as LoginResponse & { message?: string };

	if (!res.ok) {
		throw new Error(
			body?.message ?? "Login failed. Silakan periksa kredensial Anda.",
		);
	}

	return body;
}

function BrandingPanel() {
	return (
		<div className="hidden lg:flex lg:w-1/2 relative bg-primary flex-col justify-between p-12 text-white overflow-hidden">
			<div className="absolute -top-24 -left-24 size-96 rounded-full bg-white/10 blur-3xl" />
			<div className="absolute -bottom-24 -right-24 size-96 rounded-full bg-black/10 blur-3xl" />

			<div className="relative z-10 flex items-center gap-3">
				<div className="size-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
					<ShieldCheck className="size-6 text-white" />
				</div>
				<div>
					<h2 className="text-xl font-bold tracking-tight text-white">
						NashTa Group
					</h2>
					<p className="text-xs text-white/80">Enterprise Management System</p>
				</div>
			</div>

			<div className="relative z-10 max-w-md space-y-4">
				<h3 className="text-3xl font-bold leading-tight text-white">
					Portal Operasional Kasir & Administrasi
				</h3>
				<p className="text-sm text-white/80 leading-relaxed">
					Satu pintu masuk untuk layanan Kasir (POS), Manajemen Inventaris,
					Analitik, dan Pengaturan Sistem NashTa Group.
				</p>
			</div>

			<p className="relative z-10 text-xs text-white/60">
				&copy; {CURRENT_YEAR} NashTa Group. All rights reserved.
			</p>
		</div>
	);
}

export default function LoginPage() {
	const dispatch = useDispatch<AppDispatch>();
	const navigate = useNavigate();
	const location = useLocation();
	const redirectTo =
		(location.state as LocationState | null)?.from ?? "/dashboard";

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
			const resData = await loginRequest({ username, password });
			const { csrfToken, ...user } = resData.data as AuthUser & {
				csrfToken?: string;
			};
			if (csrfToken) setCsrfToken(csrfToken);
			dispatch(setCredentials(user as AuthUser));
			navigate(redirectTo, { replace: true });
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
		<div className="min-h-screen w-full flex bg-base">
			<BrandingPanel />

			<div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
				<div className="w-full max-w-md space-y-8">
					<header className="space-y-2 text-center lg:text-left">
						<h1 className="text-2xl font-bold text-text-h">
							Selamat Datang Kembali
						</h1>
						<p className="text-sm text-text">
							Silakan masuk dengan akun Kasir atau Admin Anda.
						</p>
					</header>

					{errorMessage && (
						<div
							role="alert"
							className="p-3 text-sm rounded-lg bg-danger/10 border border-danger/20 text-deep-danger"
						>
							{errorMessage}
						</div>
					)}

					<form
						onSubmit={handleSubmit}
						className="space-y-5"
						noValidate
					>
						<div className="space-y-1.5">
							<label
								htmlFor="username"
								className="block text-xs font-semibold text-text-h uppercase tracking-wider"
							>
								Username
							</label>
							<div className="relative">
								<User className="size-4 text-text absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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

						<div className="space-y-1.5">
							<div className="flex items-center justify-between">
								<label
									htmlFor="password"
									className="block text-xs font-semibold text-text-h uppercase tracking-wider"
								>
									Password
								</label>
								<a
									href="#forgot"
									className="text-xs text-primary hover:underline font-medium"
								>
									Lupa password?
								</a>
							</div>
							<div className="relative">
								<Lock className="size-4 text-text absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
								<Input
									id="password"
									name="password"
									type={showPassword ? "text" : "password"}
									placeholder="Masukkan password Anda"
									required
									disabled={isLoading}
									autoComplete="current-password"
									className="pl-10 pr-10"
								/>
								<button
									type="button"
									onClick={() => setShowPassword((prev) => !prev)}
									disabled={isLoading}
									tabIndex={-1}
									aria-label={
										showPassword ? "Sembunyikan password" : "Tampilkan password"
									}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-text hover:text-text-h transition-colors disabled:opacity-50"
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
								className="text-sm text-text select-none cursor-pointer"
							>
								Ingat saya
							</label>
						</div>

						<Button
							type="submit"
							block
							size="md"
							disabled={isLoading}
							className="w-full mt-2"
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
