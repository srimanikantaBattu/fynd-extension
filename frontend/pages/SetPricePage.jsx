
import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { Send, Bot, User, Sparkles, RefreshCcw, ChevronRight } from 'lucide-react';
import axios from 'axios';
import urlJoin from "url-join";
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';

const EXAMPLE_MAIN_URL = window.location.origin;

export default function SetPricePage() {
  const { company_id } = useParams();
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: "Hello! I'm your **Pricing Assistant**. I can analyze market data and help you set competitive prices.\n\nAsk me to:\n- *Compare prices* with Amazon/Flipkart\n- *Suggest* a better price\n- Analyze market trends",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
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
      // Pass company-id in headers for context-aware backend logic
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
      const errorMessageText = error.response?.data?.message || "Sorry, I encountered an error. Please try again.";
      const errorMessage = {
        role: 'ai',
        text: `**Error**: ${errorMessageText}`, // Markdown bold for error
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
    <div className="flex h-screen w-full bg-white font-sans text-slate-900 overflow-hidden selection:bg-indigo-100 selection:text-indigo-900">
      <Sidebar className="hidden md:block w-64 fixed inset-y-0 z-50 border-r border-slate-100 bg-white" />
      
      <div className="flex-1 flex flex-col md:pl-64 h-full relative">
        <Header className="bg-white/90 shrink-0 z-40 backdrop-blur-md border-b border-slate-100 sticky top-0" /> 

        <main className="flex-1 flex flex-col h-full min-h-0 relative z-10 max-w-4xl mx-auto w-full">
            
            {/* Chat Container */}
            <div className="flex-1 overflow-hidden flex flex-col relative w-full h-full bg-white">
                
                {/* Chat Header - Clean & Minimal */}
                <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-white shrink-0 z-20">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                             <Sparkles className="h-4 w-4 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm text-slate-900 tracking-tight">Pricing Assistant</h3>
                        </div>
                    </div>
                </div>

                {/* Messages Area - Gemini/Claude Style (Minimal) */}
                <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 scroll-smooth custom-scrollbar bg-white min-h-0">
                    <AnimatePresence initial={false}>
                        {messages.map((msg, index) => (
                            <motion.div 
                                key={index} 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                                className={cn("flex w-full mb-6", msg.role === 'user' ? "justify-end" : "justify-start")}
                            >
                                 <div className={cn(
                                     "flex w-full md:max-w-[85%] lg:max-w-[80%] gap-4",
                                     msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                                 )}>
                                     {/* Avatar - Only for AI */}
                                     {msg.role !== 'user' && (
                                         <div className="h-8 w-8 rounded-full bg-transparent flex-shrink-0 flex items-start justify-center mt-0.5">
                                             <div className="h-7 w-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                                                <Sparkles className="h-3.5 w-3.5 text-indigo-600 center" />
                                             </div>
                                         </div>
                                     )}

                                     {/* Message Content */}
                                     <div className={cn(
                                         "flex flex-col relative max-w-full",
                                          msg.role === 'user' ? "items-end" : "items-start"
                                     )}>
                                         <div className={cn(
                                             "text-[14px] leading-6 tracking-wide",
                                             msg.role === 'user' 
                                                ? "bg-slate-800 text-white px-5 py-2.5 rounded-[24px] rounded-br-lg font-normal shadow-sm" 
                                                : "bg-transparent text-slate-700 px-0 py-0 font-normal"
                                         )}>
                                             {msg.role === 'ai' ? (
                                                <div className="prose prose-sm prose-slate max-w-none prose-p:leading-6 prose-p:mb-2 prose-headings:text-slate-800 prose-headings:font-semibold prose-strong:text-indigo-900 prose-strong:font-semibold prose-code:text-indigo-600 prose-code:bg-indigo-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-mono prose-code:text-[12px] prose-ul:my-2 prose-li:my-0.5 prose-li:pl-0">
                                                    <ReactMarkdown 
                                                        components={{
                                                            p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                                                            a: ({node, ...props}) => <a className="text-indigo-600 hover:text-indigo-700 underline underline-offset-2 font-medium" {...props} />,
                                                            ul: ({node, ...props}) => <ul className="space-y-1 list-none ml-1" {...props} />,
                                                            li: ({node, ...props}) => (
                                                                <li className="flex gap-2 items-start" {...props}>
                                                                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                                                                    <span>{props.children}</span>
                                                                </li>
                                                            ),
                                                            strong: ({node, ...props}) => <strong className="block mt-3 mb-1 font-semibold text-slate-900" {...props} />,
                                                            code({node, inline, className, children, ...props}) {
                                                              return !inline ? (
                                                                <div className="my-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                                                                  <code className="block bg-transparent text-[12px] font-mono text-slate-700 overflow-x-auto" {...props}>
                                                                    {children}
                                                                  </code>
                                                                </div>
                                                              ) : (
                                                                <code className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-md text-[12px] font-mono" {...props}>
                                                                  {children}
                                                                </code>
                                                              )
                                                            }
                                                        }}
                                                    >
                                                        {msg.text}
                                                    </ReactMarkdown>
                                                </div>
                                             ) : (
                                                 <p>{msg.text}</p>
                                             )}
                                         </div>
                                     </div>
                                 </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    
                    {/* Typing Indicator - Minimal */}
                    {loading && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex w-full justify-start pl-12 mb-6"
                        >
                             <div className="flex items-center gap-1.5">
                                 <div className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-pulse"></div>
                                 <div className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                                 <div className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                             </div>
                        </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area - Floating Pill */}
                <div className="p-4 md:p-6 bg-white relative z-30">
                    <div className="relative flex items-center gap-3 max-w-3xl mx-auto">
                        <div className="relative flex-1 group shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] rounded-full bg-white hover:shadow-[0_0_0_1px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.06)] transition-shadow">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask Pricing AI..."
                                className="w-full h-14 bg-transparent text-slate-900 placeholder-slate-400 rounded-full px-6 pr-14 focus:outline-none transition-all text-[15px]"
                                disabled={loading}
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                <button 
                                    onClick={handleSend} 
                                    disabled={loading || !input.trim()}
                                    className={cn(
                                        "h-10 w-10 rounded-full flex items-center justify-center transition-all duration-200",
                                        input.trim() 
                                            ? "bg-slate-900 text-white hover:bg-slate-800" 
                                            : "bg-slate-100 text-slate-300"
                                    )}
                                >
                                    <Send className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
            </div>
        </main>
      </div>
    </div>
  );
}

// Add some custom CSS for scrollbar if you want a truly premium feel
// For now, we rely on tailwind-scrollbar or standard overflow
