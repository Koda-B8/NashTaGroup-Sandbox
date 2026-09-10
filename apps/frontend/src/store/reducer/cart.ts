import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface CartItem {
	uuid: string;
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
		addToCart(state, action: PayloadAction<CartItem[]>) {
			state.cart = [...action.payload];
		},

		deleteCartItem(state, action: PayloadAction<CartItem>) {
			state.cart.push(action.payload);
		},

		clearCart(state) {
			state.cart = [];
		},
	},
});

export default cart.reducer;

export const { addToCart, deleteCartItem, clearCart } = cart.actions;
