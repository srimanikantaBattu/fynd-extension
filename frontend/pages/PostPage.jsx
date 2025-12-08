
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import urlJoin from "url-join";
import { Loader2, Package, Tag, Clock } from 'lucide-react';
import { cn } from '../lib/utils';

const EXAMPLE_MAIN_URL = window.location.origin;
const DEFAULT_NO_IMAGE = "https://cdn.pixelbin.io/v2/dummy-image/original/placeholder.png"; // Fallback

export default function PostPage() {
  const { application_id, company_id } = useParams();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    isApplicationLaunch() ? fetchApplicationProducts() : fetchProducts();
  }, [application_id, company_id]);

  const isApplicationLaunch = () => !!application_id;

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(urlJoin(EXAMPLE_MAIN_URL, '/api/products'), {
        headers: {
          "x-company-id": company_id,
        }
      });
      setProducts(data.items || []);
    } catch (e) {
      console.error("Error fetching products:", e);
    } finally {
      // Add a small delay for smooth transition if needed, or remove for speed
      setLoading(false);
    }
  };

  const fetchApplicationProducts = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(urlJoin(EXAMPLE_MAIN_URL, `/api/products/application/${application_id}`), {
        headers: {
          "x-company-id": company_id,
        }
      });
      setProducts(data.items || []);
    } catch (e) {
      console.error("Error fetching application products:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <Sidebar className="hidden md:block fixed inset-y-0" />
      <div className="flex-1 flex flex-col md:pl-64 transition-all duration-300">
        <Header />
        <main className="flex-1 p-6 lg:p-8 max-w-[1920px] mx-auto w-full">
            <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        Post
                    </h1>
                    <p className="text-slate-500">
                        Manage your product catalog.
                    </p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                    </div>
                ) : products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-96 rounded-3xl border border-dashed border-slate-200 bg-white/50">
                        <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                            <Package className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">No products found</h3>
                        <p className="text-slate-500 max-w-sm text-center mt-2">
                           We couldn't reach your catalog. check your connection or try again later.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                        {products.map((product, index) => (
                            <ProductCard key={`${product.uid || product.slug}-${index}`} product={product} />
                        ))}
                    </div>
                )}
            </div>
        </main>
      </div>
    </div>
  );
}

function ProductCard({ product }) {
    const productProfileImage = (media) => {
        if (!media || !media.length) {
          return null;
        }
        const profileImg = media.find(m => m.type === "image");
        return profileImg?.url || media[0]?.url || null;
    };

    const imageUrl = productProfileImage(product.media);

    return (
        <div className="group relative bg-white rounded-2xl border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col h-full">
            {/* Image Container */}
            <div className="aspect-[3/4] bg-slate-100 relative overflow-hidden">
                {imageUrl ? (
                    <img 
                        src={imageUrl} 
                        alt={product.name} 
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50">
                        <Package className="h-12 w-12 mb-2 opacity-50" />
                        <span className="text-xs font-medium opacity-50">No Image</span>
                    </div>
                )}
                
                {/* Status Badge */}
                <div className="absolute top-3 left-3">
                     <span className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide backdrop-blur-md shadow-sm",
                        product.is_active 
                            ? "bg-emerald-500/90 text-white" 
                            : "bg-slate-500/90 text-white"
                     )}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", product.is_active ? "bg-emerald-200" : "bg-slate-300")} />
                        {product.is_active ? 'Active' : 'Inactive'}
                     </span>
                </div>
            </div>
            
            {/* Content */}
            <div className="p-4 flex flex-col flex-1">
                {product.brand && (
                    <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1.5">
                        {product.brand.name}
                    </div>
                )}
                
                <h3 className="text-sm font-semibold text-slate-900 mb-2 line-clamp-2 leading-relaxed group-hover:text-indigo-600 transition-colors">
                    {product.name}
                </h3>

                {/* Metadata */}
                <div className="mt-auto pt-4 flex flex-col gap-2 border-t border-slate-50">
                     <div className="flex items-center justify-between">
                         <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 font-medium uppercase">Price</span>
                             <div className="flex items-baseline gap-1">
                                {product.price ? (
                                    <>
                                     <span className="text-sm font-bold text-slate-900">
                                         {product.price.currency_symbol} {product.price.effective?.min || product.price.effective?.max || 'N/A'}
                                     </span>
                                     {product.price.marked && (
                                         <span className="text-[10px] text-slate-400 line-through decoration-slate-400/50">
                                            {product.price.marked.min || product.price.marked.max}
                                         </span>
                                     )}
                                    </>
                                ) : (
                                    <span className="text-sm font-medium text-slate-500">N/A</span>
                                )}
                             </div>
                         </div>
                         
                         {product.item_code && (
                             <div className="flex flex-col items-end">
                                 <span className="text-[10px] text-slate-400 font-medium uppercase">SKU</span>
                                 <span className="text-xs font-mono text-slate-600 truncate max-w-[80px] bg-slate-50 px-1.5 py-0.5 rounded">
                                    {product.item_code}
                                 </span>
                            </div>
                         )}
                     </div>
                </div>
            </div>
        </div>
    );
}

