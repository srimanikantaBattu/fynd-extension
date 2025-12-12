
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { ComparisonView } from '../components/comparison/ComparisonView';
import urlJoin from "url-join";

const EXAMPLE_MAIN_URL = window.location.origin;

export default function Dashboard() {
  const { application_id, company_id } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchData();
  }, [application_id, company_id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Crawled Data (Source of Truth for Comparison List)
      // This ensures we always show the 5 crawled products from MongoDB
      const crawledResponse = await axios.get(urlJoin(EXAMPLE_MAIN_URL, '/api/comparison-data'));
      const crawledItems = crawledResponse.data.data?.crawledData || [];
      console.log(`Fetched ${crawledItems.length} crawled items`);

      // 2. Fetch "My Products" (Context Aware)
      // We try to fetch the company or app products to enrich the data (e.g. valid official images)
      let myProducts = [];
      try {
        const productApiUrl = application_id 
            ? `/api/products/application/${application_id}` 
            : `/api/products`;
            
        // Note: The Company ID is typically handled by the FDK extension middleware via cookies/session,
        // but passing it in header if available doesn't hurt.
        const config = company_id ? { headers: { "x-company-id": company_id } } : {};
        
        const productResponse = await axios.get(urlJoin(EXAMPLE_MAIN_URL, productApiUrl), config);
        myProducts = productResponse.data.items || [];
        console.log(`Fetched ${myProducts.length} Fynd products`);
      } catch (err) {
          console.warn("Failed to fetch Fynd products (ignoring for comparison):", err);
      }

      // 3. Merge Data (Client-Side Aggregation)
      const aggregatedData = crawledItems.map(crawledItem => {
          // Priority 1: Match by Slug
          // Priority 2: Fuzzy Name match
          const fyndMatch = myProducts.find(p => 
              (p.slug && crawledItem.slug && p.slug === crawledItem.slug) || 
              (p.name && crawledItem.name && p.name.toLowerCase().trim() === crawledItem.name.toLowerCase().trim())
          );

          // Construct Fynd Details
          const fynd_details = fyndMatch || {
              name: crawledItem.name,
              slug: crawledItem.slug,
              media: [] 
          };

          // Determine Display Image
          let displayImage = null;
          if (fyndMatch && fyndMatch.media && fyndMatch.media.length > 0) {
              const imgObj = fyndMatch.media.find(m => m.type === "image");
              displayImage = imgObj ? imgObj.url : fyndMatch.media[0].url;
          } else {
              // Fallback to marketplace image
              const markets = crawledItem.marketplaces || {};
              for (const mKey of Object.keys(markets)) {
                  if (markets[mKey]?.items?.[0]?.image_url) {
                      displayImage = markets[mKey].items[0].image_url;
                      break;
                  }
              }
          }
          fynd_details.display_image = displayImage;

          let competitorData = crawledItem.marketplaces || {};
          let bestPrice = Infinity;
          let bestPlatform = null;

          // Calculate best price (only from valid prices)
          Object.entries(competitorData).forEach(([platform, data]) => {
              if (data && data.items && data.items.length > 0) {
                  const price = data.items[0].price?.value;
                  // Only consider valid numeric prices
                  if (price && typeof price === 'number' && price > 0 && price < bestPrice) {
                      bestPrice = price;
                      bestPlatform = platform;
                  }
              }
          });

          // Reset if no valid price found
          if (bestPrice === Infinity) {
              bestPrice = null;
              bestPlatform = null;
          }

          return {
              fynd_details: fynd_details,
              competitor_details: competitorData,
              best_price: bestPrice,
              best_platform: bestPlatform,
              has_competitor_data: true
          };
      });

      setData(aggregatedData);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setTimeout(() => setLoading(false), 500); // Small delay for smooth loader
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <Sidebar className="hidden md:block fixed inset-y-0" />
      <div className="flex-1 flex flex-col md:pl-64 transition-all duration-300">
        <Header />
        <main className="flex-1 p-6 lg:p-8 max-w-[1920px] mx-auto w-full">
            <ComparisonView 
                data={data} 
                loading={loading} 
                onRefresh={fetchData}
            />
        </main>
      </div>
    </div>
  );
}
