import { Provider } from "react-redux";
import { createBrowserRouter, RouterProvider } from "react-router";
import { PersistGate } from "redux-persist/integration/react";

import Home from "../pages";
import NotFound from "../pages/+404";
import Layout from "../pages/+Layout";
import LoginPage from "../pages/auth/Login";
import Checkout from "../pages/Checkout";
import {
	CategoriesDashboard,
	MainDashboard,
	UserManagementDashboard,
} from "../pages/dashboard";
import DashboardLayout from "../pages/dashboard/+Layout";
import ProductsManagementDashboard from "../pages/dashboard/ProductsManagement";
import OrdersManagementDashboard from "../pages/dashboard/TranscationsManagement";
import StructStatus from "../pages/StructStatus";
import { persistor, store } from "../store";
import ProtectedRoute, { GuestRoute } from "./ProtectedRoute";

const router = createBrowserRouter([
	{
		path: "/",
		element: <Layout />,
		children: [
			{ index: true, element: <Home /> },
			{ path: "/checkout", element: <Checkout /> },
			{ path: "/struct", element: <StructStatus /> },
			{ path: "*", element: <NotFound /> },
		],
	},
	{
		element: <GuestRoute />,
		children: [{ path: "/login", element: <LoginPage /> }],
	},
	{
		element: <ProtectedRoute allowedRoles={["admin"]} />,
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
						path: "products",
						element: <ProductsManagementDashboard />,
					},
					{
						path: "orders",
						element: <OrdersManagementDashboard />,
					},
					{
						element: <ProtectedRoute allowedRoles={["admin"]} />,
						children: [
							{
								path: "cashier",
								element: <UserManagementDashboard />,
							},
						],
					},
				],
			},
		],
	},
]);

export default function App() {
	return (
		<Provider store={store}>
			<PersistGate
				loading={null}
				persistor={persistor}
			>
				<RouterProvider router={router} />
			</PersistGate>
		</Provider>
	);
}
