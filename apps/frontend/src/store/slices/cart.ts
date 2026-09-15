import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface CartItem {
	id: string;
	image: null | string;
	alt: string;
	name: string;
	price: number;
	qty: number;
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

		deleteCartItem(state, action: PayloadAction<CartItem>) {
			const data = state.cart.filter((item) => item !== action.payload);
			state.cart = data;
		},

		clearCart(state) {
			state.cart = [];
		},
	},
});

export default cart.reducer;

export const { addToCart, deleteCartItem, clearCart } = cart.actions;
