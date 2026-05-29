import { Metadata } from "next";
import ProductDetailsClient from "./ProductDetailsClient";

export const dynamic = "force-dynamic";

async function getProduct(product_id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/bazaar/products/${product_id}`);
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
  const product = await getProduct(params.product_id);

  let reviews = [];
  if (product) {
    try {
      const revRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/reviews?target_id=${product.product_id}&type=product`);
      if (revRes.ok) reviews = await revRes.json();
    } catch (e) {
      console.error("Error fetching reviews:", e);
    }
  }

  const productJsonLd = product
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product.seo_title || product.title,
        "description": product.seo_description || product.description,
        "image": Array.isArray(product.images) ? product.images : product.images ? [product.images] : [],
        "sku": product.sku || String(product.product_id),
        "url": `https://paltuu.pk/marketplace/${params.product_id}`,
        "brand": product.brand_name
          ? { "@type": "Brand", "name": product.brand_name }
          : { "@type": "Brand", "name": "Paltuu.pk" },
        "offers": {
          "@type": "Offer",
          "price": product.price,
          "priceCurrency": "PKR",
          "availability": "https://schema.org/InStock",
          "url": `https://paltuu.pk/marketplace/${params.product_id}`,
          "seller": {
            "@type": "Organization",
            "name": "Paltuu.pk",
            "url": "https://paltuu.pk"
          },
          "shippingDetails": {
            "@type": "OfferShippingDetails",
            "shippingDestination": {
              "@type": "DefinedRegion",
              "addressCountry": "PK"
            },
            "deliveryTime": {
              "@type": "ShippingDeliveryTime",
              "handlingTime": { "@type": "QuantitativeValue", "minValue": 1, "maxValue": 2, "unitCode": "DAY" },
              "transitTime": { "@type": "QuantitativeValue", "minValue": 2, "maxValue": 5, "unitCode": "DAY" }
            }
          }
        },
        ...(reviews.length > 0 && {
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": (reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1),
            "reviewCount": reviews.length,
            "bestRating": 5,
            "worstRating": 1
          }
        })
      }
    : null;

  return (
    <>
      {productJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
      )}
      <ProductDetailsClient params={params} initialProduct={product} initialReviews={reviews} />
    </>
  );
}