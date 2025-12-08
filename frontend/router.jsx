import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import VirtualTryOnPage from "./pages/VirtualTryOnPage";
import PostPage from "./pages/PostPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Dashboard />,
  },
  {
    path: "/company/:company_id/",
    element: <Dashboard />,
  },
  {
    path: "/company/:company_id/application/:application_id",
    element: <Dashboard />,
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
  },
  {
    path: "/company/:company_id/post",
    element: <PostPage />,
  },
  {
    path: "/company/:company_id/application/:application_id/post",
    element: <PostPage />,
  },
  {
    path: "/dashboard/post",
    element: <PostPage />,
  },
  {
    path: "/virtual-try-on",
    element: <VirtualTryOnPage />,
  },
  {
    path: "/*", // Fallback route for all unmatched paths
    element: <NotFound />, // Component to render for unmatched paths
  },
]);

export default router;
