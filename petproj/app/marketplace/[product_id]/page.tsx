import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import ProductDetailsClient from "./ProductDetailsClient";
import CategoryProductsClient from "./CategoryProductsClient";

export const dynamic = "force-dynamic";

// ─── Category configuration ──────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<
  string,
  {
    h1: string;
    title: string;
    description: string;
    intro: string;
    faqs: { q: string; a: string }[];
    relatedLinks: { label: string; href: string }[];
  }
> = {
  "cat-food": {
    h1: "Best Cat Food in Pakistan",
    title: "Best Cat Food in Pakistan — Buy Online | Paltuu.pk",
    description:
      "Shop the best cat food brands in Pakistan including Royal Canin, Whiskas, Gourmet, and more. Premium dry and wet cat food with nationwide delivery. Find the right nutrition for your cat at Paltuu.pk.",
    intro:
      "Finding the right cat food in Pakistan can be tough — imports vary, prices fluctuate, and not every brand is available everywhere. At Paltuu.pk we stock Pakistan's most trusted cat food brands including Royal Canin, Whiskas, Gourmet, Felicia, and more. Whether you have a kitten, an indoor adult cat, or a senior feline, we have dry food, wet food, and treats to keep them healthy and happy. All orders ship nationwide to Karachi, Lahore, Islamabad, and beyond.",
    faqs: [
      {
        q: "What is the best cat food available in Pakistan?",
        a: "Royal Canin, Whiskas, and Gourmet are the most popular and widely trusted cat food brands in Pakistan. Royal Canin offers breed-specific and life-stage formulas, while Whiskas is widely available and budget-friendly. Paltuu.pk stocks all major brands.",
      },
      {
        q: "Is wet or dry cat food better for cats?",
        a: "Both have benefits. Dry food (kibble) is more convenient and better for dental health. Wet food has higher moisture content which helps with hydration and is preferred by picky eaters. Many vets recommend a mix of both.",
      },
      {
        q: "Where can I buy cat food online in Pakistan?",
        a: "Paltuu.pk offers online cat food delivery across Pakistan including Karachi, Lahore, and Islamabad. Browse our cat food range and order with nationwide delivery.",
      },
    ],
    relatedLinks: [
      { label: "Dog Food", href: "/marketplace/dog-food" },
      { label: "Cat Litter", href: "/marketplace/litter" },
      { label: "Pet Accessories", href: "/marketplace?category=accessories" },
      { label: "Adopt a Cat", href: "/browse-pets" },
    ],
  },

  "dog-food": {
    h1: "Best Dog Food in Pakistan",
    title: "Best Dog Food in Pakistan — Buy Online | Paltuu.pk",
    description:
      "Shop premium dog food brands in Pakistan — Pedigree, Royal Canin, ProChoice, Brit Care, and more. Dry and wet dog food for puppies, adults, and senior dogs. Nationwide delivery from Paltuu.pk.",
    intro:
      "Dogs in Pakistan deserve the best nutrition, and Paltuu.pk makes it easy to find. We stock Pakistan's top dog food brands including Pedigree, Royal Canin, ProChoice, and Brit Care across all life stages — puppy food, adult dog food, and senior formulas. Whether you have a small breed like a Pomeranian or a large breed like a German Shepherd, we have the right formula. Shop dog food online in Pakistan with delivery to Karachi, Lahore, Islamabad, and all major cities.",
    faqs: [
      {
        q: "What is the best dog food brand available in Pakistan?",
        a: "Pedigree is the most widely available dog food brand in Pakistan and a reliable choice for most breeds. Royal Canin offers breed-specific and age-specific formulas for more targeted nutrition. ProChoice and Brit Care are popular premium alternatives.",
      },
      {
        q: "How much dog food should I feed my dog per day?",
        a: "Feeding amounts depend on your dog's weight, age, and activity level. Most kibble packaging includes a feeding guide. As a rough rule, adult dogs need about 2–3% of their body weight in food daily. Always consult your vet for specific advice.",
      },
      {
        q: "Where can I buy dog food online in Pakistan?",
        a: "Paltuu.pk delivers dog food across Pakistan including Karachi, Lahore, Islamabad, and Rawalpindi. Browse all available brands and order online for home delivery.",
      },
    ],
    relatedLinks: [
      { label: "Cat Food", href: "/marketplace/cat-food" },
      { label: "Dog Accessories", href: "/marketplace?category=accessories" },
      { label: "Grooming Products", href: "/marketplace?category=grooming" },
      { label: "Adopt a Dog", href: "/browse-pets" },
    ],
  },

  litter: {
    h1: "Cat Litter in Pakistan",
    title: "Buy Cat Litter in Pakistan — Clumping & Non-Clumping | Paltuu.pk",
    description:
      "Buy cat litter online in Pakistan. Shop clumping, non-clumping, and silica gel cat litter brands with nationwide delivery. Keep your cat's litter box clean with Paltuu.pk.",
    intro:
      "Choosing the right cat litter matters for both your cat's comfort and your home's hygiene. Paltuu.pk offers a range of cat litter options available in Pakistan — clumping clay litter for easy scooping, non-clumping litter for budget-conscious owners, and silica gel crystals for odour control. We carry the brands most trusted by cat owners in Karachi, Lahore, and Islamabad, with easy online ordering and nationwide delivery.",
    faqs: [
      {
        q: "What type of cat litter is best?",
        a: "Clumping cat litter is generally preferred because it makes it easy to scoop waste daily, keeping the litter box cleaner for longer. Silica gel litter offers superior odour control. Non-clumping litter is the most affordable option and needs to be fully replaced more often.",
      },
      {
        q: "How often should I change cat litter?",
        a: "With clumping litter, scoop daily and do a full litter change every 2–4 weeks. With non-clumping litter, change the entire box every 1–2 weeks. Silica gel litter can last up to a month with daily stirring.",
      },
      {
        q: "Where can I buy cat litter in Pakistan?",
        a: "Paltuu.pk offers online cat litter delivery across Pakistan. Browse our range and get cat litter delivered to Karachi, Lahore, Islamabad, and all major cities.",
      },
    ],
    relatedLinks: [
      { label: "Cat Food", href: "/marketplace/cat-food" },
      { label: "Cat Accessories", href: "/marketplace?category=accessories" },
      { label: "Adopt a Cat", href: "/browse-pets" },
      { label: "Find a Vet", href: "/pet-care" },
    ],
  },
};

const CATEGORY_SLUGS = new Set(Object.keys(CATEGORY_CONFIG));

// ─── Product helpers ──────────────────────────────────────────────────────────

async function getProduct(product_id: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/bazaar/products/${product_id}`
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getCategoryProducts(category: string) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
    const res = await fetch(
      `${apiUrl}/api/v1/bazaar/products?category=${category}&limit=24`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.rows ?? [];
  } catch {
    return [];
  }
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: { product_id: string };
}): Promise<Metadata> {
  // Category page
  if (CATEGORY_SLUGS.has(params.product_id)) {
    const config = CATEGORY_CONFIG[params.product_id];
    return {
      title: { absolute: config.title },
      description: config.description,
      keywords: [
        config.h1.toLowerCase(),
        `${params.product_id} pakistan`,
        `buy ${params.product_id} pakistan`,
        `best ${params.product_id} pakistan`,
        "pet products pakistan",
        "paltuu",
      ],
      openGraph: {
        title: config.title,
        description: config.description,
        url: `https://paltuu.pk/marketplace/${params.product_id}`,
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: config.title,
        description: config.description,
      },
      alternates: {
        canonical: `https://paltuu.pk/marketplace/${params.product_id}`,
      },
    };
  }

  // Product page
  const product = await getProduct(params.product_id);
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function MarketplaceDynamicPage({
  params,
}: {
  params: { product_id: string };
}) {
  // ── Category landing page ────────────────────────────────────────────────
  if (CATEGORY_SLUGS.has(params.product_id)) {
    const config = CATEGORY_CONFIG[params.product_id];
    const products = await getCategoryProducts(params.product_id);

    const faqJsonLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: config.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: { "@type": "Answer", text: faq.a },
      })),
    };

    return (
      <div className="min-h-screen bg-gray-50">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />

        {/* SEO header — server-rendered, fully crawlable */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4 py-10 md:py-16">
            <nav className="text-sm text-gray-500 mb-4 flex items-center gap-1">
              <Link href="/" className="hover:text-primary transition-colors">Home</Link>
              <span>/</span>
              <Link href="/marketplace" className="hover:text-primary transition-colors">Shop</Link>
              <span>/</span>
              <span className="text-gray-800 font-medium">{config.h1}</span>
            </nav>

            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
              {config.h1}
            </h1>
            <p className="text-gray-600 text-base md:text-lg max-w-3xl leading-relaxed">
              {config.intro}
            </p>

            <div className="flex flex-wrap gap-3 mt-6">
              {config.relatedLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium bg-primary/10 text-primary px-4 py-2 rounded-full hover:bg-primary hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Product grid */}
        <div className="max-w-6xl mx-auto px-4 py-10">
          <CategoryProductsClient
            category={params.product_id}
            initialProducts={products}
          />
        </div>

        {/* FAQ */}
        <div className="bg-white border-t border-gray-100 mt-10">
          <div className="max-w-3xl mx-auto px-4 py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              Frequently Asked Questions
            </h2>
            <div className="space-y-8">
              {config.faqs.map((faq, i) => (
                <div key={i}>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.q}</h3>
                  <p className="text-gray-600 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 p-6 bg-primary/5 border border-primary/20 rounded-2xl text-center">
              <p className="text-gray-700 font-medium mb-4">Have a question about your pet?</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/pet-care"
                  className="inline-flex items-center justify-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-full hover:bg-primary/90 transition-colors"
                >
                  Find a Vet
                </Link>
                <Link
                  href="/browse-pets"
                  className="inline-flex items-center justify-center gap-2 border-2 border-primary text-primary font-semibold px-6 py-3 rounded-full hover:bg-primary hover:text-white transition-colors"
                >
                  Adopt a Pet
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Product detail page ──────────────────────────────────────────────────
  const product = await getProduct(params.product_id);

  let reviews = [];
  if (product) {
    try {
      const revRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/reviews?target_id=${product.product_id}&type=product`
      );
      if (revRes.ok) reviews = await revRes.json();
    } catch (e) {
      console.error("Error fetching reviews:", e);
    }
  }

  const productJsonLd = product
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.seo_title || product.title,
        description: product.seo_description || product.description,
        image: Array.isArray(product.images)
          ? product.images
          : product.images
          ? [product.images]
          : [],
        sku: product.sku || String(product.product_id),
        url: `https://paltuu.pk/marketplace/${params.product_id}`,
        brand: product.brand_name
          ? { "@type": "Brand", name: product.brand_name }
          : { "@type": "Brand", name: "Paltuu.pk" },
        offers: {
          "@type": "Offer",
          price: product.price,
          priceCurrency: "PKR",
          availability: "https://schema.org/InStock",
          url: `https://paltuu.pk/marketplace/${params.product_id}`,
          seller: { "@type": "Organization", name: "Paltuu.pk", url: "https://paltuu.pk" },
          shippingDetails: {
            "@type": "OfferShippingDetails",
            shippingDestination: {
              "@type": "DefinedRegion",
              addressCountry: "PK",
            },
          },
        },
        ...(reviews.length > 0 && {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: (
              reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) /
              reviews.length
            ).toFixed(1),
            reviewCount: reviews.length,
            bestRating: 5,
            worstRating: 1,
          },
        }),
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
      <ProductDetailsClient
        params={params}
        initialProduct={product}
        initialReviews={reviews}
      />
    </>
  );
}
