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

export default function ProductPage({ params }: { params: { product_id: string } }) {
  return <ProductDetailsClient params={params} />;
}
