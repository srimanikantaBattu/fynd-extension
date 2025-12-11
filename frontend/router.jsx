import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import VirtualTryOnPage from "./pages/VirtualTryOnPage";
import PostPage from "./pages/PostPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import SetPricePage from "./pages/SetPricePage";
import GenerateModelPage from "./pages/GenerateModelPage";
import BundlesPage from "./pages/BundlesPage";

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
    path: "/dashboard/set-price",
    element: <SetPricePage />,
  },
  {
    path: "/virtual-try-on",
    element: <VirtualTryOnPage />,
  },
  {
    path: "/company/:company_id/set-price",
    element: <SetPricePage />,
  },
  {
    path: "/company/:company_id/application/:application_id/set-price",
    element: <SetPricePage />,
  },
  {
    path: "/dashboard/generate-model",
    element: <GenerateModelPage />,
  },
  {
    path: "/company/:company_id/generate-model",
    element: <GenerateModelPage />,
  },
  {
    path: "/company/:company_id/application/:application_id/generate-model",
    element: <GenerateModelPage />,
  },
  {
    path: "/dashboard/bundles",
    element: <BundlesPage />,
  },
  {
    path: "/company/:company_id/bundles",
    element: <BundlesPage />,
  },
  {
    path: "/company/:company_id/application/:application_id/bundles",
    element: <BundlesPage />,
  },
  {
    path: "/*", // Fallback route for all unmatched paths
    element: <NotFound />, // Component to render for unmatched paths
  },
]);

export default router;
