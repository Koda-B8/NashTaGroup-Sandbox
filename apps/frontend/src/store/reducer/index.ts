import { combineReducers } from "@reduxjs/toolkit";
import { persistReducer } from "redux-persist";
import storage from "redux-persist/es/storage";

import cart from "./cart.ts";

const persistCartConfig = {
	key: "cart",
	storage,
};

const reducer = combineReducers({
	cart: persistReducer(persistCartConfig, cart),
});

export default reducer;
