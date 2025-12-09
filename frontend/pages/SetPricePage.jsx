import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { Send, Sparkles, RefreshCcw, TrendingUp, BarChart3, LineChart, Search, ArrowRight } from 'lucide-react'; // Updated icons
import axios from 'axios';
import urlJoin from "url-join";
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { PriceComparisonCard } from '../components/pricing/PriceComparisonCard'; // Import new component

const EXAMPLE_MAIN_URL = window.location.origin;

export default function SetPricePage() {
  const { company_id } = useParams();
  const [messages, setMessages] = useState([]); 
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { 
        role: 'user', 
        text: input,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const config = company_id ? { headers: { "x-company-id": company_id } } : {};
      const response = await axios.post(urlJoin(EXAMPLE_MAIN_URL, '/api/products/chat-rag'), {
        query: userMessage.text
      }, config);

      const aiMessage = {
        role: 'ai',
        text: response.data.answer || "I'm sorry, I couldn't process that request.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = {
        role: 'ai',
        text: `**Error**: ${error.response?.data?.message || "Something went wrong. Please try again."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#FAFAFA] font-sans text-slate-900 overflow-hidden selection:bg-indigo-100 selection:text-indigo-900 relative">
      {/* Background - Technical Grid Pattern (Stripe/Linear Style) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-40">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-indigo-500 opacity-20 blur-[100px]"></div>
      </div>

      {/* Sidebar background logic is handled by the component itself, we just place it */}
      <Sidebar className="hidden md:block w-64 fixed inset-y-0 z-50 border-r border-slate-200/60 bg-white/80 backdrop-blur-lg" />
      
      <div className="flex-1 flex flex-col md:pl-64 h-full relative">
        <Header className="bg-white/80 shrink-0 z-40 backdrop-blur-md sticky top-0 border-b border-slate-200/50" /> 
        
        <main className="flex-1 flex flex-col h-full min-h-0 relative z-10 max-w-5xl mx-auto w-full">
            
            {/* Chat Container */}
            <div className="flex-1 overflow-hidden flex flex-col relative w-full h-full">
                
                {/* Minimal Header - No Specific branding, just clean status */}
                {messages.length > 0 && (
                    <div className="px-8 py-4 flex items-center justify-between shrink-0 z-20 bg-white/50 backdrop-blur-sm sticky top-0">
                        <div className="flex items-center gap-2 text-slate-400">
                             <Sparkles className="h-4 w-4" />
                             <span className="text-xs font-medium uppercase tracking-widest">Pricing Assistant</span>
                        </div>
                    </div>
                )}

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 scroll-smooth custom-scrollbar min-h-0">
                    
                    {/* Welcome / Empty State - PREMIUM MINIMAL */}
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500 max-w-5xl mx-auto relative z-10">
                             
                             {/* Hero Text - Professional & Sharp */}
                             <div className="mb-12 relative cursor-default">
                                <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4">
                                   Hello, User.
                                </h2>
                                <p className="text-slate-500 text-lg font-normal py-1">
                                    Optimize your pricing strategy with real-time market data.
                                </p>
                             </div>

                             {/* MAIN CENTERED INPUT - Clean Stripe-like Pill */}
                             <div className="w-full max-w-2xl relative mb-16 px-2">
                                <div className="relative flex items-center bg-white shadow-[0_4px_20px_-2px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.12)] rounded-full border border-slate-200 transition-all duration-300 group ring-4 ring-transparent focus-within:ring-slate-100">
                                    <div className="pl-6 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                        <Search className="h-5 w-5" />
                                    </div>
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Ask a question..."
                                        className="w-full h-14 bg-transparent text-slate-800 placeholder-slate-400 rounded-full px-4 pr-16 focus:outline-none text-[16px] font-medium"
                                        autoFocus
                                        disabled={loading}
                                    />
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                        <button 
                                            onClick={handleSend} 
                                            disabled={loading || !input.trim()}
                                            className={cn(
                                                "h-10 w-10 rounded-full flex items-center justify-center transition-all duration-200",
                                                input.trim() 
                                                    ? "bg-indigo-600 text-white shadow-md hover:bg-indigo-700 hover:shadow-lg" 
                                                    : "bg-slate-50 text-slate-300"
                                            )}
                                        >
                                            <ArrowRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                             </div>

                             {/* PREMIUM CARDS - Stripe / Linear Style */}
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl px-2">
                                  {[
                                      { icon: BarChart3, title: "Compare", sub: "Competitors", bg: "bg-blue-50", text: "text-blue-600", border: "hover:border-blue-200" },
                                      { icon: TrendingUp, title: "Optimize", sub: "Margins", bg: "bg-emerald-50", text: "text-emerald-600", border: "hover:border-emerald-200" },
                                      { icon: LineChart, title: "Forecast", sub: "Demand", bg: "bg-violet-50", text: "text-violet-600", border: "hover:border-violet-200" },
                                      { icon: Sparkles, title: "Create", sub: "Strategy", bg: "bg-amber-50", text: "text-amber-600", border: "hover:border-amber-200" }
                                  ].map((item, i) => (
                                      <button 
                                          key={i}
                                          onClick={() => setInput(`Help me ${item.title.toLowerCase()} ${item.sub.toLowerCase()}`)}
                                          className={cn(
                                              "flex flex-col items-start text-left p-5 rounded-xl border border-slate-100 bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
                                              item.border
                                          )}
                                      > 
                                          <div className={cn("mb-3 p-2 rounded-lg", item.bg)}>
                                              <item.icon className={cn("h-5 w-5", item.text)} />
                                          </div>
                                          <div>
                                              <span className="block font-semibold text-slate-900 text-[15px]">{item.title}</span>
                                              <span className="block text-xs text-slate-500 font-medium mt-0.5">{item.sub}</span>
                                          </div>
                                      </button>
                                  ))}
                             </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-8 pb-32">
                        <AnimatePresence initial={false}>
                            {messages.map((msg, index) => (
                                <motion.div 
                                    key={index} 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={cn("flex w-full", msg.role === 'user' ? "justify-end" : "justify-start")}
                                >
                                     {/* User Message - Minimal Gray Pill */}
                                     {msg.role === 'user' ? (
                                         <div className="bg-[#F0F2F5] text-slate-800 px-5 py-3 rounded-2xl rounded-tr-sm max-w-[80%] text-[15px] leading-relaxed">
                                            {msg.text}
                                         </div>
                                     ) : (
                                         <div className="flex gap-4 max-w-full w-full">
                                             <div className="h-8 w-8 rounded-full flex-shrink-0 bg-gradient-to-tr from-blue-500 to-cyan-500 flex items-center justify-center mt-1">
                                                 <Sparkles className="h-4 w-4 text-white" />
                                             </div>
                                             
                                             <div className="flex-1 space-y-4">
                                                 {/* Render AI Response with Markdown Support */}
                                                 <div className="prose prose-slate max-w-none px-1">
                                                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                                                 </div>
                                             </div>
                                         </div>
                                     )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        
                        {/* Loading State */}
                        {loading && (
                            <div className="flex gap-4">
                                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center animate-pulse">
                                    <div className="h-4 w-4 bg-slate-300 rounded-full" />
                                </div>
                                <div className="space-y-2 mt-2">
                                    <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
                                    <div className="h-4 w-48 bg-slate-50 rounded animate-pulse" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Sticky Input Bar (Only visible when chat active) */}
                {messages.length > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent z-30">
                        <div className="max-w-3xl mx-auto relative bg-white shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200 overflow-hidden flex items-center p-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Reply to assistant..."
                                className="flex-1 bg-transparent px-4 py-2 outline-none text-slate-800 placeholder-slate-400"
                                disabled={loading}
                            />
                            <button 
                                onClick={handleSend} 
                                disabled={loading || !input.trim()}
                                className="p-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:bg-slate-100 disabled:text-slate-300"
                            >
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="text-center mt-2 text-[10px] text-slate-400">
                            Fynt Intelligence can make mistakes. Check important info.
                        </div>
                    </div>
                )}
            </div>
        </main>
      </div>
    </div>
  );
}

// Add some custom CSS for scrollbar if you want a truly premium feel
// For now, we rely on tailwind-scrollbar or standard overflow
