export function formatDate(iso?: string | null): string {
	if (!iso) return "—";
	try {
		return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
	} catch {
		return iso;
	}
}

export function getRoleName(role?: string | { id: string; name: string } | null): string {
	if (!role) return "—";
	if (typeof role === "string") return role;
	return role.name ?? "—";
}

export function dotColor(name: string): string {
	const palette = ["#3b82f6", "#15803d", "#a65f00", "#9333ea", "#dc2626", "#0e7490", "#b45309", "#0f766e"];
	let h = 0;
	for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
	return palette[h % palette.length]!;
}

export function initials(name: string): string {
	return name.charAt(0).toUpperCase();
}
