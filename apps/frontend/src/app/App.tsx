import { Provider } from "react-redux";
import { createBrowserRouter, RouterProvider } from "react-router";
import { PersistGate } from "redux-persist/integration/react";

import {
	CartPanel,
	CheckoutSteps,
	CheckoutSummary,
	FiltersPanel,
	StructSteps,
} from "../components/panels";
import Home from "../pages";
import NotFound from "../pages/+404";
import Layout from "../pages/+Layout";
import LoginPage from "../pages/auth/Login";
import Checkout from "../pages/Checkout";
import {
	BrandsDashboard,
	CategoriesDashboard,
	InventoriesManagementDashboard,
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
			{
				index: true,
				element: <Home />,
				handle: {
					left: FiltersPanel,
					right: CartPanel,
					crumbs: [{ label: "Products" }],
				},
			},
			{
				path: "/checkout",
				element: <Checkout />,
				handle: {
					left: CheckoutSteps,
					right: CheckoutSummary,
					crumbs: [{ label: "Products", to: "/" }, { label: "Checkout" }],
				},
			},
			{
				path: "/struct",
				element: <StructStatus />,
				handle: {
					left: StructSteps,
					right: CheckoutSummary,
					crumbs: [{ label: "Products", to: "/" }, { label: "Struk" }],
				},
			},
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
						handle: { crumbs: [{ label: "Home" }] },
					},
					{
						path: "products/inventory",
						element: <InventoriesManagementDashboard />,
						handle: {
							crumbs: [
								{ label: "Products", to: "/dashboard/products" },
								{ label: "Inventory" },
							],
						},
					},
					{
						path: "products/categories",
						element: <CategoriesDashboard />,
						handle: {
							crumbs: [
								{ label: "Products", to: "/dashboard/products" },
								{ label: "Categories" },
							],
						},
					},
					{
						path: "products/brands",
						element: <BrandsDashboard />,
						handle: {
							crumbs: [
								{ label: "Products", to: "/dashboard/products" },
								{ label: "Brands" },
							],
						},
					},
					{
						path: "products",
						element: <ProductsManagementDashboard />,
						handle: { crumbs: [{ label: "Products" }] },
					},
					{
						path: "orders",
						element: <OrdersManagementDashboard />,
						handle: { crumbs: [{ label: "Transactions" }] },
					},
					{
						element: <ProtectedRoute allowedRoles={["admin"]} />,
						children: [
							{
								path: "cashier",
								element: <UserManagementDashboard />,
								handle: { crumbs: [{ label: "Cashier" }] },
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
