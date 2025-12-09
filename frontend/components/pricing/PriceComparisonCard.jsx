import React, { useState, useEffect } from 'react';
import { Check, RefreshCw, TrendingDown, AlertCircle, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export function PriceComparisonCard({ query }) {
  const [loading, setLoading] = useState(true);
  
  // Simulate fetching data
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000); 
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-3xl bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-4 mb-8">
           <div className="h-10 w-10 bg-slate-100 rounded-lg animate-pulse"></div>
           <div className="space-y-2">
               <div className="h-4 w-48 bg-slate-100 rounded-md animate-pulse"></div>
               <div className="h-3 w-32 bg-slate-50 rounded-md animate-pulse"></div>
           </div>
        </div>
        <div className="space-y-3">
            {[1, 2, 3].map(i => (
                <div key={i} className="h-16 w-full bg-slate-50 rounded-lg animate-pulse border border-slate-100"></div>
            ))}
        </div>
      </div>
    );
  }

  // Mock Data
  const myPrice = 2499;
  const competitors = [
     { name: "Amazon", price: 2899, shipping: "Free", rating: 4.5, bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-100" },
     { name: "Flipkart", price: 2750, shipping: "₹40", rating: 4.3, bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-100" },
     { name: "Myntra", price: 2999, shipping: "Free", rating: 4.6, bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-100" },
  ];

  return (
    <div className="w-full max-w-3xl bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden font-sans">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
              <div className="p-2 bg-white border border-slate-200 rounded-lg shadow-sm">
                <TrendingDown className="h-4 w-4 text-slate-700" />
              </div>
              <div>
                  <h3 className="font-semibold text-slate-800 text-sm">Market Analysis</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Synced just now</p>
              </div>
          </div>
          <button className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 bg-white border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-lg transition-all shadow-sm">
              <RefreshCw className="h-3 w-3" />
              <span>Refresh</span>
          </button>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="grid gap-3">
             {/* My Product */}
             <div className="flex items-center justify-between p-4 bg-emerald-50/30 border border-emerald-100 rounded-lg group">
                 <div className="flex items-center gap-4">
                     <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center text-lg border border-emerald-100 shadow-sm">
                         🛍️
                     </div>
                     <div>
                         <p className="font-semibold text-slate-900 text-sm">Your Store</p>
                         <div className="flex items-center gap-1">
                             <Check className="h-3 w-3 text-emerald-600" />
                             <p className="text-[11px] text-emerald-700 font-medium">Best Price</p>
                         </div>
                     </div>
                 </div>
                 <div className="text-right">
                     <p className="font-bold text-slate-900 text-lg">₹{myPrice.toLocaleString()}</p>
                 </div>
             </div>

             {/* Competitors */}
             {competitors.map((comp, i) => {
                 const diff = Math.round(((comp.price - myPrice) / myPrice) * 100);
                 return (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center justify-between p-4 bg-white hover:bg-slate-50 border border-slate-100 rounded-lg transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center text-sm font-bold border select-none", comp.bg, comp.text, comp.border)}>
                                {comp.name[0]}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="font-medium text-slate-700 text-sm">{comp.name}</p>
                                    <ArrowUpRight className="h-3 w-3 text-slate-300" />
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-medium text-slate-500">⭐ {comp.rating}</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-semibold text-slate-600 text-sm">₹{comp.price.toLocaleString()}</p>
                            <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                                +{diff}%
                            </p>
                        </div>
                    </motion.div>
                 );
             })}
        </div>
      </div>
    </div>
  );
}
