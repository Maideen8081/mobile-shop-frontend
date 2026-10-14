import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ChatAssistantIcon from "../ecommerce/ChatAssistantIcon";
import { WEB_PRODUCTS, WEB_REVIEWS, inr, shopUrl } from "../../data/websiteCatalog";
import "../../styles/website-experience.css";

gsap.registerPlugin(ScrollTrigger);

// Touch-first version of WebsiteExperience: same brand and catalog, but native
// scrolling, swipe carousels and light reveal animations instead of pinned 3D scenes.

const C = {
  bg: "#07040a",
  fg: "#f6efe9",
  muted: "#8f8590",
  border: "rgba(246,239,233,0.12)",
  primary: "#ff3b4e",
  accent: "#ff8a3d",
  magenta: "#c2185b",
  card: "#140910",
};

const TAGS = ["All", ...Array.from(new Set(WEB_PRODUCTS.map((p) => p.tag)))];

const STEPS = [
  ["01", "Bring it in", "Walk in or book a slot. No appointment needed for quick fixes."],
  ["02", "Free diagnosis", "We find the fault, quote it upfront and only start once you say yes."],
  ["03", "Fixed & covered", "Collect your phone with a 6-month warranty on the repair."],
];

const STATS: [number, string, string, string][] = [
  [30, "", "min", "Express swaps"],
  [6, "", "mo", "Repair warranty"],
  [0, "₹", "", "Diagnosis"],
];

/** Index of the card nearest the left edge of a horizontal scroller. */
function useSnapIndex() {
  const ref = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const onScroll = () => {
    const el = ref.current;
    const first = el?.firstElementChild as HTMLElement | null;
    if (!el || !first) return;
    const step = first.offsetWidth + 12;
    setIdx(Math.round(el.scrollLeft / step));
  };
  const goTo = (i: number) => {
    const el = ref.current;
    const child = el?.children[i] as HTMLElement | undefined;
    if (el && child) el.scrollTo({ left: child.offsetLeft - el.offsetLeft - 20, behavior: "smooth" });
  };
  return { ref, idx, onScroll, goTo };
}

export default function MobileWebsiteExperience() {
  const root = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);
  const [tag, setTag] = useState("All");
  const [showBar, setShowBar] = useState(false);
  const products = tag === "All" ? WEB_PRODUCTS : WEB_PRODUCTS.filter((p) => p.tag === tag);
  const shelf = useSnapIndex();
  const reviews = useSnapIndex();

  useEffect(() => {
    shelf.ref.current?.scrollTo({ left: 0 });
  }, [tag]);

  useEffect(() => {
    if (!root.current) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      /* Loader → hero */
      const counter = { v: 0 };
      gsap.timeline({ onComplete: () => ScrollTrigger.refresh() })
        .to(counter, { v: 100, duration: reduce ? 0.1 : 1, ease: "power2.inOut", onUpdate: () => setCount(Math.round(counter.v)) })
        .to(".wem-loader", { yPercent: -100, duration: reduce ? 0.1 : 0.7, ease: "expo.inOut" })
        .from(".wem-hero-word", { y: 50, opacity: 0, duration: 0.9, stagger: 0.1, ease: "expo.out" }, "-=0.3")
        .from(".wem-hero-phone", { y: 60, opacity: 0, scale: 0.92, duration: 1, ease: "expo.out" }, "<0.1")
        .from(".wem-hero-fade", { y: 16, opacity: 0, duration: 0.6, stagger: 0.08 }, "-=0.5")
        .from(".wem-orbit", { scale: 0.4, opacity: 0, duration: 0.8, stagger: 0.1, ease: "back.out(1.7)" }, "-=0.6");

      if (reduce) return;

      /* Gentle hero parallax */
      gsap.to(".wem-hero-phone", { yPercent: 14, scale: 1.06, ease: "none", scrollTrigger: { trigger: ".wem-hero", start: "top top", end: "bottom top", scrub: true } });

      /* Section reveals */
      gsap.utils.toArray<HTMLElement>(".wem-reveal").forEach((el) => {
        gsap.from(el, { y: 36, opacity: 0, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%", once: true } });
      });

      /* Step numbers fill in as they scroll past */
      gsap.utils.toArray<HTMLElement>(".wem-step-num").forEach((el) => {
        gsap.fromTo(el, { backgroundSize: "0% 100%" }, { backgroundSize: "100% 100%", ease: "none", scrollTrigger: { trigger: el, start: "top 85%", end: "top 45%", scrub: true } });
      });

      /* Count-up stats */
      gsap.utils.toArray<HTMLElement>(".wem-count").forEach((el) => {
        const to = parseFloat(el.dataset.to || "0"), dec = parseInt(el.dataset.dec || "0"), o = { v: 0 };
        gsap.to(o, {
          v: to, duration: 1.4, ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 92%", once: true },
          onUpdate: () => { el.textContent = o.v.toLocaleString("en-IN", { minimumFractionDigits: dec, maximumFractionDigits: dec }); },
        });
      });
    }, root);

    /* Sticky purchase bar after the hero */
    const st = ScrollTrigger.create({ trigger: ".wem-hero", start: "bottom 70%", onToggle: (s) => setShowBar(s.isActive), end: "max" });

    return () => { st.kill(); ctx.revert(); };
  }, []);

  return (
    <div ref={root} className="we wem relative min-h-screen" style={{ background: C.bg, color: C.fg, overflowX: "hidden" }}>
      {/* Loader */}
      <div className="wem-loader fixed inset-0 z-[100] flex flex-col items-center justify-center" style={{ background: C.primary, color: C.bg }}>
        <div className="font-display text-[28vw] font-extrabold leading-none tabular-nums">{count}%</div>
        <p className="mt-2 text-[11px] uppercase tracking-[0.3em]">Powering up the store</p>
      </div>

      {/* Top bar */}
      <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-5 pb-3 pt-[calc(env(safe-area-inset-top)+12px)]" style={{ background: "linear-gradient(to bottom, rgba(7,4,10,0.92), rgba(7,4,10,0.6) 70%, transparent)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}>
        <a href="#top" className="font-display text-lg font-bold tracking-tight" style={{ color: C.fg }}>
          mobileshop<span style={{ color: C.primary }}>.</span>
        </a>
        <div className="flex items-center gap-2">
          <Link to="/support" aria-label="Chat with PhoneFix Assistant" className="flex h-9 w-9 items-center justify-center rounded-full active:scale-90 transition" style={{ background: "rgba(246,239,233,0.08)", border: `1px solid ${C.border}` }}>
            <ChatAssistantIcon size={20} />
          </Link>
          <Link to="/home" className="rounded-full px-4 py-2 text-[13px] font-semibold active:scale-95 transition" style={{ background: C.primary, color: C.bg }}>
            Shop now
          </Link>
        </div>
      </header>

      {/* ══ HERO ══ */}
      <section id="top" className="wem-hero relative flex min-h-[100svh] flex-col items-center overflow-hidden px-5 pt-[calc(env(safe-area-inset-top)+80px)] pb-10">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(80% 45% at 50% 52%, rgba(194,24,91,0.5), transparent 70%)" }} />

        <h1 className="relative z-0 w-full text-center font-display font-extrabold leading-[0.85] tracking-tighter" style={{ fontSize: "clamp(64px, 22vw, 120px)" }}>
          <span className="wem-hero-word block" style={{ color: C.fg }}>MOBILE</span>
          <span className="wem-hero-word block" style={{ color: "transparent", WebkitTextStroke: `2px ${C.fg}` }}>SHOP</span>
        </h1>

        <div className="relative z-10 -mt-[3vw] flex w-full flex-1 items-center justify-center">
          <img src="/phones/ios-a.png" alt="" draggable={false} className="wem-hero-phone h-[44svh] w-auto max-w-[70vw] select-none object-contain drop-shadow-[0_30px_60px_rgba(255,59,78,0.4)]" />
          <img src="/products/earbuds-yellow.png" alt="" className="wem-orbit wem-bob absolute left-0 top-[8%] w-[24vw] max-w-[120px] drop-shadow-[0_16px_30px_rgba(255,138,61,0.35)]" />
          <img src="/products/powerbank.png" alt="" className="wem-orbit wem-bob-alt absolute right-0 top-[2%] w-[24vw] max-w-[120px] drop-shadow-[0_16px_30px_rgba(255,59,78,0.35)]" />
          <img src="/products/cable-c-lightning.png" alt="" className="wem-orbit wem-bob absolute bottom-[4%] right-[2%] w-[26vw] max-w-[130px] drop-shadow-[0_16px_30px_rgba(255,255,255,0.15)]" />
        </div>

        <p className="wem-hero-fade relative z-10 mt-4 max-w-[19rem] text-center text-[15px] leading-relaxed" style={{ color: C.muted }}>
          Phones, accessories and same-day repairs, all under one roof.
        </p>
        <div className="wem-hero-fade relative z-10 mt-6 grid w-full max-w-sm grid-cols-2 gap-3">
          <Link to="/home" className="flex h-12 items-center justify-center rounded-full text-[15px] font-semibold active:scale-95 transition" style={{ background: C.primary, color: C.bg }}>
            Shop now →
          </Link>
          <Link to="/book-repair" className="flex h-12 items-center justify-center rounded-full text-[15px] font-semibold active:scale-95 transition" style={{ border: `1px solid ${C.border}`, color: C.fg, background: "rgba(246,239,233,0.04)" }}>
            Book repair
          </Link>
        </div>
        <a href="#products" className="wem-hero-fade relative z-10 mt-8 flex flex-col items-center gap-1 text-[10px] uppercase tracking-[0.3em]" style={{ color: C.muted }}>
          Swipe up
          <span className="wem-bob text-base" style={{ color: C.fg }}>↓</span>
        </a>
      </section>

      {/* ══ TICKER ══ */}
      <section className="relative z-10 overflow-hidden py-10" aria-hidden="true">
        <div className="-mx-4 -rotate-[3deg] py-3" style={{ background: C.primary, color: C.bg }}>
          <div className="wem-marquee flex w-max whitespace-nowrap font-display text-3xl font-extrabold">
            {[0, 1].map((k) => (
              <span key={k} className="flex shrink-0 items-center gap-6 pr-6">
                {["Phones", "Earbuds", "Chargers", "Repairs", "Headphones"].map((w) => (
                  <span key={w} className="flex items-center gap-6"><span>{w}</span><span className="text-lg">✦</span></span>
                ))}
              </span>
            ))}
          </div>
        </div>
        <div className="-mx-4 -mt-1 rotate-[2deg] py-3" style={{ background: C.fg, color: C.bg }}>
          <div className="wem-marquee-rev flex w-max whitespace-nowrap font-display text-3xl font-extrabold">
            {[0, 1].map((k) => (
              <span key={k} className="flex shrink-0 items-center gap-6 pr-6">
                {["Screens fixed", "Batteries swapped", "Warranty included", "Easy checkout"].map((w) => (
                  <span key={w} className="flex items-center gap-6"><span>{w}</span><span className="text-lg">✦</span></span>
                ))}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRODUCTS ══ */}
      <section id="products" className="relative pt-8 pb-14">
        <div className="wem-reveal px-5">
          <div className="mb-3 flex items-center gap-3 text-[11px] uppercase tracking-[0.3em]" style={{ color: C.primary }}>
            <span className="h-px w-10" style={{ background: C.primary }} />Chapter 01
          </div>
          <h2 className="font-display font-extrabold leading-[0.9] tracking-tighter" style={{ fontSize: "clamp(52px, 17vw, 96px)" }}>PRODUCTS</h2>
          <p className="mt-3 max-w-sm text-[15px]" style={{ color: C.muted }}>New phones, audio and charging gear. Swipe through and pick what you like.</p>
        </div>

        {/* Category chips */}
        <div className="wem-noscroll mt-6 flex gap-2 overflow-x-auto px-5" role="tablist" aria-label="Product categories">
          {TAGS.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tag === t}
              onClick={() => setTag(t)}
              className="h-9 shrink-0 rounded-full px-4 text-[13px] font-semibold transition active:scale-95"
              style={tag === t ? { background: C.fg, color: C.bg } : { border: `1px solid ${C.border}`, color: C.fg }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Swipe carousel */}
        <div ref={shelf.ref} onScroll={shelf.onScroll} className="wem-noscroll mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-5 px-5 pb-2">
          {products.map((p) => (
            <article key={p.slug} className="relative flex w-[72vw] max-w-[300px] shrink-0 snap-start flex-col overflow-hidden rounded-[26px] p-4" style={{ background: `linear-gradient(160deg, #22101a, ${C.card} 60%)`, border: `1px solid ${C.border}` }}>
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full blur-2xl" style={{ background: "radial-gradient(circle, rgba(255,59,78,0.35), transparent 70%)" }} />
              <span className="relative z-10 self-start rounded-full px-3 py-1 text-[11px] font-medium" style={{ border: `1px solid ${C.border}`, color: C.fg }}>{p.tag}</span>
              <div className="relative z-10 flex h-[34vw] max-h-[170px] items-center justify-center py-3">
                <img src={p.src} alt={p.name} loading="lazy" className="max-h-full max-w-[80%] object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.6)]" />
              </div>
              <h3 className="relative z-10 font-display text-xl font-bold leading-tight tracking-tight">{p.name}</h3>
              <p className="relative z-10 mt-1 line-clamp-2 text-[13px]" style={{ color: C.muted }}>{p.blurb}</p>
              <div className="relative z-10 mt-4 flex items-center justify-between">
                <span className="font-display text-2xl font-bold" style={{ color: C.primary }}>{inr(p.price)}</span>
                <Link to={shopUrl(p.slug)} aria-label={`Buy ${p.name}`} className="flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold active:scale-90 transition" style={{ background: C.primary, color: C.bg }}>
                  →
                </Link>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-4 flex justify-center gap-1.5">
          {products.map((p, i) => (
            <button key={p.slug} onClick={() => shelf.goTo(i)} aria-label={`Show ${p.name}`} className="h-1.5 rounded-full transition-all" style={{ width: i === shelf.idx ? 28 : 6, background: i === shelf.idx ? C.primary : C.border }} />
          ))}
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section className="px-5 pb-14">
        <p className="wem-reveal mb-4 text-[11px] uppercase tracking-[0.3em]" style={{ color: C.primary }}>How it works</p>
        {STEPS.map(([n, t, d]) => (
          <div key={n} className="wem-reveal flex items-start gap-4 py-5" style={{ borderBottom: `1px solid ${C.border}` }}>
            <div
              className="wem-step-num shrink-0 font-display text-[64px] font-extrabold leading-[0.85] tracking-tighter"
              style={{
                color: "transparent",
                WebkitTextStroke: `1.5px ${C.fg}`,
                backgroundImage: `linear-gradient(${C.primary},${C.primary})`,
                backgroundRepeat: "no-repeat",
                backgroundSize: "100% 100%",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
              }}
            >{n}</div>
            <div className="pt-1">
              <h3 className="font-display text-2xl font-bold">{t}</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed" style={{ color: C.muted }}>{d}</p>
            </div>
          </div>
        ))}

        <div className="wem-reveal mt-8 grid grid-cols-3 gap-2">
          {STATS.map(([n, pre, suf, t]) => (
            <div key={t} className="rounded-2xl px-2 py-4 text-center" style={{ background: C.card, border: `1px solid ${C.border}` }}>
              <div className="font-display text-[32px] font-extrabold leading-none tracking-tight" style={{ color: C.primary }}>
                {pre}<span className="wem-count" data-to={n}>{n}</span><span className="text-lg">{suf}</span>
              </div>
              <p className="mt-2 text-[11px] leading-tight" style={{ color: C.muted }}>{t}</p>
            </div>
          ))}
        </div>

        <Link to="/book-repair" className="wem-reveal mt-6 flex items-center gap-4 overflow-hidden rounded-[24px] p-4 active:scale-[0.98] transition" style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.magenta})`, color: C.fg }}>
          <div className="flex-1">
            <p className="text-[11px] uppercase tracking-[0.25em] opacity-80">Same-day repair</p>
            <p className="mt-1 font-display text-xl font-bold leading-tight">Cracked screen? Dead battery?</p>
            <p className="mt-2 text-[13px] font-semibold">Book a slot →</p>
          </div>
          <img src="/phones/ios-b.png" alt="" className="h-24 w-auto rotate-12 drop-shadow-[0_12px_24px_rgba(0,0,0,0.4)]" />
        </Link>
      </section>

      {/* ══ REVIEWS ══ */}
      <section id="reviews" className="pb-14" style={{ background: "linear-gradient(to bottom, transparent, #14060c 18%, #14060c 82%, transparent)" }}>
        <div className="wem-reveal px-5 pt-6">
          <p className="mb-2 text-[11px] uppercase tracking-[0.3em]" style={{ color: C.primary }}>Customer reviews</p>
          <h2 className="font-display text-[42px] font-bold leading-[1.02] tracking-tight">Loved by the neighbourhood.</h2>
          <div className="mt-5 flex items-center gap-4">
            <div className="font-display text-6xl font-extrabold" style={{ color: C.primary }}>
              <span className="wem-count" data-to="4.9" data-dec="1">4.9</span>
            </div>
            <div>
              <div className="text-lg tracking-widest" style={{ color: C.accent }}>★★★★★</div>
              <div className="text-[13px]" style={{ color: C.muted }}><span className="wem-count" data-to="1200">1,200</span>+ happy customers</div>
            </div>
          </div>
        </div>

        <div ref={reviews.ref} onScroll={reviews.onScroll} className="wem-noscroll mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-5 px-5 pb-2">
          {WEB_REVIEWS.map((r) => (
            <article key={r.name} className="flex min-h-[240px] w-[82vw] max-w-[340px] shrink-0 snap-start flex-col justify-between rounded-[26px] p-6" style={{ background: "#1a0b12", border: `1px solid ${C.border}`, boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>
              <div>
                <div className="mb-3 text-lg tracking-widest" style={{ color: C.accent }}>
                  {"★".repeat(r.stars)}<span style={{ color: C.border }}>{"★".repeat(5 - r.stars)}</span>
                </div>
                <p className="text-[17px] leading-relaxed">"{r.text}"</p>
              </div>
              <div className="mt-5 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full font-display text-lg font-bold" style={{ background: `linear-gradient(to bottom right, ${C.primary}, ${C.magenta})` }}>
                  {r.name[0]}
                </span>
                <div>
                  <div className="text-[15px] font-medium">{r.name}</div>
                  <div className="text-[13px]" style={{ color: C.muted }}>{r.item}</div>
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-4 flex justify-center gap-1.5">
          {WEB_REVIEWS.map((r, i) => (
            <button key={r.name} onClick={() => reviews.goTo(i)} aria-label={`Show review by ${r.name}`} className="h-1.5 rounded-full transition-all" style={{ width: i === reviews.idx ? 28 : 6, background: i === reviews.idx ? C.primary : C.border }} />
          ))}
        </div>
      </section>

      {/* ══ OUTRO ══ */}
      <section id="contact" className="relative flex min-h-[80svh] flex-col items-center justify-center overflow-hidden px-5 pb-32 pt-16 text-center">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(70% 40% at 50% 45%, rgba(255,59,78,0.28), transparent 70%)" }} />
        <img src="/phones/gold.png" alt="" className="wem-bob pointer-events-none absolute left-[-6%] top-[3%] w-[22vw] max-w-[110px] opacity-80" />
        <img src="/products/earbuds-chrome.png" alt="" className="wem-bob-alt pointer-events-none absolute right-[2%] top-[12%] w-[24vw] max-w-[120px]" />
        <img src="/products/charger-20w.png" alt="" className="wem-bob-alt pointer-events-none absolute bottom-[22%] left-[4%] w-[20vw] max-w-[100px]" />
        <img src="/products/phone-10t.png" alt="" className="wem-bob pointer-events-none absolute bottom-[20%] right-[-4%] w-[22vw] max-w-[110px] opacity-80" />

        <div className="relative z-10">
          <h2 className="wem-reveal font-display font-extrabold leading-[0.95] tracking-tighter" style={{ fontSize: "clamp(52px, 16vw, 90px)" }}>
            Drop in.<br />Power up.
          </h2>
          <p className="wem-reveal mx-auto mt-4 max-w-[17rem] text-[15px]" style={{ color: C.muted }}>Found something you like? Pick up where you left off.</p>
          <Link to="/home" className="wem-reveal mt-7 inline-flex h-14 items-center rounded-full px-9 text-[16px] font-semibold active:scale-95 transition" style={{ background: C.primary, color: C.bg }}>
            Continue purchase →
          </Link>
        </div>

        <footer className="absolute inset-x-0 bottom-0 z-10 flex justify-between px-5 pb-[calc(env(safe-area-inset-bottom)+88px)] text-[11px]" style={{ color: C.muted }}>
          <span>© {new Date().getFullYear()} mobileshop</span>
          <span>Phones · Accessories</span>
        </footer>
      </section>

      {/* Sticky purchase bar */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] transition-transform duration-500"
        style={{ transform: showBar ? "translateY(0)" : "translateY(120%)" }}
        aria-hidden={!showBar}
      >
        <div className="flex items-center gap-3 rounded-full p-1.5 pl-5 shadow-[0_16px_40px_rgba(0,0,0,0.6)]" style={{ background: "rgba(26,11,18,0.88)", border: `1px solid ${C.border}`, backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" }}>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold">Phones, audio & repairs</p>
            <p className="text-[11px]" style={{ color: C.muted }}>Free diagnosis · 6-mo warranty</p>
          </div>
          <Link to="/home" tabIndex={showBar ? 0 : -1} className="flex h-11 shrink-0 items-center rounded-full px-5 text-[14px] font-semibold active:scale-95 transition" style={{ background: C.primary, color: C.bg }}>
            Shop now →
          </Link>
        </div>
      </div>
    </div>
  );
}
