export type WebProduct = {
  slug: string;
  name: string;
  tag: string;
  price: number;
  blurb: string;
  src: string;
};

export const WEB_PRODUCTS: WebProduct[] = [
  { slug: "phone-10t", name: "Flagship 5G Phone", tag: "Phones", price: 42999, blurb: "AMOLED display, fast charging, 256GB.", src: "/phones/ios-a.png" },
  { slug: "headphones-anc", name: "Cloud ANC Headphones", tag: "Audio", price: 2999, blurb: "Active noise cancelling, soft ear cushions.", src: "/products/headphones-anc.png" },
  { slug: "earbuds-chrome", name: "Chrome ANC Earbuds", tag: "Audio", price: 1999, blurb: "Quad mic, 40-hour playtime with the case.", src: "/products/earbuds-chrome.png" },
  { slug: "powerbank", name: "42,800mAh Power Bank", tag: "Power", price: 2499, blurb: "Four built-in cables, 22.5W PD in and out.", src: "/products/powerbank.png" },
  { slug: "headphones-red", name: "Studio Over-Ear", tag: "Audio", price: 3499, blurb: "Wireless over-ear with deep, balanced sound.", src: "/products/headphones-red.png" },
  { slug: "charger-20w", name: "20W PD Charger + Cable", tag: "Power", price: 1299, blurb: "USB-C fast charge, Lightning cable included.", src: "/products/charger-20w.png" },
  { slug: "earbuds-yellow", name: "Punch Buds", tag: "Audio", price: 1499, blurb: "Bass-forward buds in a pocket-size case.", src: "/products/earbuds-yellow.png" },
  { slug: "cable-c-lightning", name: "USB-C to Lightning", tag: "Cables", price: 499, blurb: "MFi-grade, tangle-free, 1m.", src: "/products/cable-c-lightning.png" },
  { slug: "earbuds-pro", name: "Power-Case Buds", tag: "Audio", price: 1799, blurb: "Charging case with a digital battery display.", src: "/products/earbuds-pro.png" },
];

export const WEB_REVIEWS = [
  { name: "Aarav S.", item: "Screen replacement", stars: 5, text: "Cracked screen in the morning, back in my hand before lunch. Looks and feels brand new." },
  { name: "Meera K.", item: "Flagship 5G phone", stars: 5, text: "They moved all my data across and fitted the screen guard. Zero stress, fair price." },
  { name: "Imran H.", item: "Power bank", stars: 5, text: "Charges my phone and earbuds together on a full day out. Exactly as described." },
  { name: "Divya R.", item: "Battery replacement", stars: 4, text: "Phone lasts all day again. Honest advice that I didn't need a new handset." },
  { name: "Rahul P.", item: "ANC headphones", stars: 5, text: "Let me test three pairs in store before buying. Noise cancelling is superb." },
  { name: "Sana A.", item: "Water damage rescue", stars: 5, text: "Thought my phone was gone. They saved it and recovered every photo." },
];

export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

export const shopUrl = (slug?: string) =>
  slug ? `/home?product=${encodeURIComponent(slug)}` : "/home";
