
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import urlJoin from "url-join";
import { 
    Loader2, Package, ArrowLeft, TrendingDown, Star, AlertCircle, 
    ExternalLink, Globe, Sparkles, Send,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Dialog, DialogButton } from '../components/ui/Dialog';

const EXAMPLE_MAIN_URL = window.location.origin;
const DEFAULT_NO_IMAGE = "https://cdn.pixelbin.io/v2/dummy-image/original/placeholder.png"; // Copied from PostPage for consistency

// Reuse helper
const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
};

export default function ProductDetailPage() {
  const { application_id, company_id, slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [product, setProduct] = useState(location.state?.product || null);
  const [loading, setLoading] = useState(!product);
  const [checkingCompetitors, setCheckingCompetitors] = useState(false);
  const [competitorData, setCompetitorData] = useState(null);
  const [competitorError, setCompetitorError] = useState(null);

  useEffect(() => {
    // If we didn't get product from state (direct link), fetch it
    if (!product) {
        fetchProductDetails();
    }
  }, [slug]);

  const fetchProductDetails = async () => {
    setLoading(true);
    try {
       // We fetch the full list and find the item because specific item API might differ
       // or we want consistency. For now, fetch list and find.
       const productApiUrl = application_id 
          ? `/api/products/application/${application_id}` 
          : `/api/products`;
          
       const config = company_id ? { headers: { "x-company-id": company_id } } : {};
       const { data } = await axios.get(urlJoin(EXAMPLE_MAIN_URL, productApiUrl), config);
       
       const found = (data.items || []).find(p => p.slug === slug);
       if (found) {
           setProduct(found);
       } else {
           // Handle not found
       }
    } catch (e) {
      console.error("Error fetching product details:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckCompetitors = async () => {
      if (!product) return;
      setCheckingCompetitors(true);
      setCompetitorData(null);
      setCompetitorError(null);

      try {
          const { data } = await axios.get(urlJoin(EXAMPLE_MAIN_URL, '/api/comparison-data'));
          const crawledItems = data.data?.crawledData || [];
          
          // Match logic
          const match = crawledItems.find(c => 
              (c.slug && product.slug && c.slug === product.slug) || 
              (c.name && product.name && c.name.toLowerCase().trim() === product.name.toLowerCase().trim())
          );

          if (match && match.marketplaces) {
              const relevantData = {};
              // Filter only Amazon and Flipkart as requested
              if (match.marketplaces.amazon) relevantData.amazon = match.marketplaces.amazon;
              if (match.marketplaces.flipkart) relevantData.flipkart = match.marketplaces.flipkart;
              
              if (Object.keys(relevantData).length > 0) {
                  setCompetitorData(relevantData);
              } else {
                  setCompetitorError("No Amazon or Flipkart data found for this product.");
              }
          } else {
              setCompetitorError("No competitor data found for this product.");
          }
      } catch (err) {
          console.error("Error checking competitors:", err);
          setCompetitorError("Failed to fetch competitor data. Please try again.");
      } finally {
          setCheckingCompetitors(false);
      }
  };

  /* AI Analysis State */
  const [analyzingAI, setAnalyzingAI] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState(null);

  /* Post Flow State */
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [postingToBoltic, setPostingToBoltic] = useState(false);


  const handleAnalyzeWithAI = async () => {
    // Ensure we have competitor data first
    if (!competitorData) {
        // Optionally trigger fetch here, but for now let's rely on user flow or auto-fetch
        // For better UX, let's try to fetch if missing
        await handleCheckCompetitors(); 
    }
    
    // If still no data (and no error), we might rely on the state update in next render, 
    // but handleCheckCompetitors is async so we might need to wait or check result.
    // For simplicity, let's assume if handleCheckCompetitors works, it updates state. 
    // However, state updates aren't immediate in same closure. 
    // A better approach: pass data directly to AI call if possible, or wait.
    
    // To simplify, let's just proceed. The backend handleCheckCompetitors sets 'competitorData' 
    // but we can't see it immediately here. 
    // So distinct flow: User clicks "Check Competitors", THEN "Analyze with AI" becomes enabled/visible?
    // OR we chain them. Let's try to grab data from fresh fetch if needed.
    
    setAnalyzingAI(true);
    try {
        // We need the latest data. 
        // Let's re-fetch or use what we have (if React state determines availability).
        let currentCompetitorData = competitorData;

        if (!currentCompetitorData) {
             // Quick fetch for AI usage
             const { data } = await axios.get(urlJoin(EXAMPLE_MAIN_URL, '/api/comparison-data'));
             const crawledItems = data.data?.crawledData || [];
             const match = crawledItems.find(c => 
                (c.slug && product.slug && c.slug === product.slug) || 
                (c.name && product.name && c.name.toLowerCase().trim() === product.name.toLowerCase().trim())
             );
             if (match && match.marketplaces) {
                 const relevantData = {};
                 if (match.marketplaces.amazon) relevantData.amazon = match.marketplaces.amazon;
                 if (match.marketplaces.flipkart) relevantData.flipkart = match.marketplaces.flipkart;
                 currentCompetitorData = relevantData;
             }
        }

        if (!currentCompetitorData) {
            setCompetitorError("Need competitor data for AI analysis.");
            setAnalyzingAI(false);
            return;
        }

        const payload = {
            productName: product.name,
            myPrice: product.price?.effective?.min,
            competitorData: currentCompetitorData
        };

        const { data } = await axios.post(urlJoin(EXAMPLE_MAIN_URL, '/api/ai-analyze-price'), payload);
        
        if (data.success) {
            setAiAnalysisResult(data.data);
        }

    } catch (e) {
        console.error("AI Analysis Failed:", e);
        setCompetitorError("AI Analysis failed. Try again.");
    } finally {
        setAnalyzingAI(false);
    }
  };

  const hasCompetitorData = !!competitorData;

  const productProfileImage = (media) => {
    if (!media || !media.length) return null;
    const profileImg = media.find(m => m.type === "image");
    return profileImg?.url || media[0]?.url || null;
  };
  
  const displayImage = productProfileImage(product.media);

  const getBackUrl = () => {
    if (application_id && company_id) {
        return `/company/${company_id}/application/${application_id}/post`;
    }
    if (company_id) {
        return `/company/${company_id}/post`;
    }
    return '/dashboard/post';
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar className="hidden md:block fixed inset-y-0" />
      <div className="flex-1 flex flex-col md:pl-64 transition-all duration-300">
        <Header />
        
        <main className="flex-1 p-8 lg:p-12 max-w-7xl mx-auto w-full">
            {/* Navigation - Minimal */}
            <div className="mb-10">
                <Button 
                    variant="ghost" 
                    className="group text-slate-400 hover:text-slate-800 -ml-2 gap-2 hover:bg-white/50 transition-all duration-300 rounded-full px-4"
                    onClick={() => navigate(getBackUrl())}
                >
                    <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> 
                    <span className="font-medium tracking-wide">Back to Products</span>
                </Button>
            </div>

            {/* Product Hero Section - Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
                
                {/* Left Column: Product Image Showcase */}
                <div className="lg:col-span-5">
                    <div className="sticky top-24">
                        <div className="relative group perspective-1000">
                            {/* Decorative ambient glows */}
                            <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-500/10 via-purple-500/5 to-slate-200/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            
                            <div className="relative aspect-square w-full bg-white/60 backdrop-blur-2xl rounded-[32px] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] group-hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 flex items-center justify-center p-6 overflow-hidden">
                                
                                {/* Inner subtle gradient */}
                                <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-slate-50/40" />
                                
                                {/* Floating Status Badge */}
                                {product.is_active && (
                                    <div className="absolute top-6 right-6 z-20">
                                        <div className="relative flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-md rounded-full border border-emerald-100/50 shadow-sm">
                                            <span className="relative flex h-2 w-2">
                                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                            </span>
                                            <span className="text-[10px] font-bold text-emerald-600 tracking-widest uppercase">Active</span>
                                        </div>
                                    </div>
                                )}

                                {/* Image */}
                                {displayImage ? (
                                    <div className="relative z-10 w-full h-full flex items-center justify-center transform group-hover:scale-105 transition-transform duration-700 ease-out">
                                        <div className="absolute inset-x-8 bottom-0 h-4 bg-black/5 blur-xl rounded-[100%] opacity-0 group-hover:opacity-40 transition-opacity duration-500" />
                                        <img 
                                            src={displayImage} 
                                            alt={product.name} 
                                            className="max-w-full max-h-full object-contain drop-shadow-sm filter contrast-[1.05]" 
                                        />
                                    </div>
                                ) : (
                                    <Package className="h-24 w-24 text-slate-200 relative z-10" />
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Product Details */}
                <div className="lg:col-span-7 flex flex-col justify-center">
                    <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700 fade-in fill-mode-forwards">
                        
                        {/* Header Section */}
                        <div className="space-y-3">
                            {product.brand && (
                                <div className="inline-flex items-center">
                                    <span className="text-[11px] font-black text-indigo-500/80 uppercase tracking-[0.2em] px-3 py-1 rounded-full bg-indigo-50/50 border border-indigo-100/30">
                                        {product.brand.name}
                                    </span>
                                </div>
                            )}
                            
                            <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.1]">
                                {product.name}
                            </h1>
                            
                            {/* SKU Capsules */}
                            <div className="flex flex-wrap gap-2 pt-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full shadow-sm text-[10px] font-mono font-medium text-slate-500 hover:border-slate-300 transition-colors cursor-default">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                    {product.slug}
                                </span>
                                {product.item_code && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full shadow-sm text-[10px] font-mono font-bold text-slate-600 hover:border-indigo-200 hover:text-indigo-600 transition-colors cursor-default">
                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                        SKU: {product.item_code}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="w-full h-px bg-slate-100" />

                        {/* Pricing Card */}
                        <div className="flex flex-col sm:flex-row gap-6">
                            <div className="bg-white/50 backdrop-blur-sm rounded-2xl border border-white shadow-[0_4px_20px_rgb(0,0,0,0.02)] p-6 flex-1">
                                <div className="flex items-end gap-3 mb-2">
                                    {product.price ? (
                                        <>
                                            <span className="text-4xl font-black text-slate-900 tracking-tighter">
                                                {formatCurrency(product.price.effective?.min)}
                                            </span>
                                            {product.price.marked && (
                                                <span className="text-lg font-medium text-slate-400 line-through decoration-slate-300/60 mb-1.5">
                                                    {formatCurrency(product.price.marked.min)}
                                                </span>
                                            )}
                                        </>
                                    ) : (
                                        <span className="text-2xl font-bold text-slate-300">Price N/A</span>
                                    )}
                                </div>
                                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                                    Current Market Value
                                </p>
                            </div>
                            

                        </div>

                        {/* Action Buttons */}
                        <div className="pt-4 flex flex-wrap items-center gap-4">
                             {/* Check Competitors Button */}
                             <Button 
                                size="lg" 
                                className={cn(
                                    "relative overflow-hidden group h-14 px-8 rounded-2xl transition-all duration-300 shadow-[0_4px_14px_0_rgba(79,70,229,0.3)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] hover:-translate-y-0.5",
                                    checkingCompetitors 
                                        ? "bg-slate-100 text-slate-400 shadow-none cursor-not-allowed" 
                                        : "bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white"
                                )}
                                onClick={handleCheckCompetitors}
                                disabled={checkingCompetitors}
                             >
                                 <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-700 ease-out skew-x-12 -ml-4" />
                                 {checkingCompetitors ? (
                                     <>
                                        <Loader2 className="h-5 w-5 animate-spin mr-2" /> 
                                        <span className="font-bold tracking-wide">Analyzing Market...</span>
                                     </>
                                 ) : (
                                     <>
                                        <Globe className="h-5 w-5 mr-3" /> 
                                        <span className="font-bold tracking-wide text-base">Check Competitors</span>
                                     </>
                                 )}
                             </Button>

                             {/* Analyze with AI Button */}
                            <Button 
                                size="lg"
                                className={cn(
                                    "relative overflow-hidden group h-14 px-8 rounded-2xl transition-all duration-300 shadow-[0_4px_14px_0_rgba(124,58,237,0.3)] hover:shadow-[0_6px_20px_rgba(124,58,237,0.23)] hover:-translate-y-0.5",
                                    analyzingAI
                                        ? "bg-slate-100 text-slate-400 shadow-none cursor-not-allowed"
                                        : "bg-violet-600 hover:bg-violet-700 text-white"
                                )}
                                onClick={handleAnalyzeWithAI}
                                disabled={analyzingAI}
                            >
                                <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-700 ease-out skew-x-12 -ml-4" />
                                {analyzingAI ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                        <span className="font-bold tracking-wide">Generating Insights...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-5 w-5 mr-3 fill-white/20" />
                                        <span className="font-bold tracking-wide text-base">Analyze with AI</span>
                                    </>
                                )}
                            </Button>

                             {/* Post Button */}
                            <Button 
                                size="lg"
                                className="relative overflow-hidden group h-14 px-8 rounded-2xl transition-all duration-300 shadow-[0_4px_14px_0_rgba(8,145,178,0.3)] hover:shadow-[0_6px_20px_rgba(8,145,178,0.23)] hover:-translate-y-0.5 bg-cyan-600 hover:bg-cyan-700 text-white"
                                onClick={() => setShowPostDialog(true)}
                            >
                                <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-700 ease-out skew-x-12 -ml-4" />
                                <Send className="h-5 w-5 mr-3" />
                                <span className="font-bold tracking-wide text-base">Post</span>
                            </Button>
                             
                             {competitorError && (
                                 <div className="px-4 py-2 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-600 animate-in fade-in slide-in-from-left-4">
                                     <AlertCircle className="h-4 w-4" /> 
                                     <span className="text-sm font-medium">{competitorError}</span>
                                 </div>
                             )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Post Confirmation Dialog */}
            <Dialog 
                open={showPostDialog} 
                onOpenChange={setShowPostDialog}
                title="Confirm Post"
                description="Have you changed the price according to AI recommendation?"
                footer={
                    <>
                        <DialogButton 
                            variant="secondary" 
                            onClick={() => setShowPostDialog(false)}
                        >
                            No, Cancel
                        </DialogButton>
                        <DialogButton 
                            onClick={async () => {
                                setPostingToBoltic(true);
                                try {
                                    // Prepare data for Boltic
                                    const payload = {
                                        product_name: product.name,
                                        image_url: displayImage || DEFAULT_NO_IMAGE || "",
                                        price: product.price?.effective?.min || 0,
                                        slug: product.slug,
                                        content: `Checkout ${product.name}! Available now.` // Random content as requested
                                    };

                                    const { data } = await axios.post(urlJoin(EXAMPLE_MAIN_URL, '/api/boltic-post'), payload);
                                    
                                    if (data.success) {
                                        alert("Successfully posted to Instagram Table!");
                                        setShowPostDialog(false);
                                    } else {
                                        alert("Failed to post: " + (data.message || "Unknown error"));
                                    }
                                } catch (err) {
                                    console.error("Post error:", err);
                                    alert("Error posting to Boltic. Check console.");
                                } finally {
                                    setPostingToBoltic(false);
                                }
                            }}
                            loading={postingToBoltic}
                        >
                            Yes, Post
                        </DialogButton>
                    </>
                }
            >
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 text-amber-800 text-sm font-medium flex items-start gap-3">
                   <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
                   <p>This action will create a new entry in your Boltic 'Instagram table'. Make sure product details are correct.</p>
                </div>
            </Dialog>

            {/* Competitor Analysis Section */}
            {competitorData && (
                <div className="mt-24 border-t border-slate-100 pt-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                                    <TrendingDown className="h-5 w-5 text-emerald-600" /> 
                                </div>
                                Market Analysis
                            </h2>
                            <p className="text-slate-500 mt-1 ml-14">Real-time competitor pricing data</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {['amazon', 'flipkart'].map(platform => {
                            const data = competitorData[platform];
                            if (!data || !data.items?.[0]) return null;
                            const item = data.items[0];
                            const isAmazon = platform === 'amazon';
                            
                            const searchUrl = isAmazon 
                                ? `https://www.amazon.com/s?k=${encodeURIComponent(product.name)}`
                                : `https://www.flipkart.com/search?q=${encodeURIComponent(product.name)}`;

                            return (
                                <div key={platform} className="group bg-white rounded-[24px] border border-slate-100 p-8 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                                        <ExternalLink className="h-24 w-24" />
                                    </div>

                                    <div className="flex justify-between items-start mb-8 relative z-10">
                                        <span className={cn(
                                            "px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-[0.2em]",
                                            isAmazon ? "text-orange-600 bg-orange-50 border-orange-100" : "text-blue-600 bg-blue-50 border-blue-100"
                                        )}>
                                            {platform}
                                        </span>
                                        {item.rating && (
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100/50 shadow-sm">
                                                <Star className="h-3.5 w-3.5 text-amber-500 fill-current" /> {item.rating}
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="space-y-6 relative z-10">
                                        <div>
                                             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Current Price</div>
                                             <div className="flex items-baseline gap-2">
                                                <span className="text-4xl font-black text-slate-900 tracking-tighter">{formatCurrency(item.price.value)}</span>
                                             </div>
                                        </div>
                                        
                                        <div className="space-y-3 pt-6 border-t border-slate-50 text-sm">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-400 font-medium">Delivery</span>
                                                <span className="font-bold text-slate-700 bg-slate-50 px-2 py-1 rounded">{item.delivery_time_estimate || "Standard"}</span>
                                            </div>
                                            {item.seller_name && (
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-slate-400 font-medium">Seller</span>
                                                    <span className="font-bold text-slate-700 truncate max-w-[150px] bg-slate-50 px-2 py-1 rounded">{item.seller_name}</span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <a href={searchUrl} target="_blank" rel="noopener noreferrer" className="block pt-2">
                                            <Button variant="outline" className="w-full h-12 rounded-xl justify-between group/btn border-slate-200 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-100 transition-all">
                                                <span className="font-bold">View Offer</span>
                                                <ExternalLink className="h-4 w-4 text-slate-400 group-hover/btn:text-indigo-500 transition-colors" />
                                            </Button>
                                        </a>
                                    </div>
                                </div>
                            );
                        })}
                        
                        {/* AI Recommendation Card - Appended to Grid */}
                        {aiAnalysisResult && (
                             <div className="group bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 rounded-[24px] p-8 border border-blue-100 shadow-[0_4px_20px_rgba(59,130,246,0.1)] hover:shadow-[0_20px_40px_rgba(59,130,246,0.15)] transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-6 opacity-10">
                                    <Sparkles className="h-24 w-24 text-blue-600 fill-blue-600/20" />
                                </div>

                                <div className="flex justify-between items-start mb-8 relative z-10">
                                    <span className="px-4 py-1.5 rounded-full border border-blue-200 bg-white text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
                                        AI Insight
                                    </span>
                                </div>
                                
                                <div className="space-y-6 relative z-10">
                                    <div>
                                         <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">Recommended Price</div>
                                         <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-black text-slate-900 tracking-tighter">{formatCurrency(aiAnalysisResult.recommended_price)}</span>
                                         </div>
                                    </div>
                                    
                                    <div className="space-y-3 pt-6 border-t border-blue-100 text-sm">
                                        <p className="text-xs font-medium text-slate-600 leading-relaxed">
                                            {aiAnalysisResult.reasoning}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </main>
      </div>
    </div>
  );
}
