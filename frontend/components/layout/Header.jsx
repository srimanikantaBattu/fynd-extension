
import React from 'react';
import { Bell, Search, Menu, UserCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';;

export function Header({ className }) {
  return (
    <header className={cn("sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-slate-200/60 support-[backdrop-filter]:bg-white/60", className)}>
      <div className="flex h-16 items-center px-4 md:px-8 max-w-[1600px] mx-auto">
        <div className="mr-8 hidden md:flex items-center">
            {/* Breadcrumb-like title or context */}
             <span className="font-semibold text-slate-800 tracking-tight text-sm">Fynd Admin</span>
             <span className="mx-2 text-slate-300">/</span>
             <span className="text-slate-500 text-sm">Compare Products</span>
        </div>
        
         <Button variant="ghost" className="mr-2 px-0 text-base hover:bg-transparent focus:ring-0 md:hidden text-slate-500">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>

        <div className="flex flex-1 items-center justify-between space-x-4 md:justify-end">
          <div className="w-full max-w-md flex-1 md:w-auto md:flex-none">
            <div className="relative group">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="search"
                  placeholder="Search products, brands..."
                  className="flex h-9 w-full rounded-md border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-4 text-sm outline-none placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all md:w-[280px] lg:w-[320px] shadow-sm"
                />
            </div>
          </div>
          <nav className="flex items-center space-x-1">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500 hover:text-slate-900 hover:bg-slate-100/50 rounded-full transition-colors relative">
                <Bell className="h-4 w-4" />
                <span className="absolute top-2 right-2.5 h-1.5 w-1.5 rounded-full bg-indigo-500 ring-2 ring-white"></span>
            </Button>
            <div className="pl-2 border-l border-slate-200 ml-2">
                 <Button variant="ghost" size="sm" className="h-9 gap-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 rounded-full px-2">
                    <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] text-white font-bold ring-2 ring-white shadow-sm">
                        JS
                    </div>
                    <span className="hidden sm:inline-block text-sm font-medium">Sri Manikanta Battu</span>
                </Button>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
