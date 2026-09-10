import { Provider } from "react-redux";
import { createBrowserRouter, RouterProvider } from "react-router";
import { PersistGate } from "redux-persist/integration/react";

import DashboardLayout from "./components/layouts/dashboard.layout";
import ProtectedRoute, { GuestRoute } from "./components/ProtectedRoute";
import Home from "./pages";
import NotFound from "./pages/+404";
import Layout from "./pages/+Layout";
import LoginPage from "./pages/auth/Login";
import Checkout from "./pages/Checkout";
import {
	CategoriesDashboard,
	MainDashboard,
	UserManagementDashboard,
} from "./pages/dashboard";
import { persistor, store } from "./store";

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
	{
		element: <GuestRoute />,
		children: [{ path: "/login", element: <LoginPage /> }],
	},
	{
		element: <ProtectedRoute />,
		children: [
			{
				path: "/dashboard",
				element: <DashboardLayout />,
				children: [
					{
						index: true,
						element: <MainDashboard />,
					},
					{
						path: "products/categories",
						element: <CategoriesDashboard />,
					},
					{
						path: "cashier",
						element: <UserManagementDashboard />,
					},
				],
			},
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
