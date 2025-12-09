
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import urlJoin from "url-join";
import { Loader2, Package, Tag, Clock, MoreHorizontal, Edit3, BarChart2 } from 'lucide-react';
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
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-900 via-slate-800 to-indigo-900 pb-1">
                            Smart Price Analysis
                        </h1>
                        <span className="px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Beta</span>
                    </div>
                    <p className="text-slate-500 text-lg max-w-2xl font-medium leading-relaxed">
                        Compare market rates, optimize your catalog pricing, and publish directly to channels.
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

    const handleCardClick = (e) => {
         // Prevent navigation if clicking actions
         if (e.target.closest('button')) return;

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
            className="group relative bg-white/40 backdrop-blur-md rounded-[32px] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] hover:-translate-y-2 transition-all duration-500 ease-out flex flex-col h-full cursor-pointer overflow-hidden ring-1 ring-white/50"
        >
            {/* Soft inner glow gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/20 to-indigo-50/20 opacity-100 group-hover:opacity-0 transition-opacity duration-500" />
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 via-white/40 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Top Action Bar */}
            <div className="absolute top-4 left-4 right-4 z-30 flex justify-between items-start">
               {/* Status Pill */}
               <span className={cn(
                "relative inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] border shadow-sm backdrop-blur-xl transition-all duration-300",
                product.is_active 
                    ? "bg-emerald-400/10 text-emerald-600 border-emerald-200/40 shadow-[0_0_15px_rgba(52,211,153,0.3)]" 
                    : "bg-slate-400/10 text-slate-500 border-slate-200/40 shadow-sm"
                )}>
                    <span className={cn("w-1.5 h-1.5 rounded-full shadow-inner", product.is_active ? "bg-emerald-400 animate-pulse" : "bg-slate-400")} />
                    {product.is_active ? 'ACTIVE' : 'HIDDEN'}
                </span>

                {/* 3-Dot Menu */}
                <button className="p-2 -mr-2 -mt-2 rounded-full hover:bg-white/50 text-slate-400 hover:text-slate-700 transition-colors">
                    <MoreHorizontal className="h-5 w-5" />
                </button>
            </div>

            {/* Image Container - Floating Glass */}
            <div className="relative w-full pt-12 px-5 pb-0 flex items-center justify-center z-20">
                <div className="relative w-full aspect-[4/3] bg-gradient-to-b from-white/40 to-white/10 rounded-[28px] flex items-center justify-center p-6 border border-white/60 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] group-hover:shadow-[0_15px_40px_rgba(0,0,0,0.08)] transition-all duration-500 transform group-hover:scale-[1.02]">
                    
                    {/* The Product Image */}
                    {imageUrl ? (
                        <div className="relative w-full h-full flex items-center justify-center">
                             {/* Floor reflection */}
                            <div className="absolute bottom-[-15px] w-2/3 h-4 bg-black/10 blur-xl rounded-full opacity-0 group-hover:opacity-50 transition-opacity duration-500" />
                            <img 
                                src={imageUrl} 
                                alt={product.name} 
                                className="h-full w-auto object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.06)] group-hover:drop-shadow-[0_20px_30px_rgba(0,0,0,0.12)] transition-all duration-700 ease-out will-change-transform"
                                loading="lazy"
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-slate-300">
                            <Package className="h-10 w-10 mb-2 opacity-20" />
                            <span className="text-[9px] font-black uppercase tracking-widest opacity-20">No Image</span>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Content Section */}
            <div className="relative px-6 pb-6 pt-6 flex flex-col flex-1 z-20">
                <div className="flex justify-between items-start mb-2">
                    {/* Brand/Category Capsule */}
                    <div className="flex items-center">
                        {product.brand && (
                            <span className="text-[9px] font-black text-indigo-500/80 uppercase tracking-[0.15em] px-2.5 py-1 rounded-full bg-indigo-50/50 border border-indigo-100/30">
                                {product.brand.name}
                            </span>
                        )}
                    </div>
                </div>

                {/* Title */}
                <h3 className="text-[17px] font-bold text-slate-800 leading-snug mb-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-violet-600 transition-all duration-300 line-clamp-1">
                    {product.name}
                </h3>
                
                 {/* SKU/Slug */}
                 <div className="text-[11px] text-slate-400 font-medium font-mono mb-6 truncate opacity-60 tracking-wide">
                     {product.slug}
                 </div>

                {/* Glass Divider */}
                <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200/60 to-transparent mb-5" />

                {/* Price & Action */}
                <div className="mt-auto flex items-end justify-between">
                     <div className="flex flex-col gap-0.5">
                         <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest opacity-70">Price</span>
                         <div className="flex items-baseline gap-2">
                            {product.price ? (
                                <>
                                 <span className="text-2xl font-black text-slate-800 tracking-tight">
                                     <span className="text-sm align-top text-slate-400 font-bold mr-0.5">{product.price.currency_symbol}</span>
                                     {product.price.effective?.min || '0'}
                                 </span>
                                 {product.price.marked && (
                                     <span className="text-[11px] font-semibold text-slate-300 line-through decoration-slate-300/50">
                                        {product.price.marked.min}
                                     </span>
                                 )}
                                </>
                            ) : (
                                <span className="text-lg font-bold text-slate-300">N/A</span>
                            )}
                         </div>
                     </div>
                     
                     {/* Action Buttons (Edit/Analytics) */}
                     <div className="flex items-center gap-2">
                        <button className="p-2 rounded-xl bg-slate-50 hover:bg-white border border-slate-100/50 hover:border-indigo-100 text-slate-400 hover:text-indigo-600 transition-all shadow-sm hover:shadow-md">
                            <Edit3 className="h-4 w-4" />
                        </button>
                        <button className="p-2 rounded-xl bg-slate-50 hover:bg-white border border-slate-100/50 hover:border-indigo-100 text-slate-400 hover:text-indigo-600 transition-all shadow-sm hover:shadow-md">
                             <BarChart2 className="h-4 w-4" />
                        </button>
                     </div>
                </div>
            </div>
        </div>
    );
}

