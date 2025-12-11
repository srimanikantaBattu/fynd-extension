
import React from 'react';
import { Home, BarChart3, Users, Settings, LogOut, Package, ShoppingCart, Camera, Layers } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { useNavigate, useLocation, useParams } from 'react-router-dom';

const sidebarItems = [
  { icon: Home, label: 'Compare', href: '/dashboard' },
  { icon: Camera, label: 'Generate Model', href: '/dashboard/generate-model' },
  { icon: BarChart3, label: 'Post', href: '/dashboard/post' },
  { icon: ShoppingCart, label: 'Set Price', href: '/dashboard/set-price' },
  { icon: Layers, label: 'Bundles', href: '/dashboard/bundles' },
  { icon: Users, label: 'Customers', href: '/dashboard/customers' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
];

export function Sidebar({ className }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { company_id, application_id } = useParams();
  const activePath = location.pathname;

  // Helper to construct context-aware URLs
  const getContextUrl = (path) => {
      // Remove /dashboard prefix if present to handle it cleanly
      const cleanPath = path.replace('/dashboard', '');
      
      // Base URL construction
      let baseUrl = '';
      if (application_id && company_id) {
          baseUrl = `/company/${company_id}/application/${application_id}`;
      } else if (company_id) {
          baseUrl = `/company/${company_id}`;
      } else {
          // Fallback to simpler routes if no context (though typically we should have it)
          return path;
      }
      
      // Combine base with path (e.g. /post)
      // Special case: if path is /dashboard (root comparison view), it maps to the baseUrl itself
      if (cleanPath === '') return baseUrl;
      
      return `${baseUrl}${cleanPath}`;
  };

  return (
    <div className={cn("pb-12 min-h-screen w-64 bg-slate-50/50 border-r border-slate-200/60 backdrop-blur-xl flex flex-col", className)}>
      <div className="space-y-6 py-6 px-4">
        <div className="flex items-center gap-3 px-2 pb-4 border-b border-slate-100/60 mx-2">
           <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
               <span className="text-white font-black text-xl tracking-tighter">F</span>
           </div>
           <div className="flex flex-col">
               <h2 className="text-lg font-bold tracking-tight text-slate-900 leading-none">
                 Fynd
               </h2>
               <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest mt-0.5">Admin</span>
           </div>
        </div>
        
        <div className="space-y-1">
          {sidebarItems.map((item) => {
             const targetUrl = getContextUrl(item.href);
             // Active check needs to be flexible enough to handle the dynamic URL match
             // Simplest is to check if current pathname ends with the item's distinct part
             // or exact match for root.
             const isRoot = item.href === '/dashboard';
             const isActive = isRoot 
                ? (activePath === targetUrl || activePath.endsWith(company_id ? `company/${company_id}` : '/dashboard'))
                : activePath.includes(item.href.replace('/dashboard', ''));

             return (
              <Button
                key={item.href}
                variant="ghost"
                className={cn(
                  "w-full justify-start text-lg font-medium h-10 px-3 p-7 transition-all duration-200 rounded-lg group relative overflow-hidden",
                  isActive
                    ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-100" 
                    : "text-slate-500 hover:text-slate-900 hover:bg-white/60"
                )}
                onClick={() => navigate(targetUrl)}
              >
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-indigo-600 rounded-r-full" />}
                <item.icon className={cn("mr-3 h-5 w-5 transition-colors", isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600")} />
                {item.label}
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  );
}
