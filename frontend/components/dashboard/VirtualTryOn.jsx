
import React, { useState, useEffect } from "react";
import { useParams } from 'react-router-dom';
import axios from "axios";
import urlJoin from "url-join";
import { Loader2, Shirt, Camera, CheckCircle2, Package } from 'lucide-react';
import { Button } from "../ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/Card";
import { cn } from "../../lib/utils";

const EXAMPLE_MAIN_URL = window.location.origin;

export function VirtualTryOn() {
  const [pageLoading, setPageLoading] = useState(false);
  const [productList, setProductList] = useState([]);
  const [tryOnImageUrl, setTryOnImageUrl] = useState("");
  const [tryOnResult, setTryOnResult] = useState(null);
  const [generating, setGenerating] = useState(false);
  const { application_id, company_id } = useParams();
  
  // Doc links
  const DOC_URL_PATH = "/help/docs/sdk/latest/platform/company/catalog/#getProducts";
  const DOC_APP_URL_PATH = "/help/docs/sdk/latest/platform/application/catalog#getAppProducts";
  const documentationUrl ='https://api.fynd.com';

  const isApplicationLaunch = () => !!application_id;

  const getDocumentPageLink = () => {
    return documentationUrl
      .replace("api", "partners")
      .concat(isApplicationLaunch() ? DOC_APP_URL_PATH : DOC_URL_PATH);
  };

  useEffect(() => {
    if (company_id || application_id) {
        isApplicationLaunch() ? fetchApplicationProducts() : fetchProducts();
    }
  }, [application_id, company_id]);

  const fetchProducts = async () => {
    setPageLoading(true);
    try {
      const { data } = await axios.get(urlJoin(EXAMPLE_MAIN_URL, '/api/products'),{
        headers: {
          "x-company-id": company_id,
        }
      });
      setProductList(data.items);
    } catch (e) {
      console.error("Error fetching products:", e);
    } finally {
      setPageLoading(false);
    }
  };

  const fetchApplicationProducts = async () => {
    setPageLoading(true);
    try {
      const { data } = await axios.get(urlJoin(EXAMPLE_MAIN_URL, `/api/products/application/${application_id}`),{
        headers: {
          "x-company-id": company_id,
        }
      })
      setProductList(data.items);
    } catch (e) {
      console.error("Error fetching application products:", e);
    } finally {
      setPageLoading(false);
    }
  };
  
  const productProfileImage = (media) => {
    if (!media || !media.length) {
       return "https://cdn.pixelbin.io/v2/dummy-organization/original/fallback-image.png";
    }
    const profileImg = media.find(m => m.type === "image");
    return profileImg?.url || "https://cdn.pixelbin.io/v2/dummy-organization/original/fallback-image.png";
  };

  const handleTryOn = async () => {
    if (!tryOnImageUrl) return;
    setGenerating(true);
    setTryOnResult(null);
    try {
      const { data } = await axios.post(urlJoin(EXAMPLE_MAIN_URL, '/api/try-on'), {
        imageUrl: tryOnImageUrl
      });
      if (data.success && data.output && data.output.length > 0) {
        setTryOnResult(data.output[0]);
      }
    } catch (e) {
      console.error("Error generating try-on:", e);
      const errorMessage = e.response?.data?.message || "Failed to generate try-on. Check console for details.";
      alert(errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  if (pageLoading) {
      return (
          <div className="flex h-[50vh] w-full items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
          </div>
      )
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Virtual Try-On</CardTitle>
          <CardDescription>
            Enter an image URL of a clothing item to generate a virtual try-on model.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="relative flex-1 w-full max-w-2xl">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                        <Shirt className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Enter Image URL (e.g. https://...)"
                        value={tryOnImageUrl}
                        onChange={(e) => setTryOnImageUrl(e.target.value)}
                        className="flex h-12 w-full rounded-lg border border-slate-200 bg-white px-4 py-2 pl-12 text-base ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 shadow-sm"
                    />
                </div>
                <Button 
                    onClick={handleTryOn} 
                    disabled={generating || !tryOnImageUrl}
                    className="w-full sm:w-auto h-12 px-6"
                    size="lg"
                >
                    {generating ? (
                        <>
                            <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Camera className="mr-3 h-5 w-5" />
                            Generate Try-On
                        </>
                    )}
                </Button>
            </div>

            {tryOnResult && (
              <div className="mt-8 rounded-xl border border-indigo-100 bg-indigo-50/50 p-6">
                <h4 className="flex items-center text-base font-semibold mb-4 text-indigo-900">
                    <CheckCircle2 className="mr-2 h-5 w-5 text-indigo-600" />
                    Result Generated
                </h4>
                <div className="mb-4 text-sm text-slate-600 break-all bg-white p-3 rounded border border-indigo-100">
                  <span className="font-medium text-slate-700 mr-2">Link:</span>
                  <a href={tryOnResult} target="_blank" rel="noopener noreferrer" className="hover:underline text-indigo-600">
                    {tryOnResult}
                  </a>
                </div>
                <img 
                    src={tryOnResult} 
                    alt="Try-On Result" 
                    className="max-h-[600px] w-full object-contain rounded-lg bg-white border border-slate-200 shadow-sm" 
                />
              </div>
            )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
           <div className="flex items-center justify-between">
              <div>
                <CardTitle>Product Catalog</CardTitle>
                <CardDescription>
                  Fetching from {isApplicationLaunch() ? 'Application API' : 'Platform API'}.
                   <a href={getDocumentPageLink()} target="_blank" rel="noopener noreferrer" className="ml-2 text-indigo-600 hover:text-indigo-800 font-medium">
                     View Documentation
                   </a>
                </CardDescription>
              </div>
           </div>
        </CardHeader>
        <CardContent>
             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                 {productList.map((product, index) => (
                    <div key={`product-${product.name}-${index}`} className="group relative overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition-all hover:shadow-lg hover:border-indigo-100 hover:-translate-y-1">
                        <div className="aspect-square w-full overflow-hidden bg-slate-50">
                           <img 
                                src={productProfileImage(product.media)} 
                                alt={product.name}
                                className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
                                onError={(e) => { e.target.src = "https://placehold.co/400x400?text=No+Image"; }}
                           />
                        </div>
                        <div className="p-5">
                            <div className="mb-3 flex items-center justify-between">
                                <span className={cn("inline-flex h-2.5 w-2.5 rounded-full shadow-sm", product.is_active ? "bg-green-500" : "bg-slate-300")} title={product.is_active ? "Active" : "Inactive"} />
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{product.brand?.name || 'Brand'}</span>
                            </div>
                            <h3 className="line-clamp-1 text-lg font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors" title={product.name}>
                                {product.name}
                            </h3>
                            <div className="mt-2 flex items-center text-sm text-slate-500">
                                {product.item_code && <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{product.item_code}</span>}
                                {product.category_slug && (
                                    <>
                                        <span className="mx-2 text-slate-300">•</span>
                                        <span className="capitalize">{product.category_slug}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                 ))}
                 {productList.length === 0 && !pageLoading && (
                     <div className="col-span-full py-16 text-center">
                        <div className="mx-auto h-24 w-24 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                            <Package className="h-10 w-10 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900">No products found</h3>
                        <p className="text-slate-500 mt-1">Try checking your API configuration.</p>
                     </div>
                 )}
             </div>
        </CardContent>
      </Card>
    </div>
  );
}
