import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import urlJoin from "url-join";
import { Loader2, Package, Sparkles, Check, Plus, X, ShoppingBag } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/Button';

const EXAMPLE_MAIN_URL = window.location.origin;
const DEFAULT_NO_IMAGE = "https://cdn.pixelbin.io/v2/dummy-image/original/placeholder.png";

export default function BundlesPage() {
  const { application_id, company_id } = useParams();
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [bundleName, setBundleName] = useState('');
  const [creatingBundle, setCreatingBundle] = useState(false);
  const [showBundleDialog, setShowBundleDialog] = useState(false);
  const [existingBundles, setExistingBundles] = useState([]);
  const [loadingBundles, setLoadingBundles] = useState(true);

  useEffect(() => {
    fetchExistingBundles();
  }, [company_id]);

  const fetchExistingBundles = async () => {
    setLoadingBundles(true);
    try {
      const { data } = await axios.get(
        urlJoin(EXAMPLE_MAIN_URL, '/api/products/bundles'),
        {
          headers: {
            "x-company-id": company_id,
          }
        }
      );

      if (data.success) {
        setExistingBundles(data.bundles || []);
      }
    } catch (e) {
      console.error("Error fetching bundles:", e);
    } finally {
      setLoadingBundles(false);
    }
  };

  const analyzeWithAI = async () => {
    setAnalyzing(true);
    setSuggestions([]);
    setSelectedProducts([]);
    
    try {
      const { data } = await axios.post(
        urlJoin(EXAMPLE_MAIN_URL, '/api/products/ai-bundle-suggestions'),
        {},
        {
          headers: {
            "x-company-id": company_id,
          }
        }
      );

      if (data.success) {
        setSuggestions(data.suggestions || []);
      }
    } catch (e) {
      console.error("Error analyzing bundles:", e);
      alert("Failed to get AI suggestions. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const toggleProductSelection = (product) => {
    setSelectedProducts(prev => {
      const exists = prev.find(p => p.uid === product.uid);
      if (exists) {
        return prev.filter(p => p.uid !== product.uid);
      } else {
        return [...prev, product];
      }
    });
  };

  const isProductSelected = (product) => {
    return selectedProducts.some(p => p.uid === product.uid);
  };

  const handleCreateBundle = () => {
    if (selectedProducts.length < 2) {
      alert("Please select at least 2 products to create a bundle");
      return;
    }
    setShowBundleDialog(true);
  };

  const submitBundle = async () => {
    if (!bundleName.trim()) {
      alert("Please enter a bundle name");
      return;
    }

    setCreatingBundle(true);
    try {
      const { data } = await axios.post(
        urlJoin(EXAMPLE_MAIN_URL, '/api/products/create-bundle'),
        {
          name: bundleName,
          products: selectedProducts.map(p => ({ product_uid: p.uid, quantity: 1 }))
        },
        {
          headers: {
            "x-company-id": company_id,
          }
        }
      );

      if (data.success) {
        alert(`Bundle "${bundleName}" created successfully!`);
        setSuggestions([]);
        setSelectedProducts([]);
        setBundleName('');
        setShowBundleDialog(false);
        // Refresh the bundles list
        fetchExistingBundles();
      }
    } catch (e) {
      console.error("Error creating bundle:", e);
      alert("Failed to create bundle. Please try again.");
    } finally {
      setCreatingBundle(false);
    }
  };

  const productProfileImage = (media) => {
    if (!media || !media.length) {
      return DEFAULT_NO_IMAGE;
    }
    const profileImg = media.find(m => m.type === "image");
    return profileImg?.url || media[0]?.url || DEFAULT_NO_IMAGE;
  };

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <Sidebar className="hidden md:block fixed inset-y-0" />
      <div className="flex-1 flex flex-col md:pl-64 transition-all duration-300">
        <Header />
        <main className="flex-1 p-6 lg:p-8 max-w-[1920px] mx-auto w-full">
          <div className="flex flex-col gap-8">
            {/* Header Section */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-900 via-slate-800 to-indigo-900 pb-1">
                  AI Bundle Suggestions
                </h1>
                <span className="px-3 py-1 rounded-full bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 text-[10px] font-bold text-purple-600 uppercase tracking-widest">
                  AI Powered
                </span>
              </div>
              <p className="text-slate-500 text-lg max-w-2xl font-medium leading-relaxed">
                Get intelligent product bundling recommendations based on your scraped competitor data and product catalog.
              </p>
            </div>

            {/* Existing Bundles Section */}
            {loadingBundles ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              </div>
            ) : existingBundles.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Your Product Bundles</h2>
                    <p className="text-slate-500 text-sm mt-1">
                      {existingBundles.length} bundle{existingBundles.length > 1 ? 's' : ''} created
                    </p>
                  </div>
                  <Button
                    onClick={fetchExistingBundles}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {existingBundles.map((bundle) => (
                    <BundleCard key={bundle.id} bundle={bundle} productProfileImage={productProfileImage} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 rounded-3xl border border-dashed border-slate-200 bg-white/50">
                <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                  <Package className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">No bundles yet</h3>
                <p className="text-slate-500 max-w-sm text-center mt-2">
                  Use AI to analyze your products and create intelligent bundles.
                </p>
              </div>
            )}

            {/* Analyze Button */}
            <div className="flex gap-4 items-center pt-8 border-t border-slate-200">
              <Button
                onClick={analyzeWithAI}
                disabled={analyzing}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold px-8 py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    Get AI Suggestions
                  </>
                )}
              </Button>

              {selectedProducts.length > 0 && (
                <Button
                  onClick={handleCreateBundle}
                  disabled={creatingBundle}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold px-8 py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3"
                >
                  <ShoppingBag className="h-5 w-5" />
                  Create Bundle ({selectedProducts.length} products)
                </Button>
              )}
            </div>

            {/* AI Suggestions Empty State */}
            {!analyzing && suggestions.length === 0 && existingBundles.length > 0 && (
              <div className="flex flex-col items-center justify-center h-64 rounded-3xl border border-dashed border-indigo-200 bg-gradient-to-br from-indigo-50/30 to-purple-50/30">
                <div className="h-16 w-16 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl flex items-center justify-center mb-4">
                  <Sparkles className="h-8 w-8 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Get more bundle ideas</h3>
                <p className="text-slate-500 max-w-sm text-center mt-2">
                  Click "Get AI Suggestions" to discover more intelligent bundle combinations.
                </p>
              </div>
            )}
            {analyzing && (
              <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
                  <p className="text-slate-600 font-medium">AI is analyzing your products...</p>
                </div>
              </div>
            )}

            {/* Suggestions Grid */}
            {!analyzing && suggestions.length > 0 && (
              <>
                <div className="flex flex-col gap-2">
                  <h2 className="text-2xl font-bold text-slate-900">Recommended Bundles</h2>
                  <p className="text-slate-500">
                    AI has identified {suggestions.length} product bundle{suggestions.length > 1 ? 's' : ''} that could work well together.
                    Select products to create a bundle.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {suggestions.map((suggestion, index) => (
                    <BundleSuggestionCard
                      key={index}
                      suggestion={suggestion}
                      selectedProducts={selectedProducts}
                      onToggleProduct={toggleProductSelection}
                      isProductSelected={isProductSelected}
                      productProfileImage={productProfileImage}
                    />
                  ))}
                </div>
              </>
            )}


          </div>
        </main>
      </div>

      {/* Bundle Creation Dialog */}
      {showBundleDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-slate-900">Create Bundle</h3>
              <button
                onClick={() => setShowBundleDialog(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Bundle Name
                </label>
                <input
                  type="text"
                  value={bundleName}
                  onChange={(e) => setBundleName(e.target.value)}
                  placeholder="e.g., Summer Collection Bundle"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Selected Products ({selectedProducts.length})
                </label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedProducts.map((product) => (
                    <div
                      key={product.uid}
                      className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl"
                    >
                      <img
                        src={productProfileImage(product.media)}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 text-sm">{product.name}</p>
                        <p className="text-xs text-slate-500">
                          ₹{product.price?.effective?.min || 'N/A'}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleProductSelection(product)}
                        className="text-red-500 hover:text-red-600 transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={submitBundle}
                  disabled={creatingBundle || !bundleName.trim()}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {creatingBundle ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check className="h-5 w-5 mr-2" />
                      Create Bundle
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setShowBundleDialog(false)}
                  variant="outline"
                  className="px-6"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BundleSuggestionCard({ suggestion, selectedProducts, onToggleProduct, isProductSelected, productProfileImage }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-slate-900 mb-2">{suggestion.bundleName}</h3>
          <p className="text-slate-600 text-sm leading-relaxed">{suggestion.reason}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {suggestion.products.map((product) => (
          <ProductCard
            key={product.uid}
            product={product}
            isSelected={isProductSelected(product)}
            onToggle={() => onToggleProduct(product)}
            productProfileImage={productProfileImage}
          />
        ))}
      </div>
    </div>
  );
}

function BundleCard({ bundle, productProfileImage }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900 mb-1">{bundle.name}</h3>
            <p className="text-sm text-slate-500">{bundle.slug}</p>
          </div>
          {bundle.is_active ? (
            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-semibold rounded-full">
              Active
            </span>
          ) : (
            <span className="px-3 py-1 bg-slate-100 text-slate-500 text-xs font-semibold rounded-full">
              Inactive
            </span>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Package className="h-4 w-4" />
            <span>{bundle.products?.length || 0} Products</span>
          </div>
          
          {bundle.products && bundle.products.length > 0 && (
            <div className="flex -space-x-2 overflow-hidden">
              {bundle.products.slice(0, 4).map((product, idx) => (
                <div
                  key={idx}
                  className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 overflow-hidden"
                  title={product.product_details?.name || 'Product'}
                >
                  {product.product_details?.media?.[0]?.url && (
                    <img
                      src={product.product_details.media[0].url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              ))}
              {bundle.products.length > 4 && (
                <div className="w-10 h-10 rounded-full border-2 border-white bg-indigo-100 flex items-center justify-center">
                  <span className="text-xs font-semibold text-indigo-600">
                    +{bundle.products.length - 4}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product, isSelected, onToggle, productProfileImage }) {
  return (
    <div
      onClick={onToggle}
      className={cn(
        "relative bg-slate-50 rounded-2xl p-4 cursor-pointer transition-all duration-300 border-2",
        isSelected
          ? "border-indigo-500 shadow-lg shadow-indigo-200/50 scale-[1.02]"
          : "border-transparent hover:border-slate-200 hover:shadow-md"
      )}
    >
      {/* Selection Indicator */}
      <div
        className={cn(
          "absolute top-3 right-3 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300",
          isSelected
            ? "bg-indigo-600 border-indigo-600"
            : "bg-white border-slate-300"
        )}
      >
        {isSelected && <Check className="h-4 w-4 text-white" />}
      </div>

      <img
        src={productProfileImage(product.media)}
        alt={product.name}
        className="w-full h-32 object-cover rounded-xl mb-3"
      />
      
      <h4 className="font-semibold text-slate-900 text-sm mb-1 line-clamp-2">
        {product.name}
      </h4>
      
      <div className="flex items-center justify-between mt-2">
        <span className="text-lg font-bold text-indigo-600">
          ₹{product.price?.effective?.min || 'N/A'}
        </span>
        {product.is_active ? (
          <span className="text-xs text-emerald-600 font-medium">Active</span>
        ) : (
          <span className="text-xs text-slate-400 font-medium">Inactive</span>
        )}
      </div>
    </div>
  );
}
