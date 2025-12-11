import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import urlJoin from "url-join";
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Dialog } from '../components/ui/Dialog';
import { Loader2, Sparkles, Check, AlertCircle, Image as ImageIcon } from 'lucide-react';

const EXAMPLE_MAIN_URL = window.location.origin;

export default function GenerateModelPage() {
    const { company_id, application_id } = useParams();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [prompt, setPrompt] = useState("Transform this clothing item into a professional fashion photoshoot with a model wearing it. Modern, stylish pose, studio lighting, high-quality fashion photography.");
    const [aspectRatio, setAspectRatio] = useState("");
    const [generating, setGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState(null);
    const [showResultDialog, setShowResultDialog] = useState(false);
    const [savingToProduct, setSavingToProduct] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        fetchProducts();
    }, [company_id, application_id]);

    const isApplicationLaunch = () => !!application_id;

    const fetchProducts = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const endpoint = isApplicationLaunch() 
                ? urlJoin(EXAMPLE_MAIN_URL, `/api/products/application/${application_id}`)
                : urlJoin(EXAMPLE_MAIN_URL, '/api/products');
            
            const { data } = await axios.get(endpoint, {
                headers: {
                    "x-company-id": company_id,
                }
            });
            
            if (data.items && Array.isArray(data.items)) {
                setProducts(data.items);
            } else {
                setError("No products found");
            }
        } catch (err) {
            console.error("Error fetching products:", err);
            setError("Failed to load products");
        } finally {
            setLoading(false);
        }
    };

    const handleProductClick = (product) => {
        setSelectedProduct(product);
        setSelectedImage(null);
        setGeneratedImage(null);
        setSuccess(null);
        setError(null);
    };

    const handleImageSelect = (imageUrl) => {
        setSelectedImage(imageUrl);
        setError(null);
    };

    const handleGenerate = async () => {
        if (!selectedImage) {
            setError("Please select an image first");
            return;
        }

        try {
            setGenerating(true);
            setError(null);
            
            const { data } = await axios.post(
                urlJoin(EXAMPLE_MAIN_URL, '/api/generate-fashion-model'),
                {
                    imageUrls: [selectedImage],
                    prompt: prompt,
                    aspectRatio: aspectRatio
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        "x-company-id": company_id,
                    }
                }
            );

            if (data.success && data.output && data.output.length > 0) {
                setGeneratedImage(data.output[0]);
                setShowResultDialog(true);
            } else {
                setError(data.message || "Failed to generate fashion model image");
            }
        } catch (err) {
            console.error("Error generating image:", err);
            setError("Failed to generate image. Please try again.");
        } finally {
            setGenerating(false);
        }
    };

    const handleAddToProduct = async () => {
        if (!generatedImage || !selectedProduct) {
            setError("No image to add");
            return;
        }

        try {
            setSavingToProduct(true);
            setError(null);

            const { data } = await axios.post(
                urlJoin(EXAMPLE_MAIN_URL, `/api/products/update-media/${selectedProduct.uid}`),
                {
                    imageUrl: generatedImage
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        "x-company-id": company_id,
                    }
                }
            );

            if (data.success) {
                const message = data.message || "✅ Image successfully generated!";
                setSuccess(`${message}\n\nImage URL: ${data.imageUrl || generatedImage}`);
                setShowResultDialog(false);
                
                // Refresh products to show updated media
                await fetchProducts();
                
                // Clear selections after 5 seconds to allow user to see the URL
                setTimeout(() => {
                    setSelectedProduct(null);
                    setSelectedImage(null);
                    setGeneratedImage(null);
                    setSuccess(null);
                }, 5000);
            } else {
                setError(data.message || "Failed to add image to product");
            }
        } catch (err) {
            console.error("Error adding image to product:", err);
            setError("Failed to add image to product. Please try again.");
        } finally {
            setSavingToProduct(false);
        }
    };

    const aspectRatioOptions = [
        { value: "", label: "Original" },
        { value: "21:9", label: "21:9 (Ultrawide)" },
        { value: "16:9", label: "16:9 (Widescreen)" },
        { value: "4:3", label: "4:3 (Standard)" },
        { value: "3:2", label: "3:2 (Photo)" },
        { value: "1:1", label: "1:1 (Square)" },
        { value: "2:3", label: "2:3 (Portrait)" },
        { value: "3:4", label: "3:4 (Portrait)" },
        { value: "9:16", label: "9:16 (Mobile)" },
    ];

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                <Sparkles className="w-8 h-8 text-purple-600" />
                                Generate Fashion Model
                            </h1>
                            <p className="text-gray-600 mt-2">
                                Select a product and image to transform it into a professional fashion photoshoot
                            </p>
                        </div>

                        {/* Success Message */}
                        {success && (
                            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                                <Check className="w-5 h-5 text-green-600" />
                                <p className="text-green-800 font-medium">{success}</p>
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 text-red-600" />
                                <p className="text-red-800">{error}</p>
                            </div>
                        )}

                        {/* Products Grid */}
                        <Card className="mb-6 bg-white/70 backdrop-blur-sm border border-slate-200 shadow-xl rounded-3xl overflow-hidden">
                            <div className="p-8">
                                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                                    <div className="h-10 w-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center">
                                        <ImageIcon className="h-5 w-5 text-purple-600" />
                                    </div>
                                    Select a Product
                                </h2>
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-20">
                                        <Loader2 className="w-12 h-12 animate-spin text-purple-600 mb-4" />
                                        <span className="text-gray-600 font-medium">Loading products...</span>
                                    </div>
                                ) : products.length === 0 ? (
                                    <div className="text-center py-20 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100">
                                        <ImageIcon className="w-20 h-20 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-600 text-lg font-medium">No products found</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        {products.slice(0, 4).map((product) => (
                                            <div
                                                key={product.uid}
                                                onClick={() => handleProductClick(product)}
                                                className={`group relative cursor-pointer rounded-2xl overflow-hidden transition-all duration-300 ${
                                                    selectedProduct?.uid === product.uid
                                                        ? 'ring-4 ring-purple-500 shadow-2xl shadow-purple-200 scale-105'
                                                        : 'hover:shadow-xl hover:scale-[1.02] shadow-lg'
                                                }`}
                                            >
                                                {/* Image Container */}
                                                <div className="relative h-64 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
                                                    {product.media && product.media.length > 0 ? (
                                                        <img
                                                            src={product.media[0].url}
                                                            alt={product.name}
                                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <ImageIcon className="w-16 h-16 text-gray-400" />
                                                        </div>
                                                    )}
                                                    
                                                    {/* Overlay */}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                    
                                                    {/* Selected Badge */}
                                                    {selectedProduct?.uid === product.uid && (
                                                        <div className="absolute top-3 right-3 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                                            <Check className="w-3 h-3" />
                                                            Selected
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Product Info */}
                                                <div className="bg-white p-4 border-t border-slate-100">
                                                    <h3 className="font-bold text-slate-900 truncate text-base mb-1">
                                                        {product.name}
                                                    </h3>
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-sm text-slate-500 font-medium">
                                                            {product.media?.length || 0} images
                                                        </p>
                                                        {selectedProduct?.uid === product.uid && (
                                                            <div className="h-2 w-2 bg-purple-600 rounded-full animate-pulse" />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                {products.length > 4 && (
                                    <div className="mt-6 text-center">
                                        <p className="text-sm text-slate-500 font-medium">
                                            Showing first 4 products. {products.length - 4} more available.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Image Selection */}
                        {selectedProduct && (
                            <Card className="mb-6">
                                <div className="p-6">
                                    <h2 className="text-xl font-semibold mb-4">
                                        Select an Image from {selectedProduct.name}
                                    </h2>
                                    {selectedProduct.media && selectedProduct.media.length > 0 ? (
                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                            {selectedProduct.media.map((media, index) => (
                                                <div
                                                    key={index}
                                                    onClick={() => handleImageSelect(media.url)}
                                                    className={`cursor-pointer border-2 rounded-lg overflow-hidden transition-all hover:shadow-lg ${
                                                        selectedImage === media.url
                                                            ? 'border-purple-600 ring-2 ring-purple-300'
                                                            : 'border-gray-200 hover:border-purple-300'
                                                    }`}
                                                >
                                                    <img
                                                        src={media.url}
                                                        alt={`${selectedProduct.name} - ${index + 1}`}
                                                        className="w-full h-32 object-cover"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-600">No images available for this product</p>
                                    )}
                                </div>
                            </Card>
                        )}

                        {/* Generation Controls */}
                        {selectedImage && (
                            <Card>
                                <div className="p-6">
                                    <h2 className="text-xl font-semibold mb-4">Generation Settings</h2>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Prompt (Optional - Customize the generation)
                                            </label>
                                            <textarea
                                                value={prompt}
                                                onChange={(e) => setPrompt(e.target.value)}
                                                rows={3}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                placeholder="Describe how you want the fashion model to look..."
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Aspect Ratio (Optional)
                                            </label>
                                            <select
                                                value={aspectRatio}
                                                onChange={(e) => setAspectRatio(e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            >
                                                {aspectRatioOptions.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="pt-4">
                                            <Button
                                                onClick={handleGenerate}
                                                disabled={generating}
                                                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 text-lg font-semibold"
                                            >
                                                {generating ? (
                                                    <>
                                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                        Generating Fashion Model...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles className="w-5 h-5 mr-2" />
                                                        Generate Fashion Model
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>
                </main>
            </div>

            {/* Result Dialog */}
            {showResultDialog && generatedImage && (
                <Dialog open={showResultDialog} onClose={() => setShowResultDialog(false)}>
                    <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                            <Sparkles className="w-6 h-6 text-purple-600" />
                            Generated Fashion Model
                        </h2>
                        
                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-2">Original Image</h3>
                                <img
                                    src={selectedImage}
                                    alt="Original"
                                    className="w-full rounded-lg border border-gray-200"
                                />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-2">Generated Fashion Model</h3>
                                <img
                                    src={generatedImage}
                                    alt="Generated"
                                    className="w-full rounded-lg border border-purple-300"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <Button
                                onClick={handleAddToProduct}
                                disabled={savingToProduct}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 font-semibold"
                            >
                                {savingToProduct ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Adding to Product...
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-5 h-5 mr-2" />
                                        Add to Product Images
                                    </>
                                )}
                            </Button>
                            <Button
                                onClick={() => setShowResultDialog(false)}
                                className="px-8 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 font-semibold"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </Dialog>
            )}
        </div>
    );
}
