
import React from 'react';
import { 
    Check, X, ExternalLink, Star, Truck, Store, Link as LinkIcon, 
    TrendingDown, Package, Info, ShieldCheck, AlertCircle, ShoppingBag
} from 'lucide-react';
import { cn } from '../../lib/utils';;

const formatCurrency = (amount) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
};

// Platform Icons/Logos Component (Mock placeholder for real logos)
const PlatformBadge = ({ platform }) => {
    const colors = {
        amazon: "bg-orange-50 text-orange-700 border-orange-100",
        flipkart: "bg-blue-50 text-blue-700 border-blue-100",
        myntra: "bg-pink-50 text-pink-700 border-pink-100",
        meesho: "bg-purple-50 text-purple-700 border-purple-100",
        default: "bg-slate-50 text-slate-700 border-slate-100"
    };
    const style = colors[platform] || colors.default;
    
    return (
        <span className={cn("px-2 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider", style)}>
            {platform}
        </span>
    );
};

export function ComparisonTable({ data, loading }) {
  if (loading) {
      // Skeleton Loading State
      return (
        <div className="space-y-6">
             {[1, 2].map(i => (
                 <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm p-6 space-y-4">
                     <div className="h-8 bg-slate-100 rounded w-1/3 animate-pulse"></div>
                     <div className="space-y-2">
                         {[1,2,3,4].map(j => <div key={j} className="h-12 bg-slate-50 rounded animate-pulse"></div>)}
                     </div>
                 </div>
             ))}
        </div>
      );
  }
  
  if (!data || data.length === 0) return (
      <div className="text-center py-20 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
          <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900">No products found</h3>
          <p className="text-slate-500">Try adjusting your filters or adding products.</p>
      </div>
  );

  const platforms = ['amazon', 'flipkart', 'myntra', 'meesho'];

  return (
    <div className="space-y-12">
      {data.map((productGroup, idx) => {
         const { fynd_details, competitor_details, best_price } = productGroup;
         
         // Calculate savings (Best competitor vs 2nd best, or My Price vs Best Competitor if applicable)
         // For this logic, we keep it simple: Compare Lowest vs 2nd Lowest market price
         let prices = [];
         Object.values(competitor_details).forEach(d => {
             if(d.items?.[0]?.price?.value) prices.push(d.items[0].price.value);
         });
         prices.sort((a,b) => a - b);
         const savings = prices.length > 1 ? prices[1] - prices[0] : 0;

         return (
             <div key={idx} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
                 {/* Premium Header Row */}
                 <div className="p-6 bg-white border-b border-slate-100 flex flex-col md:flex-row md:items-center gap-4">
                     <div className="h-14 w-14 bg-slate-50 rounded-lg border border-slate-100 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
                          {fynd_details.display_image ? (
                             <img src={fynd_details.display_image} alt={fynd_details.name} className="h-full w-full object-contain mix-blend-multiply" />
                         ) : (
                             <Package className="h-6 w-6 text-slate-300" />
                         )}
                     </div>
                     <div>
                         <div className="flex items-center gap-2 mb-1">
                             <h3 className="font-bold text-lg text-slate-900 leading-tight">{fynd_details.name}</h3>
                             {fynd_details.slug && (
                                 <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-500 border border-slate-200">
                                     {fynd_details.slug}
                                 </span>
                             )}
                         </div>
                         <div className="flex items-center gap-4 text-xs text-slate-500">
                             <span className="flex items-center gap-1"><Info className="h-3 w-3" /> Real-time pricing</span>
                             {best_price && (
                                 <span className="flex items-center gap-1 text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
                                     <TrendingDown className="h-3 w-3" /> Lowest market: {formatCurrency(best_price)}
                                 </span>
                             )}
                         </div>
                     </div>
                 </div>
                 
                 <div className="overflow-x-auto scroller-hide">
                     <table className="w-full text-sm text-left">
                         <thead>
                             <tr className="bg-slate-50/50 border-b border-slate-200">
                                 <th className="px-6 py-4 font-semibold text-slate-500 w-[240px] sticky left-0 bg-slate-50 border-r border-slate-200/60 z-10">
                                     Comparison Points
                                 </th>
                                 {/* My Store Column */}
                                 <th className="px-6 py-4 min-w-[200px] border-r border-indigo-100 bg-indigo-50/10">
                                     <div className="flex items-center gap-2">
                                         <div className="bg-indigo-100 p-1 rounded">
                                             <Store className="h-4 w-4 text-indigo-600" />
                                         </div>
                                         <span className="font-bold text-indigo-900">My Store</span>
                                     </div>
                                 </th>
                                 {/* Competitor Columns */}
                                 {platforms.map(p => (
                                     <th key={p} className="px-6 py-4 min-w-[200px]">
                                         <div className="flex items-center gap-2">
                                             <PlatformBadge platform={p} />
                                         </div>
                                     </th>
                                 ))}
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100">
                             {/* Price Row */}
                             <tr className="group hover:bg-slate-50/30 transition-colors">
                                 <td className="px-6 py-4 font-medium text-slate-600 sticky left-0 bg-white group-hover:bg-slate-50/30 border-r border-slate-100 z-10">
                                     <div className="flex items-center gap-2">
                                         <ShoppingBag className="h-4 w-4 text-slate-400" /> Price
                                     </div>
                                 </td>
                                 
                                 {/* My Store Price */}
                                 <td className="px-6 py-5 bg-indigo-50/10 border-r border-indigo-50 relative">
                                    <div className="flex flex-col">
                                        <span className={cn("text-xl font-bold tracking-tight", 
                                            fynd_details.price?.effective?.min === best_price ? "text-emerald-600" : "text-indigo-700"
                                        )}>
                                            {fynd_details.price?.effective?.min ? formatCurrency(fynd_details.price.effective.min) : 'N/A'}
                                        </span>
                                        <span className="text-[10px] uppercase font-semibold text-indigo-400 mt-1">Current Price</span>
                                    </div>
                                    {/* Highlight if My Store is best price */}
                                    {fynd_details.price?.effective?.min === best_price && (
                                        <div className="absolute top-2 right-2 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                            BEST DEAL
                                        </div>
                                    )}
                                 </td>

                                 {/* Competitor Prices */}
                                 {platforms.map(p => {
                                     const item = competitor_details[p]?.items?.[0];
                                     const price = item?.price?.value;
                                     const isBest = price === best_price && !!price;
                                     
                                     return (
                                         <td key={p} className={cn(
                                             "px-6 py-5 transition-all relative", 
                                             isBest ? "bg-emerald-50/40 shadow-inner" : ""
                                         )}>
                                             {item ? (
                                                 <div className="flex flex-col">
                                                     <div className="flex items-baseline gap-2">
                                                         <span className={cn("font-bold text-lg", isBest ? "text-emerald-700" : "text-slate-700")}>
                                                             {formatCurrency(price)}
                                                         </span>
                                                     </div>
                                                     {isBest ? (
                                                         <div className="flex flex-col mt-1">
                                                             <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase tracking-wide">
                                                                 <Check className="h-3 w-3" /> Lowest Price
                                                             </span>
                                                             {savings > 0 && (
                                                                 <span className="text-[10px] text-emerald-600/80 font-medium">
                                                                     Save {formatCurrency(savings)}
                                                                 </span>
                                                             )}
                                                         </div>
                                                     ) : (
                                                         price > best_price && (
                                                             <span className="text-[10px] text-rose-500 font-medium mt-1">
                                                                 +{formatCurrency(price - best_price)} more
                                                             </span>
                                                         )
                                                     )}
                                                 </div>
                                             ) : (
                                                 <span className="text-slate-300 text-sm font-light italic">Not listed</span>
                                             )}
                                             
                                             {/* Vertical Highlight Bar for Best Price */}
                                             {isBest && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-emerald-500"></div>}
                                         </td>
                                     );
                                 })}
                             </tr>

                             {/* Delivery Row */}
                             <tr className="group hover:bg-slate-50/30 transition-colors">
                                 <td className="px-6 py-4 font-medium text-slate-600 sticky left-0 bg-white group-hover:bg-slate-50/30 border-r border-slate-100 z-10">
                                     <div className="flex items-center gap-2">
                                         <Truck className="h-4 w-4 text-slate-400" /> Delivery
                                     </div>
                                 </td>
                                 <td className="px-6 py-4 text-slate-700 bg-indigo-50/10 border-r border-indigo-50 font-medium">Standard</td>
                                 {platforms.map(p => {
                                     const item = competitor_details[p]?.items?.[0];
                                     return (
                                         <td key={p} className="px-6 py-4 text-slate-700">
                                             {item?.delivery_time_estimate || '-'}
                                         </td>
                                     );
                                 })}
                             </tr>
                            
                             {/* Rating Row */}
                             <tr className="group hover:bg-slate-50/30 transition-colors">
                                 <td className="px-6 py-4 font-medium text-slate-600 sticky left-0 bg-white group-hover:bg-slate-50/30 border-r border-slate-100 z-10">
                                     <div className="flex items-center gap-2">
                                         <Star className="h-4 w-4 text-slate-400" /> Rating
                                     </div>
                                 </td>
                                 <td className="px-6 py-4 bg-indigo-50/10 border-r border-indigo-50 text-slate-400 text-xs">-</td>
                                 {platforms.map(p => {
                                     const item = competitor_details[p]?.items?.[0];
                                     return (
                                         <td key={p} className="px-6 py-4">
                                             {item?.rating ? (
                                                 <div className="flex items-center gap-1.5 bg-amber-50 w-fit px-2 py-0.5 rounded border border-amber-100">
                                                     <Star className="h-3 w-3 text-amber-500 fill-current" />
                                                     <span className="font-bold text-amber-700 text-xs">{item.rating}</span>
                                                     <span className="text-[10px] text-amber-600/70">({item.rating_count || 0})</span>
                                                 </div>
                                             ) : '-'}
                                         </td>
                                     );
                                 })}
                             </tr>

                             {/* Link Row */}
                             <tr className="group hover:bg-slate-50/30 transition-colors">
                                 <td className="px-6 py-4 font-medium text-slate-600 sticky left-0 bg-white group-hover:bg-slate-50/30 border-r border-slate-100 z-10">
                                     <div className="flex items-center gap-2">
                                         <LinkIcon className="h-4 w-4 text-slate-400" /> Product Link
                                     </div>
                                 </td>
                                 <td className="px-6 py-4 bg-indigo-50/10 border-r border-indigo-50">
                                     <a href={`https://${fynd_details.slug}.fynd.com`} target="_blank" rel="noopener noreferrer" 
                                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline">
                                         Visit Store <ExternalLink className="h-3 w-3" />
                                     </a>
                                 </td>
                                 {platforms.map(p => {
                                     const item = competitor_details[p]?.items?.[0];
                                     return (
                                         <td key={p} className="px-6 py-4">
                                             {item ? (
                                                 <a href={item.product_url} target="_blank" rel="noopener noreferrer" 
                                                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors">
                                                     View on {p} <ExternalLink className="h-3 w-3" />
                                                 </a>
                                             ) : <span className="text-slate-300">-</span>}
                                         </td>
                                     );
                                 })}
                             </tr>
                         </tbody>
                     </table>
                 </div>
             </div>
         );
      })}
    </div>
  );
}
