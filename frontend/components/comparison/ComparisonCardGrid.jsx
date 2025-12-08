
import React from 'react';
import { ExternalLink, Star, TrendingDown, Package, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';;

// Utility for currency formatting
const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
};

const getSearchUrl = (platform, productName) => {
    const query = encodeURIComponent(productName);
    switch (platform.toLowerCase()) {
        case 'amazon':
            return `https://www.amazon.com/s?k=${query}`;
        case 'flipkart':
            return `https://www.flipkart.com/search?q=${query}`;
        case 'meesho':
            return `https://www.meesho.com/search?q=${query}`;
        case 'myntra':
            return `https://www.myntra.com/search?text=${query}`;
        default:
            return '#';
    }
};

// Single Marketplace Card Component
const MarketplaceCard = ({ platform, data, isBestPrice, bestPriceDiff, productName }) => {
    const item = data?.items?.[0];

    // Note: User requested to show search links even if item exists or maybe specifically for it.
    // The previous logic hid the card if !item. 
    // If we want to support "Search for it" even if not found, we should remove the early return.
    // BUT the user said "change in the View Offer". The View Offer button is inside the card.
    // The card is only rendered if `item` exists (lines 21-27 handle !item case).
    // So we will stick to modifying the "View Offer" link when the card is visible.
    
    if (!item) return (
        <div className="flex flex-col items-center justify-center p-6 bg-slate-50/40 rounded-xl border border-dashed border-slate-200 h-full min-h-[180px]">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">{platform}</span>
            <AlertCircle className="h-5 w-5 text-slate-300 mb-2" />
            <span className="text-sm font-medium text-slate-400">Not Listed</span>
        </div>
    );

    const searchUrl = getSearchUrl(platform, productName);

    return (
        <div className={cn(
            "relative flex flex-col p-6 rounded-xl border transition-all duration-300 h-full bg-white group hover:shadow-xl hover:shadow-slate-200/50",
            isBestPrice 
                ? "border-emerald-200 ring-1 ring-emerald-100 shadow-emerald-100/50 z-10" 
                : "border-slate-100 hover:border-slate-300"
        )}>
            {isBestPrice && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" /> Best Deal
                </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <span className="capitalize text-sm font-bold text-slate-800 tracking-tight">{platform}</span>
                {item.rating && (
                    <div className="flex items-center text-[10px] font-bold bg-slate-50 text-slate-600 px-2 py-1 rounded-md border border-slate-100">
                        <Star className="h-3 w-3 mr-1 fill-amber-400 text-amber-400" /> {item.rating}
                    </div>
                )}
            </div>

            {/* Price section - Typography Upgrade */}
            <div className="space-y-4 mb-6">
                <div>
                     <div className="flex items-baseline gap-2">
                        <span className={cn("text-3xl font-extrabold tracking-tight", isBestPrice ? "text-emerald-600" : "text-slate-900")}>
                            {formatCurrency(item.price.value)}
                        </span>
                     </div>
                     {isBestPrice && bestPriceDiff > 0 && (
                         <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                             <TrendingDown className="h-3 w-3" /> Save {formatCurrency(bestPriceDiff)}
                         </p>
                     )}
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-50">
                    <div className="flex justify-between text-xs text-slate-500">
                        <span>Delivery</span>
                        <span className="font-semibold text-slate-700">{item.delivery_time_estimate || "3-5 days"}</span>
                    </div>
                    {item.seller_name && (
                         <div className="flex justify-between text-xs text-slate-500">
                            <span>Seller</span>
                            <span className="font-semibold text-slate-700 truncate max-w-[100px]" title={item.seller_name}>{item.seller_name}</span>
                        </div>
                    )}
                </div>
            </div>

            <a href={searchUrl} target="_blank" rel="noopener noreferrer" className="mt-auto block">
                <Button size="sm" variant={isBestPrice ? "default" : "outline"} 
                    className={cn(
                        "w-full gap-2 text-xs font-semibold h-10 shadow-sm transition-all",
                        isBestPrice 
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white border-transparent shadow-emerald-200" 
                            : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                    )}
                >
                    View Offer <ExternalLink className="h-3 w-3 opacity-70" />
                </Button>
            </a>
        </div>
    );
};

export function ComparisonCardGrid({ data, loading }) {
  if (loading) {
      return (
          <div className="grid gap-10">
              {[1, 2].map(i => (
                  <div key={i} className="animate-pulse space-y-4">
                      <div className="h-8 bg-slate-200 rounded w-1/4"></div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {[1,2,3,4].map(j => <div key={j} className="h-64 bg-slate-100 rounded-xl"></div>)}
                      </div>
                  </div>
              ))}
          </div>
      );
  }

  if (!data || data.length === 0) return null;

  return (
    <div className="space-y-16">
      {data.map((productGroup, idx) => {
        const { fynd_details, competitor_details, best_price, best_platform } = productGroup;
        
        let prices = [];
        Object.values(competitor_details).forEach(d => {
            if(d.items?.[0]?.price?.value) prices.push(d.items[0].price.value);
        });
        prices.sort((a,b) => a - b);
        const savings = prices.length > 1 ? prices[1] - prices[0] : 0;

        return (
          <div key={idx} className="group bg-slate-50/50 p-6 rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-500">
             {/* Product Header */}
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                 <div className="flex items-center gap-5">
                     <div className="h-20 w-20 bg-white rounded-2xl border border-slate-200 p-3 shadow-sm flex items-center justify-center overflow-hidden">
                         {fynd_details.display_image ? (
                             <img src={fynd_details.display_image} alt={fynd_details.name} className="h-full w-full object-contain mix-blend-multiply" />
                         ) : (
                             <Package className="h-8 w-8 text-slate-300" /> 
                         )}
                     </div>
                     <div>
                         <h2 className="text-2xl font-bold text-slate-900 tracking-tight leading-none mb-2">{fynd_details.name}</h2>
                         <div className="flex flex-wrap items-center gap-3">
                             {fynd_details.slug && (
                                 <span className="text-[10px] font-mono font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                                     {fynd_details.slug}
                                 </span>
                             )}
                             {/* Your Price Badge */}
                             <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full shadow-sm">
                                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">My Price</span>
                                <span className="text-sm font-bold text-indigo-700">
                                    {fynd_details.price?.effective?.min ? formatCurrency(fynd_details.price.effective.min) : 'N/A'}
                                </span>
                             </div>
                         </div>
                     </div>
                 </div>
                 
                 {/* Savings Stat */}
                 {best_price && savings > 0 && (
                     <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-xl border border-slate-100 shadow-sm">
                         <div className="text-right">
                             <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Max Savings</div>
                             <div className="text-2xl font-black text-slate-800 tracking-tight">{formatCurrency(savings)}</div>
                         </div>
                         <div className="h-10 w-10 bg-emerald-100/50 rounded-full flex items-center justify-center text-emerald-600">
                             <TrendingDown className="h-5 w-5" />
                         </div>
                     </div>
                 )}
             </div>

             {/* Cards Grid */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {['amazon', 'flipkart', 'myntra', 'meesho'].map((platform) => (
                     <MarketplaceCard 
                        key={platform} 
                        platform={platform} 
                        data={competitor_details[platform]} 
                        isBestPrice={best_platform === platform}
                        bestPriceDiff={savings}
                        productName={fynd_details.name}
                     />
                 ))}
             </div>
          </div>
        );
      })}
    </div>
  );
}
