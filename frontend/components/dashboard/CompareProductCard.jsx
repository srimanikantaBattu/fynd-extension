
import React from 'react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { ExternalLink, Star, TrendingDown, ChevronRight, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';


// Simple Badge component inline for now or extract later
const StatusBadge = ({ children, className, variant = 'default' }) => {
    const variants = {
        default: "bg-slate-100 text-slate-700",
        success: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
        warning: "bg-amber-50 text-amber-700 ring-amber-600/20",
        info: "bg-indigo-50 text-indigo-700 ring-indigo-600/20"
    };
    return (
        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ring-1 ring-inset", variants[variant], className)}>
            {children}
        </span>
    );
};

export function CompareProductCard({ product }) {
    
    const getLowestPrice = (marketplaces) => {
        let minPrice = Infinity;
        let platform = '';
        Object.entries(marketplaces).forEach(([key, value]) => {
            if(value.items && value.items.length > 0) {
                const price = value.items[0].price.value;
                if(price < minPrice) {
                    minPrice = price;
                    platform = key;
                }
            }
        });
        return { minPrice, platform };
    };

    const { minPrice, platform } = getLowestPrice(product.marketplaces);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <Card className="group overflow-hidden border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 ease-out bg-white rounded-2xl ring-1 ring-slate-900/5">
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-gray-50/50 to-white">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                             <StatusBadge variant="info" className="uppercase tracking-wider font-semibold text-[10px]">
                                {product.slug?.split('_')[0] || 'Product'}
                             </StatusBadge>
                             {minPrice !== Infinity && (
                                 <StatusBadge variant="success">
                                     Best Deal on <span className="capitalize ml-1 font-bold">{platform}</span>
                                 </StatusBadge>
                             )}
                        </div>
                        <h3 className="text-lg md:text-xl font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">
                            {product.name}
                        </h3>
                    </div>
                    {/* Potential action buttons here */}
                </div>
            </div>
            
            <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                    {['amazon', 'flipkart', 'myntra', 'meesho'].map((marketplace) => {
                        const marketData = product.marketplaces[marketplace];
                        const item = marketData?.items?.[0];

                        // Empty State for Marketplace
                        if (!item) return (
                             <div key={marketplace} className="p-6 flex flex-col items-center justify-center text-center h-full min-h-[200px] bg-slate-50/30">
                                 <span className="text-slate-300 mb-2 font-semibold capitalize">{marketplace}</span>
                                 <AlertCircle className="w-6 h-6 text-slate-200" />
                                 <span className="text-xs text-slate-400 mt-2">Not available</span>
                             </div>
                        );

                        const isLowest = item.price.value === minPrice;

                        return (
                            <div key={marketplace} className={cn("relative p-6 transition-colors hover:bg-slate-50/60 group/market flex flex-col h-full", isLowest && "bg-emerald-50/30")}>
                                {isLowest && (
                                    <div className="absolute top-0 inset-x-0 h-1 bg-emerald-500 shadow-[0_1px_6px_rgba(16,185,129,0.4)]" />
                                )}
                                
                                <div className="flex items-center justify-between mb-4">
                                     <span className="capitalize text-sm font-semibold text-slate-500 group-hover/market:text-slate-800 transition-colors">
                                         {marketplace}
                                     </span>
                                     {isLowest && (
                                         <span className="flex items-center text-[10px] font-bold text-emerald-600 bg-white shadow-sm ring-1 ring-emerald-100 px-2 py-0.5 rounded-full">
                                             <TrendingDown className="w-3 h-3 mr-1" /> Lowest
                                         </span>
                                     )}
                                </div>

                                <div className="aspect-[4/3] w-full bg-white rounded-xl mb-4 overflow-hidden border border-slate-100 p-3 flex items-center justify-center group-hover/market:scale-[1.02] transition-transform duration-300 shadow-sm">
                                    <img src={item.image_url} alt={marketplace} className="max-h-full max-w-full object-contain mix-blend-multiply" />
                                </div>

                                <div className="mt-auto">
                                    <div className="mb-1">
                                         <h4 className="text-sm font-medium text-slate-700 line-clamp-2 min-h-[40px] leading-snug" title={item.listing_title}>
                                             {item.listing_title}
                                         </h4>
                                    </div>
                                    
                                    <div className="flex items-end justify-between gap-2 mt-4">
                                        <div>
                                            <div className="flex items-center gap-1.5 mb-1">
                                                 <span className={cn("text-lg font-bold tracking-tight", isLowest ? "text-emerald-700" : "text-slate-900")}>
                                                     {formatCurrency(item.price.value)}
                                                 </span>
                                            </div>
                                            {item.rating && (
                                                <div className="flex items-center text-xs font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded w-fit">
                                                    <Star className="w-3 h-3 mr-1 fill-current" />
                                                    {item.rating}
                                                </div>
                                            )}
                                        </div>
                                        
                                        <a href={item.product_url} target="_blank" rel="noopener noreferrer" className="opacity-0 group-hover/market:opacity-100 transition-opacity">
                                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700">
                                                <ExternalLink className="w-4 h-4" />
                                            </Button>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
            {/* Optional Footer Details */}
            {/* <div className="bg-slate-50 border-t border-slate-100 p-3 text-center text-xs text-slate-400 font-medium">
                Last updated just now
            </div> */}
        </Card>
    );
}
