import { Provider } from "react-redux";
import { createBrowserRouter, RouterProvider } from "react-router";

import Home from "./pages";
import NotFound from "./pages/+404";
import Layout from "./pages/+Layout";
import Checkout from "./pages/Checkout";
import { store } from "./store";

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
		<Provider store={store}>
			<RouterProvider router={router} />
		</Provider>
	);
}
