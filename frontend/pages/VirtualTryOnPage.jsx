
import React from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { VirtualTryOn } from '../components/dashboard/VirtualTryOn';

export default function VirtualTryOnPage() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar className="hidden md:block" />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 md:p-10 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Virtual Try-On Studio</h2>
          </div>
          <VirtualTryOn />
        </main>
      </div>
    </div>
  );
}
