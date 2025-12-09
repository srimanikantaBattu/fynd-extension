
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
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
    const { company_id, application_id } = useParams();
    const navigate = useNavigate();

    const productProfileImage = (media) => {
        if (!media || !media.length) {
          return null;
        }
        const profileImg = media.find(m => m.type === "image");
        return profileImg?.url || media[0]?.url || null;
    };

    const imageUrl = productProfileImage(product.media);

    const handleCardClick = () => {
         const baseUrl = application_id && company_id 
             ? `/company/${company_id}/application/${application_id}/post`
             : company_id 
                 ? `/company/${company_id}/post`
                 : '/dashboard/post';
               
         navigate(`${baseUrl}/${product.slug}`, { state: { product } });
    };

    return (
        <div 
            onClick={handleCardClick}
            className="group relative bg-white/40 backdrop-blur-sm rounded-[32px] border border-white/60 shadow-[0_4px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)] hover:-translate-y-2 transition-all duration-500 ease-out flex flex-col h-full cursor-pointer overflow-hidden ring-1 ring-white/50"
        >
            {/* Soft inner glow gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/20 to-indigo-50/30 opacity-100 group-hover:opacity-0 transition-opacity duration-500" />
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-white/40 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Status Pill - Ultra Modern Glow */}
            <div className="absolute top-4 right-4 z-30">
                <span className={cn(
                "relative inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] border shadow-sm backdrop-blur-xl transition-all duration-300",
                product.is_active 
                    ? "bg-emerald-400/10 text-emerald-600 border-emerald-200/40 shadow-[0_0_15px_rgba(52,211,153,0.3)]" 
                    : "bg-slate-400/10 text-slate-500 border-slate-200/40 shadow-sm"
                )}>
                    <span className={cn("w-1.5 h-1.5 rounded-full shadow-inner", product.is_active ? "bg-emerald-400 animate-pulse" : "bg-slate-400")} />
                    {product.is_active ? 'ACTIVE' : 'HIDDEN'}
                </span>
            </div>

            {/* Image Container - Floating Glass */}
            <div className="relative w-full pt-5 px-5 pb-0 flex items-center justify-center z-20">
                <div className="relative w-full aspect-[3/2] bg-white/60 rounded-[24px] flex items-center justify-center p-6 border border-white/80 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] group-hover:shadow-[0_15px_30px_rgba(0,0,0,0.05)] transition-all duration-500 transform group-hover:scale-[1.02]">
                    
                    {/* The Product Image */}
                    {imageUrl ? (
                        <div className="relative w-full h-full flex items-center justify-center">
                             {/* Floor reflection */}
                            <div className="absolute bottom-[-10px] w-2/3 h-4 bg-black/10 blur-xl rounded-full opacity-0 group-hover:opacity-60 transition-opacity duration-500" />
                            <img 
                                src={imageUrl} 
                                alt={product.name} 
                                className="h-full w-auto object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.05)] group-hover:drop-shadow-[0_20px_25px_rgba(0,0,0,0.1)] transition-all duration-700 ease-out will-change-transform"
                                loading="lazy"
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-slate-300">
                            <Package className="h-8 w-8 mb-2 opacity-20" />
                            <span className="text-[8px] font-black uppercase tracking-widest opacity-20">No Image</span>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Content Section */}
            <div className="relative px-6 pb-6 pt-5 flex flex-col flex-1 z-20">
                {/* Brand Capsule */}
                <div className="mb-3 flex items-center">
                    {product.brand && (
                         <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.15em] px-2 py-1 rounded-lg bg-indigo-50/50 border border-indigo-100/30">
                            {product.brand.name}
                        </span>
                    )}
                </div>
                
                {/* Title */}
                <h3 className="text-[15px] font-bold text-slate-800 leading-snug mb-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-violet-600 transition-all duration-300 line-clamp-1">
                    {product.name}
                </h3>
                
                 {/* SKU/Slug */}
                 <div className="text-[10px] text-slate-400 font-medium font-mono mb-5 truncate opacity-50 tracking-wide">
                     {product.slug}
                 </div>

                {/* Glass Divider */}
                <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200/60 to-transparent mb-4" />

                {/* Price & Action */}
                <div className="mt-auto flex items-end justify-between">
                     <div className="flex flex-col gap-0.5">
                         <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest opacity-70">Price</span>
                         <div className="flex items-baseline gap-2">
                            {product.price ? (
                                <>
                                 <span className="text-xl font-black text-slate-800 tracking-tight">
                                     <span className="text-sm align-top text-slate-400 font-bold mr-0.5">{product.price.currency_symbol}</span>
                                     {product.price.effective?.min || '0'}
                                 </span>
                                 {product.price.marked && (
                                     <span className="text-[10px] font-semibold text-slate-300 line-through decoration-slate-300/50">
                                        {product.price.marked.min}
                                     </span>
                                 )}
                                </>
                            ) : (
                                <span className="text-sm font-bold text-slate-300">N/A</span>
                            )}
                         </div>
                     </div>
                     
                     {/* SKU Badge */}
                     {product.item_code && (
                         <div className="flex flex-col items-end">
                             <div className="px-2 py-1 rounded-lg bg-slate-50/50 border border-slate-100/50 group-hover:bg-white group-hover:shadow-sm group-hover:border-indigo-100/50 transition-all duration-300">
                                <span className="text-[10px] font-mono font-bold text-slate-400 group-hover:text-indigo-500 transition-colors">
                                    {product.item_code}
                                </span>
                             </div>
                        </div>
                     )}
                </div>
            </div>
        </div>
    );
}

