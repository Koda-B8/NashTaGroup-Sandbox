import { combineReducers } from "@reduxjs/toolkit";
import { persistReducer } from "redux-persist";
import storage from "redux-persist/es/storage";

import auth from "./auth.ts";
import cart from "./cart.ts";

const persistCartConfig = {
	key: "cart",
	storage,
	blacklist: ["submitting"],
};

const reducer = combineReducers({
	auth,
	cart: persistReducer(persistCartConfig, cart),
});

export default reducer;
