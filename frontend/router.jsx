import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import VirtualTryOnPage from "./pages/VirtualTryOnPage";
import PostPage from "./pages/PostPage";
import ProductDetailPage from "./pages/ProductDetailPage";

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
    path: "/company/:company_id/post/:slug",
    element: <ProductDetailPage />,
  },
  {
    path: "/company/:company_id/application/:application_id/post",
    element: <PostPage />,
  },
  {
    path: "/company/:company_id/application/:application_id/post/:slug",
    element: <ProductDetailPage />,
  },
  {
    path: "/dashboard/post",
    element: <PostPage />,
  },
  {
    path: "/dashboard/post/:slug",
    element: <ProductDetailPage />,
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
