
import React, { useState } from 'react';
import { LayoutGrid, Table, RefreshCw, ArrowLeft, Download, Filter } from 'lucide-react';
import { Button } from '../ui/Button';
import { ComparisonCardGrid } from './ComparisonCardGrid';
import { ComparisonTable } from './ComparisonTable';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';;

export function ComparisonView({ data, loading, onRefresh }) {
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'
  const navigate = useNavigate();

  const productCount = data?.length || 0;
  // Unique marketplaces count (naive check from first item)
  const marketplaceCount = data?.[0]?.competitor_details ? Object.keys(data[0].competitor_details).length : 4;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Premium Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200/60">
        <div className="space-y-2">
            <div className="flex items-center gap-2 mb-1">
                 <button onClick={() => navigate(-1)} className="group flex items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors">
                    <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-xs font-medium uppercase tracking-wide">Back</span>
                 </button>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                Product <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Comparison</span>
            </h1>
            <p className="text-slate-500 font-medium max-w-2xl text-lg leading-relaxed">
                Real-time price analysis for <span className="font-bold text-slate-700">{productCount} products</span> across <span className="font-bold text-slate-700">{marketplaceCount} marketplaces</span>.
            </p>
        </div>

        <div className="flex items-center gap-3">
             {/* View Toggles */}
             <div className="flex bg-slate-100/80 p-1 rounded-lg border border-slate-200/60 shadow-inner">
                <button
                    onClick={() => setViewMode('cards')}
                    className={cn(
                        "p-2 rounded-md transition-all duration-200 flex items-center gap-2 text-sm font-medium",
                        viewMode === 'cards' 
                            ? "bg-white text-indigo-600 shadow-sm ring-1 ring-black/5" 
                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                    )}
                    aria-label="Card View"
                >
                    <LayoutGrid className="h-4 w-4" />
                    <span className="hidden sm:inline">Cards</span>
                </button>
                <button
                    onClick={() => setViewMode('table')}
                    className={cn(
                        "p-2 rounded-md transition-all duration-200 flex items-center gap-2 text-sm font-medium",
                        viewMode === 'table' 
                            ? "bg-white text-indigo-600 shadow-sm ring-1 ring-black/5" 
                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                    )}
                    aria-label="Table View"
                >
                    <Table className="h-4 w-4" />
                    <span className="hidden sm:inline">Table</span>
                </button>
            </div>

            {/* Actions Separator */}
            <div className="h-8 w-px bg-slate-200 mx-1 hidden md:block"></div>

             {/* Action Buttons */}
            <Button variant="ghost" size="sm" className="hidden md:flex gap-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100">
                <Filter className="h-4 w-4" /> Filter
            </Button>
            <Button variant="ghost" size="sm" className="hidden md:flex gap-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100">
                <Download className="h-4 w-4" /> Export
            </Button>

            <Button 
                onClick={onRefresh} 
                disabled={loading}
                variant="outline"
                size="sm"
                className={cn(
                    "gap-2 min-w-[100px] border-slate-200 shadow-sm bg-white hover:bg-slate-50 hover:text-indigo-600 transition-all", 
                    loading && "text-indigo-600 border-indigo-100 bg-indigo-50/50"
                )}
            >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                {loading ? 'Syncing...' : 'Refresh'}
            </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative min-h-[500px]">
          {viewMode === 'cards' ? (
            <ComparisonCardGrid data={data} loading={loading} />
          ) : (
            <ComparisonTable data={data} loading={loading} />
          )}
      </div>
    </div>
  );
}
