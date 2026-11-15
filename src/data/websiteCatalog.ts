import { useEffect, useState } from "react";
import { productService } from "../services/productService";

export type WebProduct = {
  slug: string;
  name: string;
  tag: string;
  /** Only real catalog products carry a price; showcase cards never invent one. */
  price?: number;
  blurb: string;
  src: string;
  /** Where the card's call to action goes. */
  href: string;
};

/**
 * Category showcase shown until (or if) the API returns featured products.
 * These are illustrations of what we stock, so they link to the category,
 * not to a product, and they carry no price.
 */
export const WEB_PRODUCTS: WebProduct[] = [
  { slug: "show-phones", name: "Smartphones", tag: "Phones", blurb: "The latest 5G phones from top brands.", src: "/phones/ios-a.png", href: "/phones" },
  { slug: "show-headphones", name: "Headphones", tag: "Audio", blurb: "Noise-cancelling and studio over-ear headphones.", src: "/products/headphones-anc.png", href: "/accessories" },
  { slug: "show-earbuds", name: "Wireless Earbuds", tag: "Audio", blurb: "True-wireless buds with long battery life.", src: "/products/earbuds-chrome.png", href: "/accessories" },
  { slug: "show-powerbanks", name: "Power Banks", tag: "Power", blurb: "High-capacity packs with fast charging.", src: "/products/powerbank.png", href: "/accessories" },
  { slug: "show-chargers", name: "Chargers", tag: "Power", blurb: "USB-C PD fast chargers and cables.", src: "/products/charger-20w.png", href: "/accessories" },
  { slug: "show-cables", name: "Cables", tag: "Cables", blurb: "Durable, tangle-free charging cables.", src: "/products/cable-c-lightning.png", href: "/accessories" },
];

function toWebProduct(p: any): WebProduct | null {
  const src = p.coverImage || p.images?.[0] || p.variants?.[0]?.images?.[0];
  if (!p?.id || !p.name || !src) return null;
  const price = Number(p.minPrice) || 0;
  return {
    slug: `p-${p.id}`,
    name: p.name,
    tag: p.category || p.brand || "Featured",
    price: price > 0 ? price : undefined,
    blurb: [p.brand, p.category].filter(Boolean).join(" · ") || "In stock now",
    src,
    href: `/product/${p.id}`,
  };
}

let landingCache: WebProduct[] | null = null;

/** Real featured products for the landing carousel; falls back to the category showcase. */
export function useLandingProducts(): WebProduct[] {
  const [items, setItems] = useState<WebProduct[]>(() => landingCache ?? WEB_PRODUCTS);

  useEffect(() => {
    if (landingCache) return;
    let alive = true;
    (async () => {
      try {
        let list = await productService.list({ is_featured: true, page_size: 9 });
        if (list.length < 4) list = [...list, ...(await productService.list({ page_size: 9 }))];
        const seen = new Set<string>();
        const real = list
          .map(toWebProduct)
          .filter((p): p is WebProduct => !!p && !seen.has(p.slug) && !!seen.add(p.slug))
          .slice(0, 9);
        // A ring of one or two products looks broken; keep the showcase instead.
        if (real.length >= 4) {
          landingCache = real;
          if (alive) setItems(real);
        }
      } catch {
        /* keep the category showcase */
      }
    })();
    return () => { alive = false; };
  }, []);

  return items;
}

export const WEB_REVIEWS = [
  { name: "Aarav S.", item: "Screen replacement", stars: 5, text: "Cracked screen in the morning, back in my hand before lunch. Looks and feels brand new." },
  { name: "Meera K.", item: "Flagship 5G phone", stars: 5, text: "They moved all my data across and fitted the screen guard. Zero stress, fair price." },
  { name: "Imran H.", item: "Power bank", stars: 5, text: "Charges my phone and earbuds together on a full day out. Exactly as described." },
  { name: "Divya R.", item: "Battery replacement", stars: 4, text: "Phone lasts all day again. Honest advice that I didn't need a new handset." },
  { name: "Rahul P.", item: "ANC headphones", stars: 5, text: "Let me test three pairs in store before buying. Noise cancelling is superb." },
  { name: "Sana A.", item: "Water damage rescue", stars: 5, text: "Thought my phone was gone. They saved it and recovered every photo." },
];

export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

