import { Provider } from "react-redux";
import {
	createBrowserRouter,
	Link,
	Outlet,
	RouterProvider,
} from "react-router";

import { store } from "./store";

const router = createBrowserRouter([
	{
		path: "/",
		element: (
			<>
				<nav>
					<Link to="/">Home</Link>
				</nav>
				<Outlet />
			</>
		),
		children: [
			{ index: true, element: <h1>Home</h1> },
			{ path: "*", element: <h1>Not Found</h1> },
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
