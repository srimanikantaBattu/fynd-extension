import React, { useState, useEffect } from "react";
import { useParams } from 'react-router-dom';
import "./style/home.css";
import greenDot from "../public/assets/green-dot.svg";
import grayDot from "../public/assets/grey-dot.svg";
import DEFAULT_NO_IMAGE from "../public/assets/default_icon_listing.png";
import loaderGif from "../public/assets/loader.gif";
import axios from "axios";
import urlJoin from "url-join";

const EXAMPLE_MAIN_URL = window.location.origin;

export const Home = () => {
  const [pageLoading, setPageLoading] = useState(false);
  const [productList, setProductList] = useState([]);
  const [tryOnImageUrl, setTryOnImageUrl] = useState("");
  const [tryOnResult, setTryOnResult] = useState(null);
  const [generating, setGenerating] = useState(false);
  const DOC_URL_PATH = "/help/docs/sdk/latest/platform/company/catalog/#getProducts";
  const DOC_APP_URL_PATH = "/help/docs/sdk/latest/platform/application/catalog#getAppProducts";
  const { application_id, company_id } = useParams();
  const documentationUrl ='https://api.fynd.com'
  
  useEffect(() => {
    isApplicationLaunch() ? fetchApplicationProducts() : fetchProducts();
  }, [application_id]);

  const fetchProducts = async () => {
    setPageLoading(true);
    try {
      const { data } = await axios.get(urlJoin(EXAMPLE_MAIN_URL, '/api/products'),{
        headers: {
          "x-company-id": company_id,
        }
      });
      setProductList(data.items);
    } catch (e) {
      console.error("Error fetching products:", e);
    } finally {
      setPageLoading(false);
    }
  };

  const fetchApplicationProducts = async () => {
    setPageLoading(true);
    try {
      const { data } = await axios.get(urlJoin(EXAMPLE_MAIN_URL, `/api/products/application/${application_id}`),{
        headers: {
          "x-company-id": company_id,
        }
      })
      setProductList(data.items);
    } catch (e) {
      console.error("Error fetching application products:", e);
    } finally {
      setPageLoading(false);
    }
  };
  

  const productProfileImage = (media) => {
    if (!media || !media.length) {
      return DEFAULT_NO_IMAGE;
    }
    const profileImg = media.find(m => m.type === "image");
    return profileImg?.url || DEFAULT_NO_IMAGE;
  };

  const getDocumentPageLink = () => {
    return documentationUrl
      .replace("api", "partners")
      .concat(isApplicationLaunch() ? DOC_APP_URL_PATH : DOC_URL_PATH);
  };

  const isApplicationLaunch = () => !!application_id;

  const handleTryOn = async () => {
    if (!tryOnImageUrl) return;
    setGenerating(true);
    setTryOnResult(null);
    try {
      const { data } = await axios.post(urlJoin(EXAMPLE_MAIN_URL, '/api/try-on'), {
        imageUrl: tryOnImageUrl
      });
      if (data.success && data.output && data.output.length > 0) {
        setTryOnResult(data.output[0]);
      }
    } catch (e) {
      console.error("Error generating try-on:", e);
      const errorMessage = e.response?.data?.message || "Failed to generate try-on. Check console for details.";
      alert(errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      {pageLoading ? (
        <div className="loader" data-testid="loader">
          <img src={loaderGif} alt="loader GIF" />
        </div>
      ) : (
        <div className="products-container">
          <div className="title">
            This is an example extension home page user interface.
          </div>

          <div className="section">
            <div className="heading">
              <span>Virtual Try-On</span>
            </div>
            <div className="description">
              Enter an image URL of a clothing item to generate a virtual try-on model.
            </div>
            <div style={{ marginTop: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input 
                type="text" 
                placeholder="Enter Image URL" 
                value={tryOnImageUrl} 
                onChange={(e) => setTryOnImageUrl(e.target.value)}
                style={{ padding: '8px', width: '300px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
              <button 
                onClick={handleTryOn} 
                disabled={generating || !tryOnImageUrl}
                style={{ 
                  padding: '8px 16px', 
                  backgroundColor: generating ? '#ccc' : '#2874f0', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px', 
                  cursor: generating ? 'not-allowed' : 'pointer' 
                }}
              >
                {generating ? "Generating..." : "Generate Try-On"}
              </button>
            </div>
            {tryOnResult && (
              <div style={{ marginTop: '20px' }}>
                <h4>Result:</h4>
                <div style={{ marginBottom: '10px', wordBreak: 'break-all' }}>
                  <strong>Output URL: </strong>
                  <a href={tryOnResult} target="_blank" rel="noopener noreferrer">{tryOnResult}</a>
                </div>
                <img src={tryOnResult} alt="Try-On Result" style={{ maxWidth: '100%', maxHeight: '500px', borderRadius: '8px' }} />
              </div>
            )}
          </div>

          <div className="section">
            <div className="heading">
              <span>Example {isApplicationLaunch() ? 'Application API' : 'Platform API'}</span> :
              <a href={getDocumentPageLink()} target="_blank" rel="noopener noreferrer">
                {isApplicationLaunch() ? 'getAppProducts' : 'getProducts'}
              </a>
            </div>
            <div className="description">
              This is an illustrative Platform API call to fetch the list of products
              in this company. Check your extension folder’s 'server.js'
              file to know how to call Platform API and start calling API you
              require.
            </div>
          </div>

          <div>
            {productList.map((product, index) => (
              <div className="product-list-container flex-row" key={`product-${product.name}-${index}`}>
                <img className="mr-r-12" src={product.is_active ? greenDot : grayDot} alt="status" />
                <div className="card-avatar mr-r-12">
                  <img src={productProfileImage(product.media)} alt={product.name} />
                </div>
                <div className="flex-column">
                  <div className="flex-row">
                    <div className="product-name" data-testid={`product-name-${product.id}`}>
                      {product.name}
                    </div>
                    <div className="product-item-code">|</div>
                    {product.item_code && (
                      <span className="product-item-code">
                        Item Code:
                        <span className="cl-RoyalBlue" data-testid={`product-item-code-${product.id}`}>
                          {product.item_code}
                        </span>
                      </span>
                    )}
                  </div>
                  {product.brand && (
                    <div className="product-brand-name" data-testid={`product-brand-name-${product.id}`}>
                      {product.brand.name}
                    </div>
                  )}
                  {product.category_slug && (
                    <div className="product-category" data-testid={`product-category-slug-${product.id}`}>
                      Category: <span>{product.category_slug}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
