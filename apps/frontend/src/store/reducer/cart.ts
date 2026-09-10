import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface CartItem {
	uuid: string;
	image: null | string;
	alt: string;
	name: string;
	price: number;
	category: string;
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
			state.cart.push(action.payload);
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
