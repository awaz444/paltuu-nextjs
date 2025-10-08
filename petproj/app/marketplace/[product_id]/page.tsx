import { Metadata } from "next";
import ProductDetailsClient from "./ProductDetailsClient";

async function getProduct(product_id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bazaar/products/${product_id}`);
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({ params }: { params: { product_id: string } }): Promise<Metadata> {
  const product = await getProduct(params.product_id);
  console.log("Product for metadata:", product);

  if (!product) {
    return {
      title: "Product Not Found",
      description: "The product you are looking for does not exist.",
    };
  }

  return {
    title: product.seo_title || product.title,
    description: product.seo_description || product.description,
    openGraph: {
      title: product.seo_title || product.title,
      description: product.seo_description || product.description,
      images: product.images?.[0] ? [product.images[0]] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: product.seo_title || product.title,
      description: product.seo_description || product.description,
      images: product.images?.[0] ? [product.images[0]] : [],
    },
  };
}

export default async function ProductPage({ params }: { params: { product_id: string } }) {
  // Fetch product data once on the server
  const product = await getProduct(params.product_id);
  
  // Fetch reviews on the server as well
  let reviews = [];
  if (product) {
    try {
      const revRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bazaar/reviews?product_id=${product.product_id}`);
      if (revRes.ok) {
        reviews = await revRes.json();
      }
    } catch (e) {
      console.error("Error fetching reviews:", e);
    }
  }

  return <ProductDetailsClient params={params} initialProduct={product} initialReviews={reviews} />;
}