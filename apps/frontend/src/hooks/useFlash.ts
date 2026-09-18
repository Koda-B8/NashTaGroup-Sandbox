import { useCallback, useEffect, useRef, useState } from "react";

export type FlashVariant = "success" | "error";

export interface FlashState {
	message: string;
	variant: FlashVariant;
}

const DEFAULT_DURATION = 2800;

export function useFlash(duration = DEFAULT_DURATION) {
	const [flash, setFlash] = useState<FlashState | null>(null);
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const show = useCallback(
		(message: string, variant: FlashVariant = "success") => {
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
			setFlash({ message, variant });
			timeoutRef.current = setTimeout(() => setFlash(null), duration);
		},
		[duration],
	);

	const clear = useCallback(() => {
		if (timeoutRef.current) clearTimeout(timeoutRef.current);
		setFlash(null);
	}, []);

	useEffect(
		() => () => {
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
		},
		[],
	);

	return { flash, show, clear };
}
