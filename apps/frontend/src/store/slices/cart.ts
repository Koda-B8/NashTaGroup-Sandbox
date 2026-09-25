import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface CartItem {
	id: string;
	name: string;
	category: string;
	image: string | null;
	alt: string;
	color: string;
	price: number;
	total: number;
	qty: number;
	specs: string;
	options: FormDataEntryValue[];
}

export interface CartState {
	cart: CartItem[];
}

const initialState: CartState = {
	cart: [],
};

const cart = createSlice({
	name: "cart",
	initialState,

	reducers: {
		addToCart(state, action: PayloadAction<CartItem>) {
			const data: CartItem = action.payload;
			const persisData = state.cart;
			const isFound = persisData.filter((item) => item.id === data.id);
			if (isFound.length === 0) {
				state.cart.push(action.payload);
			} else {
				const idx = persisData.findIndex((item) => item.id === data.id);
				data.qty += isFound[0].qty;
				state.cart.splice(idx, 1, data);
			}
		},

		deleteCartItem(state, action) {
			const data = state.cart.filter((item) => item.id !== action.payload.id);
			state.cart = data;
		},

		decrementItem: (state, action) => {
			const item = state.cart.find((item) => item.id === action.payload.id);
			if (item && item.qty > 1) {
				item.qty -= 1;
				item.total -= item.price;
			}
		},

		incrementItem: (state, action) => {
			const item = state.cart.find((item) => item.id === action.payload.id);
			if (item) {
				item.qty += 1;
				item.total += item.price;
			}
		},

		clearCart(state) {
			state.cart = [];
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
} = cart.actions;
