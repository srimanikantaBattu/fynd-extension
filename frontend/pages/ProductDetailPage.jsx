
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import urlJoin from "url-join";
import { 
    Loader2, Package, ArrowLeft, TrendingDown, Star, AlertCircle, 
    ExternalLink, Globe, Sparkles, Send, Tag, CheckCircle2,
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

  /* Refactored Workflow States */
  const [crawlTriggered, setCrawlTriggered] = useState(false);
  const [showCrawlSuccessDialog, setShowCrawlSuccessDialog] = useState(false);
  const [fetchingOffers, setFetchingOffers] = useState(false);

  const handleTriggerCrawl = async () => {
      if (!product) return;
      setCheckingCompetitors(true);
      setCompetitorError(null);

      try {
           const triggerResponse = await axios.post(urlJoin(EXAMPLE_MAIN_URL, '/api/trigger-crawl'), {
               slug: product.slug
           });
           
           if (triggerResponse.data.success) {
               console.log("Successfully triggered crawl for product:", product.slug);
               setCrawlTriggered(true);
               setShowCrawlSuccessDialog(true);
           }
      } catch (triggerErr) {
           console.error("Error triggering crawl:", triggerErr);
           setCompetitorError("Failed to trigger crawl. Please try again.");
      } finally {
           setCheckingCompetitors(false);
      }
  };

  const handleFetchOffers = async () => {
      setFetchingOffers(true);
      setCompetitorError(null);
      setCompetitorData(null);

      try {
          const { data } = await axios.post(urlJoin(EXAMPLE_MAIN_URL, '/api/offers'));
          
          if (data.success && data.offers && data.offers.length > 0) {
              const offersObject = {};
              data.offers.forEach(offer => {
                  if (offer.data && offer.marketplace) {
                      offersObject[offer.marketplace.toLowerCase()] = offer.data;
                  }
              });
              
              if (Object.keys(offersObject).length > 0) {
                  setCompetitorData(offersObject);
              } else {
                  setCompetitorError("No valid offer data found yet. Data might still be processing.");
              }
          } else {
              setCompetitorError("No offer data available. Please try retrieving again in a moment.");
          }
      } catch (err) {
          console.error("Error fetching offers:", err);
          setCompetitorError("Failed to fetch offer data. Please try again.");
      } finally {
          setFetchingOffers(false);
      }
  };

  /* AI Analysis State */
  const [analyzingAI, setAnalyzingAI] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState(null);

  /* Post Flow State */
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [postingToBoltic, setPostingToBoltic] = useState(false);


  const handleAnalyzeWithAI = async () => {
    setAnalyzingAI(true);
    setAiAnalysisResult(null);
    try {
        const payload = {
            productName: product.name,
            myPrice: product.price?.effective?.min
        };
        const response = await axios.post('/api/ai-analyze-price', payload);
        if (response.data.success) {
            setAiAnalysisResult(response.data.data);
        }
    } catch (err) {
        console.error("AI Analysis Failed", err);
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
                             {/* Check Competitors / Retrieve Data Button */}
                             <Button 
                                size="lg" 
                                className={cn(
                                    "relative overflow-hidden group h-14 px-8 rounded-2xl transition-all duration-300 shadow-[0_4px_14px_0_rgba(79,70,229,0.3)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] hover:-translate-y-0.5",
                                    (checkingCompetitors || fetchingOffers)
                                        ? "bg-slate-100 text-slate-400 shadow-none cursor-not-allowed" 
                                        : crawlTriggered 
                                            ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                                            : "bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white"
                                )}
                                onClick={crawlTriggered ? handleFetchOffers : handleTriggerCrawl}
                                disabled={checkingCompetitors || fetchingOffers}
                             >
                                 <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-700 ease-out skew-x-12 -ml-4" />
                                 {checkingCompetitors ? (
                                     <>
                                        <Loader2 className="h-5 w-5 animate-spin mr-2" /> 
                                        <span className="font-bold tracking-wide">Triggering Crawl...</span>
                                     </>
                                 ) : fetchingOffers ? (
                                     <>
                                          <Loader2 className="h-5 w-5 animate-spin mr-2" /> 
                                          <span className="font-bold tracking-wide">Retrieving Data...</span>
                                     </>
                                 ) : crawlTriggered ? (
                                     <>
                                         <TrendingDown className="h-5 w-5 mr-3" />
                                         <span className="font-bold tracking-wide text-base">Retrieve Data</span>
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
                    
                    <div className="flex flex-col gap-8">
                        {['amazon', 'flipkart'].map(platform => {
                            const offerData = competitorData[platform];
                            if (!offerData) return null;
                            const isAmazon = platform === 'amazon';
                            
                            const searchUrl = isAmazon 
                                ? `https://www.amazon.in/s?k=${encodeURIComponent(product.name)}`
                                : `https://www.flipkart.com/search?q=${encodeURIComponent(product.name)}`;

                            // Brand Colors & Gradients
                            const brandGradient = isAmazon 
                                ? "from-orange-500 to-amber-500" 
                                : "from-blue-600 to-indigo-600";
                            
                            const brandLightBg = isAmazon
                                ? "bg-orange-50/50"
                                : "bg-blue-50/50";

                            const brandText = isAmazon ? "text-orange-600" : "text-blue-600";
                            const brandBorder = isAmazon ? "border-orange-100" : "border-blue-100";

                            return (
                                <div key={platform} className="group relative bg-white rounded-[32px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 overflow-hidden flex flex-col lg:flex-row">
                                    
                                    {/* Left Column: Identity & Price (Premium Card Look) */}
                                    <div className={cn("lg:w-80 p-8 flex flex-col relative overflow-hidden", brandLightBg)}>
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r opacity-50" style={{ backgroundImage: `linear-gradient(to right, ${isAmazon ? '#f97316, #f59e0b' : '#2563eb, #4f46e5'})` }}></div>
                                        
                                        <div className="flex justify-between items-start mb-8">
                                            <span className={cn(
                                                "px-4 py-1.5 rounded-full border bg-white/80 backdrop-blur-sm text-[11px] font-black uppercase tracking-[0.2em] shadow-sm",
                                                brandText, brandBorder
                                            )}>
                                                {platform}
                                            </span>
                                            {offerData.rating?.score && (
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-slate-200/50">
                                                    <Star className="h-3.5 w-3.5 text-amber-500 fill-current" /> 
                                                    {offerData.rating.score}
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-auto relative z-10">
                                            <div className="flex items-baseline gap-2 mb-2">
                                                <span className="text-4xl font-black text-slate-900 tracking-tighter">
                                                    {formatCurrency(offerData.price?.current || 0)}
                                                </span>
                                            </div>
                                            {(offerData.price?.mrp > offerData.price?.current) && (
                                                <div className="flex flex-wrap items-center gap-3 text-sm mb-4">
                                                    <span className="text-slate-400 line-through font-medium">
                                                        {formatCurrency(offerData.price.mrp)}
                                                    </span>
                                                    {offerData.discount?.percentage > 0 && (
                                                        <span className={cn("font-bold px-2 py-0.5 rounded-md text-xs", isAmazon ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700")}>
                                                            {offerData.discount.percentage}% OFF
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            
                                            {/* Seller Info */}
                                            {offerData.seller?.name && (
                                                <div className="pt-4 border-t border-slate-200/50 text-xs text-slate-500 font-medium truncate">
                                                    By {offerData.seller.name}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Middle Column: Details (Airy & Structured) */}
                                    <div className="flex-1 p-8 flex flex-col border-t lg:border-t-0 lg:border-l border-slate-50 bg-white relative">
                                        <h3 className="font-bold text-slate-800 text-xl leading-snug mb-6">
                                            {offerData.product_title || `Product on ${platform}`}
                                        </h3>

                                        {/* Specs Grid (Clean) */}
                                        <div className="grid grid-cols-2 gap-4 mb-6">
                                             {offerData.specs && Object.entries(offerData.specs).slice(0, 4).map(([key, val]) => val && (
                                                 <div key={key} className="flex flex-col">
                                                     <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">{key.replace(/_/g, ' ')}</span>
                                                     <span className="text-sm font-semibold text-slate-700 truncate">{val}</span>
                                                 </div>
                                             ))}
                                        </div>
                                        
                                        {/* Variants (Modern Pills) */}
                                        <div className="mt-auto space-y-3">
                                            {(offerData.variants?.color_selection?.length > 0) && (
                                                <div className="flex flex-wrap gap-2">
                                                    {offerData.variants.color_selection.slice(0, 5).map((c, i) => (
                                                        <span key={i} className="px-3 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-600 text-xs font-medium hover:border-slate-300 transition-colors">{c}</span>
                                                    ))}
                                                    {offerData.variants.color_selection.length > 5 && <span className="text-xs text-slate-400 self-center">+{offerData.variants.color_selection.length-5}</span>}
                                                </div>
                                            )}
                                            {(offerData.variants?.storage_selection?.length > 0) && (
                                                <div className="flex flex-wrap gap-2">
                                                    {offerData.variants.storage_selection.slice(0, 5).map((s, i) => (
                                                        <span key={i} className="px-3 py-1 rounded-full border border-slate-200 bg-white text-slate-600 text-xs font-mono shadow-sm">{s}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right Column: Key Value & Actions (Glassy separators) */}
                                    <div className="lg:w-96 p-8 bg-slate-50/30 flex flex-col gap-6 lg:border-l border-slate-50">
                                        
                                        {/* Stock Status */}
                                        <div className="flex justify-between items-center">
                                            {offerData.availability ? (
                                                <div className="flex items-center gap-2">
                                                    <div className={cn("h-2 w-2 rounded-full ring-4", offerData.availability.in_stock ? "bg-emerald-500 ring-emerald-100" : "bg-rose-500 ring-rose-100")}></div>
                                                    <span className={cn("text-sm font-bold", offerData.availability.in_stock ? "text-emerald-700" : "text-rose-700")}>
                                                        {offerData.availability.in_stock ? "In Stock" : "Out of Stock"}
                                                    </span>
                                                </div>
                                            ) : <div/>}
                                            {offerData.availability?.delivery_text && (
                                                 <span className="text-xs font-medium text-slate-400 bg-white px-2 py-1 rounded border border-slate-100">{offerData.availability.delivery_text}</span>
                                            )}
                                        </div>

                                        {/* Offers Pills */}
                                        <div className="flex-1">
                                            {(() => {
                                                let offersList = [];
                                                if (Array.isArray(offerData.offers)) { offersList = offerData.offers; } 
                                                else if (typeof offerData.offers === 'string') { offersList = [offerData.offers]; }
                                                offersList = offersList.filter(o => o && typeof o === 'string' && o.trim().length > 0);

                                                if (offersList.length > 0) {
                                                    return (
                                                        <div className="space-y-3">
                                                            <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 opacity-80">
                                                                <Tag className="h-3 w-3" /> Exclusive Offers
                                                            </div>
                                                            <div className="flex flex-col gap-2">
                                                                {offersList.map((offer, idx) => (
                                                                    <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-white border border-indigo-50 shadow-sm hover:shadow-md transition-shadow">
                                                                        <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0"></div>
                                                                        <span className="text-xs text-slate-700 font-medium leading-relaxed">{offer}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                } else {
                                                     return (
                                                         <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 border-dashed text-center">
                                                             <p className="text-xs text-slate-400 font-medium">No special offers currently</p>
                                                             <div className="mt-2 text-[8px] text-slate-300 font-mono break-all hidden hover:block select-all cursor-text">
                                                                 Raw: {JSON.stringify(offerData.offers)}
                                                             </div>
                                                         </div>
                                                     );
                                                }
                                            })()}
                                        </div>
                                        
                                        {/* Action Area */}
                                        <div className="pt-6 mt-auto border-t border-slate-200/50">
                                            {offerData.emi?.available && (
                                                 <div className="mb-4 flex items-center gap-2 text-[11px] font-bold text-purple-700">
                                                     <div className="px-2 py-0.5 rounded bg-purple-100 text-purple-600">%</div>
                                                     <span>EMI from {offerData.emi.lowest_monthly_cost > 0 && formatCurrency(offerData.emi.lowest_monthly_cost)}/mo</span>
                                                 </div>
                                             )}

                                            <a href={searchUrl} target="_blank" rel="noopener noreferrer" className="block transform transition-transform active:scale-95">
                                                <Button 
                                                    className={cn(
                                                        "w-full h-14 rounded-2xl shadow-lg shadow-orange-500/20 text-white font-bold text-base tracking-wide flex justify-between items-center px-6 relative overflow-hidden group/btn",
                                                        isAmazon 
                                                            ? "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-orange-500/20" 
                                                            : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/20"
                                                    )}
                                                >
                                                    <span className="relative z-10">View on {platform}</span>
                                                    <div className="bg-white/20 p-2 rounded-xl transition-transform group-hover/btn:translate-x-1">
                                                        <ExternalLink className="h-5 w-5 text-white" />
                                                    </div>
                                                </Button>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        
                        {/* AI Recommendation Card (Detailed Strategy) */}
                        {aiAnalysisResult && (
                             <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-[2rem] p-8 border border-indigo-100 relative overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                                    <Sparkles className="h-64 w-64 text-indigo-900" />
                                </div>
                                
                                <div className="relative z-10 flex flex-col gap-6">
                                    {/* Header */}
                                    <div className="flex items-center gap-3 border-b border-indigo-100/50 pb-4">
                                        <div className="p-2 bg-white rounded-xl shadow-sm">
                                            <Sparkles className="h-5 w-5 text-indigo-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-800">Strategic Recommendations</h3>
                                            <p className="text-xs text-slate-500 font-medium">AI-Powered Market Analysis</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Pricing Strategy */}
                                        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/60 shadow-sm flex flex-col">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-4 flex justify-between items-center">
                                                <span>Pricing Strategy</span>
                                                {aiAnalysisResult.pricing_strategy?.action && (
                                                    <span className="bg-indigo-600 text-white px-2 py-1 rounded text-[9px]">{aiAnalysisResult.pricing_strategy.action}</span>
                                                )}
                                            </div>
                                            
                                            <div className="flex items-baseline gap-1 mb-2">
                                                 <span className="text-4xl font-black text-slate-800 tracking-tight">
                                                     {formatCurrency(aiAnalysisResult.pricing_strategy?.recommended_price || 0)}
                                                 </span>
                                            </div>
                                            
                                            <p className="text-sm text-slate-600 leading-relaxed mb-4 flex-1">
                                                {aiAnalysisResult.comparison_summary}
                                            </p>

                                            {aiAnalysisResult.pricing_strategy?.attention_tactic && (
                                                <div className="mt-auto bg-indigo-50 p-3 rounded-xl border border-indigo-100 flex gap-3 text-xs text-indigo-800 font-medium">
                                                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                                    <span>{aiAnalysisResult.pricing_strategy.attention_tactic}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Offers to Adopt */}
                                        <div className="flex flex-col">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-purple-400 mb-4">
                                                <span>Recommended Offers to Run</span>
                                            </div>
                                            
                                            {aiAnalysisResult.suggested_offers_to_adopt && aiAnalysisResult.suggested_offers_to_adopt.length > 0 ? (
                                                <div className="space-y-3">
                                                    {aiAnalysisResult.suggested_offers_to_adopt.map((offer, idx) => (
                                                        <div key={idx} className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm transition-transform hover:scale-[1.02]">
                                                            <div className="mt-1 h-2 w-2 rounded-full bg-purple-400 shrink-0"></div>
                                                            <span className="text-sm font-medium text-slate-700 leading-snug">{offer}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-400 italic">
                                                    No specific offer recommendations at this time.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {/* Crawl Success Dialog */}
            {/* Crawl Success Dialog */}
            <Dialog 
                open={showCrawlSuccessDialog} 
                onOpenChange={setShowCrawlSuccessDialog}
                title={null} // Custom header inside content
                footer={null} // Custom footer inside content for better control or use standard if fits
            >
                <div className="flex flex-col items-center text-center p-2">
                    {/* Animated Success Icon */}
                    <div className="mb-6 rounded-full bg-emerald-50 p-4 ring-8 ring-emerald-50/50 animate-in zoom-in duration-500">
                        <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                    </div>

                    {/* Title & Subtitle */}
                    <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Crawl Triggered Successfully</h3>
                    <p className="text-slate-500 font-medium text-sm leading-relaxed max-w-xs mx-auto mb-8">
                        The crawler has been notified. We are gathering the latest competitor data for you.
                    </p>

                    {/* Info Box (Redesigned) */}
                    <div className="w-full bg-emerald-50/60 rounded-2xl border border-emerald-100/80 p-5 mb-8 flex items-start gap-4 text-left shadow-[0_2px_8px_rgba(16,185,129,0.05)]">
                        <div className="p-2 bg-white rounded-xl shadow-sm border border-emerald-100 shrink-0">
                             <Package className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                            <h4 className="font-bold text-emerald-900 text-sm mb-1">Request Sent to Queue</h4>
                            <p className="text-xs text-emerald-700/80 leading-relaxed font-medium">
                                Please wait a few moments before clicking "Retrieve Data" to ensure offers are ready.
                            </p>
                        </div>
                    </div>

                    {/* Action Button */}
                    <Button 
                        onClick={() => setShowCrawlSuccessDialog(false)}
                        className="w-full h-12 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-base shadow-lg shadow-emerald-500/25 active:scale-95 transition-all"
                    >
                        Got it, thanks!
                    </Button>
                </div>
            </Dialog>
        </main>
      </div>
    </div>
  );
}
