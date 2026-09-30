import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface CartItem {
	id: string;
	productId: string;
	productItemId: string;
	productCode: string;
	name: string;
	category: string;
	image: string | null;
	alt: string;
	color: string;
	specs: string;
	price: number;
	total: number;
	qty: number;
	stock: number;
}

export interface PendingCheckout {
	key: string;
	fingerprint: string;
}

export interface CartState {
	cart: CartItem[];
	submitting: boolean;
	pendingCheckout: PendingCheckout | null;
}

const initialState: CartState = {
	cart: [],
	submitting: false,
	pendingCheckout: null,
};

const cart = createSlice({
	name: "cart",
	initialState,

	reducers: {
		addToCart(state, action: PayloadAction<CartItem>) {
			const incoming = action.payload;
			const index = state.cart.findIndex((item) => item.id === incoming.id);

			if (index === -1) {
				state.cart.push({
					...incoming,
					total: incoming.price * incoming.qty,
				});
				return;
			}

			const existing = state.cart[index];
			const qty = existing.qty + incoming.qty;

			state.cart[index] = {
				...existing,
				...incoming,
				qty,
				total: incoming.price * qty,
			};
		},

		deleteCartItem(state, action: PayloadAction<{ id: string }>) {
			state.cart = state.cart.filter((item) => item.id !== action.payload.id);
		},

		decrementItem: (state, action: PayloadAction<{ id: string }>) => {
			const item = state.cart.find((item) => item.id === action.payload.id);
			if (item && item.qty > 1) {
				item.qty -= 1;
				item.total = item.price * item.qty;
			}
		},

		incrementItem: (state, action: PayloadAction<{ id: string }>) => {
			const item = state.cart.find((item) => item.id === action.payload.id);
			if (item) {
				item.qty += 1;
				item.total = item.price * item.qty;
			}
		},

		clearCart(state) {
			state.cart = [];
			state.pendingCheckout = null;
		},

		setSubmitting(state, action: PayloadAction<boolean>) {
			state.submitting = action.payload;
		},

		setPendingCheckout(state, action: PayloadAction<PendingCheckout | null>) {
			state.pendingCheckout = action.payload;
		},
	},
});

export default cart.reducer;

export const {
	addToCart,
	deleteCartItem,
	incrementItem,
	decrementItem,
	clearCart,
	setSubmitting,
	setPendingCheckout,
} = cart.actions;
