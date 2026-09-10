import { Provider } from "react-redux";
import { createBrowserRouter, RouterProvider } from "react-router";
import { PersistGate } from "redux-persist/integration/react";

import Home from "./pages";
import NotFound from "./pages/+404";
import Layout from "./pages/+Layout";
import Checkout from "./pages/Checkout";
import { store, persistor } from "./store";

const router = createBrowserRouter([
	{
		path: "/",
		element: <Layout />,
		children: [
			{ index: true, element: <Home /> },
			{ path: "/checkout", element: <Checkout /> },
			{ path: "*", element: <NotFound /> },
		],
	},
]);

export default function App() {
	return (
		<PersistGate persistor={persistor}>
			<Provider store={store}>
				<RouterProvider router={router} />
			</Provider>
		</PersistGate>
	);
}
