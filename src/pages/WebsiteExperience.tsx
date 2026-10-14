import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { WEB_PRODUCTS, WEB_REVIEWS, inr, shopUrl } from "../data/websiteCatalog";
import "../styles/website-experience.css";

gsap.registerPlugin(ScrollTrigger);

const Letters = ({ text, className = "" }: { text: string; className?: string }) => (
  <span className={className} aria-label={text}>
    {text.split("").map((l, i) => (
      <span key={i} className="inline-block overflow-hidden align-top" aria-hidden="true">
        <span className="ch-l inline-block">{l}</span>
      </span>
    ))}
  </span>
);

const PHONES = {
  gold: { src: "/phones/gold.png", ratio: 400 / 980 },
  a: { src: "/phones/ios-a.png", ratio: 736 / 1449 },
  b: { src: "/phones/ios-b.png", ratio: 736 / 1168 },
} as const;

type PhoneKey = keyof typeof PHONES;

function PhoneImg({ which, className = "" }: { which: PhoneKey; className?: string }) {
  return (
    <img
      src={PHONES[which].src}
      alt=""
      draggable={false}
      className={`select-none drop-shadow-[0_40px_80px_rgba(255,59,78,0.35)] ${className}`}
    />
  );
}

const STORE_NAME = "MobileShop";

export default function WebsiteExperience() {
  const root = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);
  const [ringIdx, setRingIdx] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const lenis = new Lenis({ lerp: 0.09, smoothWheel: !reduce });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    lenis.stop();

    const ctx = gsap.context(() => {
      const counter = { v: 0 };
      const intro = gsap.timeline({ onComplete: () => lenis.start() });
      intro
        .to(counter, { v: 100, duration: reduce ? 0.1 : 1.8, ease: "power2.inOut", onUpdate: () => setCount(Math.round(counter.v)) })
        .to(".loader-inner", { yPercent: -30, opacity: 0, duration: 0.5, ease: "power2.in" })
        .to(".loader", { yPercent: -100, duration: 0.9, ease: "expo.inOut" }, "<0.15")
        .from(".hero-word", { yPercent: 110, rotateX: -80, duration: 1.1, stagger: 0.12, ease: "expo.out" }, "-=0.45")
        .from(".hero-phone", { y: 160, opacity: 0, scale: 0.8, rotateY: -70, duration: 1.4, ease: "expo.out" }, "<0.1")
        .from(".hero-fade", { opacity: 0, y: 20, duration: 0.8, stagger: 0.1 }, "-=0.8");

      const tiltX = gsap.quickTo(".hero-tilt", "rotateY", { duration: 0.8, ease: "power3.out" });
      const tiltY = gsap.quickTo(".hero-tilt", "rotateX", { duration: 0.8, ease: "power3.out" });
      const onMove = (e: PointerEvent) => {
        tiltX((e.clientX / window.innerWidth - 0.5) * 28);
        tiltY(-(e.clientY / window.innerHeight - 0.5) * 18);
      };
      window.addEventListener("pointermove", onMove);

      gsap.timeline({ scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1 } })
        .to(".hero-phone", { yPercent: 18, scale: 1.18, ease: "none" }, 0)
        .to(".hero-word-l", { xPercent: -45, ease: "none" }, 0)
        .to(".hero-word-r", { xPercent: 45, ease: "none" }, 0)
        .to(".hero-ring", { rotate: 180, ease: "none" }, 0)
        .to(".hero-fade", { opacity: 0, ease: "none" }, 0);

      gsap.utils.toArray<HTMLElement>(".orbit").forEach((el, i) => {
        gsap.to(el.firstElementChild, { y: i % 2 ? 16 : -16, rotate: i % 2 ? -5 : 5, duration: 2.6 + i * 0.4, ease: "sine.inOut", yoyo: true, repeat: -1 });
        gsap.to(el, { yPercent: -60 - i * 25, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1 } });
      });
      gsap.from(".orbit", { opacity: 0, scale: 0.4, duration: 1.2, stagger: 0.15, ease: "back.out(1.6)", delay: 2.6 });

      const tkA = gsap.to(".tk-a", { xPercent: -50, repeat: -1, duration: 26, ease: "none" });
      const tkB = gsap.fromTo(".tk-b", { xPercent: -50 }, { xPercent: 0, repeat: -1, duration: 30, ease: "none" });
      ScrollTrigger.create({
        onUpdate: (self) => {
          const v = self.getVelocity(), boost = 1 + Math.min(Math.abs(v) / 220, 7);
          gsap.to(tkA, { timeScale: boost, duration: 0.25, overwrite: true });
          gsap.to(tkB, { timeScale: boost, duration: 0.25, overwrite: true });
          gsap.to([tkA, tkB], { timeScale: 1, duration: 1.2, delay: 0.25, overwrite: "auto" });
        },
      });
      gsap.from(".tk-band", { scaleX: 0, duration: 1.2, ease: "expo.out", stagger: 0.15, scrollTrigger: { trigger: ".ticker", start: "top 75%" } });

      gsap.utils.toArray<HTMLElement>(".chapter").forEach((ch) => {
        gsap.from(ch.querySelectorAll(".ch-l"), { yPercent: 115, rotate: 8, duration: 1.1, stagger: 0.05, ease: "expo.out", scrollTrigger: { trigger: ch, start: "top 70%" } });
        gsap.from(ch.querySelectorAll(".ch-sub"), { y: 30, opacity: 0, duration: 0.9, delay: 0.3, ease: "power3.out", scrollTrigger: { trigger: ch, start: "top 65%" } });
        gsap.utils.toArray<HTMLElement>(ch.querySelectorAll(".ch-float")).forEach((f, i) => {
          gsap.fromTo(f, { yPercent: 40 + i * 25, rotate: -12 + i * 10 }, { yPercent: -70 - i * 30, rotate: 12 - i * 8, ease: "none", scrollTrigger: { trigger: ch, start: "top bottom", end: "bottom top", scrub: true } });
        });
      });

      const ringItems = gsap.utils.toArray<HTMLElement>(".ring-item");
      const NR = ringItems.length, stepA = 360 / NR;
      const ringR = () => Math.max(300, Math.min(window.innerWidth * 0.34, 560));
      const layoutRing = () => {
        const R = ringR();
        ringItems.forEach((el, i) => { gsap.set(el, { rotateY: i * stepA }); (el.firstElementChild as HTMLElement).style.transform = `translateZ(${R}px)`; });
        gsap.set(".ring", { z: -R });
      };
      layoutRing();
      ScrollTrigger.addEventListener("refreshInit", layoutRing);
      let lastRing = -1;
      gsap.to(".ring", {
        rotateY: -(NR - 1) * stepA, ease: "none",
        scrollTrigger: {
          trigger: ".shelf", start: "top top", end: `+=${NR * 65}%`, pin: true, scrub: 0.7,
          snap: { snapTo: 1 / (NR - 1), duration: { min: 0.2, max: 0.6 }, ease: "power2.inOut" },
          onUpdate: (self) => {
            const pos = self.progress * (NR - 1), idx = Math.round(pos);
            ringItems.forEach((el, i) => {
              const d = Math.abs(i - pos);
              gsap.set(el.firstElementChild, { opacity: gsap.utils.clamp(0, 1, 1.15 - d * 0.42) });
            });
            if (idx !== lastRing) { lastRing = idx; setRingIdx(idx); }
          },
        },
      });
      gsap.to(".ring-glow", { scale: 1.15, opacity: 0.9, duration: 2.4, ease: "sine.inOut", yoyo: true, repeat: -1 });

      gsap.utils.toArray<HTMLElement>(".proc-row").forEach((row, i) => {
        gsap.from(row, { xPercent: i % 2 ? 12 : -12, opacity: 0, ease: "none", scrollTrigger: { trigger: row, start: "top 95%", end: "top 55%", scrub: true } });
        gsap.fromTo(row.querySelector(".proc-num"), { backgroundSize: "0% 100%" }, { backgroundSize: "100% 100%", ease: "none", scrollTrigger: { trigger: row, start: "top 75%", end: "top 30%", scrub: true } });
        gsap.fromTo(row.querySelector(".proc-rule"), { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { trigger: row, start: "top 80%", end: "top 40%", scrub: true } });
      });

      const cards = gsap.utils.toArray<HTMLElement>(".rv-card");
      const NC = cards.length;
      const pos = (o: number) => ({ y: Math.min(o, 3) * 18, scale: 1 - Math.min(o, 3) * 0.05, rotate: o === 0 ? 0 : (o % 2 ? 2.5 : -2.5) * Math.min(o, 3) * 0.6, opacity: o > 3 ? 0 : 1 });
      cards.forEach((c, i) => gsap.set(c, { ...pos(i), zIndex: NC - i }));
      const deck = gsap.timeline({ scrollTrigger: { trigger: ".reviews", start: "top top", end: `+=${NC * 60}%`, pin: true, scrub: 0.8 }, defaults: { ease: "power2.inOut" } });
      for (let i = 0; i < NC - 1; i++) {
        deck.to(cards[i], { xPercent: i % 2 ? 130 : -130, rotate: i % 2 ? 24 : -24, opacity: 0, duration: 1 }, i);
        for (let j = i + 1; j < NC; j++) deck.to(cards[j], { ...pos(j - i - 1), duration: 1 }, i);
      }
      deck.to({}, { duration: 0.4 });
      gsap.from(".rev-head > *", { y: 50, opacity: 0, stagger: 0.12, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: ".reviews", start: "top 70%" } });
      ScrollTrigger.create({
        trigger: ".reviews", start: "top 60%", end: "bottom 40%",
        onToggle: (self) => gsap.to(".we", { backgroundColor: self.isActive ? "#14060c" : "#07040a", duration: 0.8 }),
      });

      const depthEls = gsap.utils.toArray<HTMLElement>(".depth");
      const onDepth = (e: PointerEvent) => {
        const nx = e.clientX / window.innerWidth - 0.5, ny = e.clientY / window.innerHeight - 0.5;
        depthEls.forEach((el) => {
          const d = parseFloat(el.dataset.depth || "1");
          gsap.to(el, { x: -nx * d * 60, y: -ny * d * 40, rotateY: nx * d * 14, rotateX: -ny * d * 10, duration: 1, ease: "power3.out", overwrite: "auto" });
        });
      };
      window.addEventListener("pointermove", onDepth);
      gsap.utils.toArray<HTMLElement>(".dp-wrap").forEach((el, i) => {
        gsap.fromTo(el, { yPercent: 40 + i * 12, scale: 0.7, opacity: 0 }, { yPercent: 0, scale: 1, opacity: 1, ease: "power3.out", scrollTrigger: { trigger: ".outro", start: "top 80%", end: "top 20%", scrub: 1 } });
      });
      gsap.to(".dp-float", { y: -16, duration: 3, ease: "sine.inOut", yoyo: true, repeat: -1, stagger: { each: 0.5, from: "random" } });

      gsap.to(".we-progress", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });

      gsap.utils.toArray<HTMLElement>(".split").forEach((el) => {
        if (!el.dataset.split) {
          el.dataset.split = "1";
          Array.from(el.childNodes).forEach((n) => {
            if (n.nodeType !== 3 || !n.textContent?.trim()) return;
            const frag = document.createDocumentFragment();
            n.textContent!.split(/(\s+)/).forEach((w) => {
              if (!w.trim()) { frag.append(w); return; }
              const o = document.createElement("span"); o.style.cssText = "display:inline-block;overflow:hidden;vertical-align:top;padding-bottom:.12em";
              const i2 = document.createElement("span"); i2.className = "w"; i2.style.display = "inline-block"; i2.textContent = w;
              o.append(i2); frag.append(o);
            });
            n.replaceWith(frag);
          });
        }
        gsap.from(el.querySelectorAll(".w"), { yPercent: 115, rotate: 6, duration: 1, stagger: 0.07, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 85%" } });
      });

      gsap.utils.toArray<HTMLElement>(".count").forEach((el) => {
        const to = parseFloat(el.dataset.to || "0"), dec = parseInt(el.dataset.dec || "0"), o = { v: 0 };
        gsap.to(o, { v: to, duration: 1.8, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 90%" },
          onUpdate: () => { el.textContent = o.v.toLocaleString("en-IN", { minimumFractionDigits: dec, maximumFractionDigits: dec }); } });
      });

      gsap.utils.toArray<HTMLElement>(".reveal").forEach((el) => {
        gsap.from(el, { y: 60, opacity: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%" } });
      });

      gsap.utils.toArray<HTMLElement>(".magnet").forEach((el) => {
        const mx = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3.out" });
        const my = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3.out" });
        el.addEventListener("pointermove", (e) => { const r = el.getBoundingClientRect(); mx((e.clientX - r.left - r.width / 2) * 0.3); my((e.clientY - r.top - r.height / 2) * 0.4); });
        el.addEventListener("pointerleave", () => { mx(0); my(0); });
      });

      let removeCursor = () => {};
      if (window.matchMedia("(pointer: fine)").matches) {
        const cx = gsap.quickTo(".we-cursor", "x", { duration: 0.25, ease: "power3.out" });
        const cy = gsap.quickTo(".we-cursor", "y", { duration: 0.25, ease: "power3.out" });
        const move = (e: PointerEvent) => { cx(e.clientX); cy(e.clientY); };
        const over = (e: Event) => gsap.to(".we-cursor", { scale: (e.target as HTMLElement).closest("a,button") ? 2.6 : 1, duration: 0.3 });
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerover", over);
        gsap.set(".we-cursor", { opacity: 1 });
        removeCursor = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerover", over); };
      }

      ScrollTrigger.create({
        start: 80,
        onToggle: (s) => gsap.to(".we-nav", { backgroundColor: s.isActive ? "rgba(7,4,10,0.7)" : "rgba(7,4,10,0)", backdropFilter: s.isActive ? "blur(14px)" : "blur(0px)", duration: 0.3 }),
      });

      return () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointermove", onDepth);
        ScrollTrigger.removeEventListener("refreshInit", layoutRing);
        removeCursor();
      };
    }, root);

    return () => {
      ctx.revert();
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  const ringText = "SCROLL TO DISCOVER • SCROLL DOWN • ";
  const rp = WEB_PRODUCTS[ringIdx] ?? WEB_PRODUCTS[0];
  const tickerWords = (a: boolean) => (
    <>
      {[0, 1].map((k) => (
        <span key={k} className="flex shrink-0 items-center gap-8 pr-8">
          {(a ? ["Phones", "Earbuds", "Chargers", "Repairs", "Headphones"] : ["Screens fixed", "Batteries swapped", "Warranty included", "Easy checkout"]).map((w) => (
            <span key={w} className="flex items-center gap-8"><span>{w}</span><span className="text-xl">✦</span></span>
          ))}
        </span>
      ))}
    </>
  );

  return (
    <div ref={root} className="we relative">
      {/* Loader */}
      <div className="loader fixed inset-0 z-[100] flex items-center justify-center bg-[#ff3b4e] text-[#07040a]">
        <div className="loader-inner text-center">
          <div className="font-display text-[22vw] font-extrabold leading-none tabular-nums md:text-[14vw]">{count}%</div>
          <p className="mt-2 text-xs uppercase tracking-[0.3em]">Powering up the store</p>
        </div>
      </div>

      {/* Nav */}
      <header className="we-nav fixed inset-x-0 top-0 z-50 flex items-center justify-between px-5 py-4 md:px-10">
        <a href="#top" className="font-display text-xl font-bold tracking-tight text-[#f6efe9]">
          mobileshop<span className="text-[#ff3b4e]">.</span>
        </a>
        <nav className="hidden gap-8 text-sm text-[#8f8590] md:flex">
          <a href="#products" className="hover:text-[#f6efe9]">Products</a>
          <a href="#shelf" className="hover:text-[#f6efe9]">Shop</a>
          <a href="#reviews" className="hover:text-[#f6efe9]">Reviews</a>
        </nav>
        <Link
          to="/home"
          className="magnet rounded-full bg-[#ff3b4e] px-5 py-2 text-sm font-medium text-[#07040a] transition hover:bg-[#ff8a3d]"
        >
          Continue purchase →
        </Link>
      </header>

      <div className="we-progress fixed inset-x-0 top-0 z-[90] h-[3px] origin-left scale-x-0 bg-gradient-to-r from-[#ff3b4e] via-[#ff8a3d] to-[#c2185b]" />
      <div className="we-cursor pointer-events-none fixed left-0 top-0 z-[95] -ml-3 -mt-3 hidden h-6 w-6 rounded-full border border-[#f6efe9] opacity-0 mix-blend-difference md:block" />

      {/* Hero */}
      <section id="top" className="hero relative flex h-screen items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_55%,rgba(194,24,91,0.45),transparent_70%)]" />
        <h1
          className="pointer-events-none absolute inset-x-0 top-1/2 z-0 flex -translate-y-1/2 items-center justify-between px-[3vw] font-display text-[19vw] font-extrabold leading-none tracking-tighter md:text-[15vw]"
          style={{ perspective: 800 }}
        >
          <span className="overflow-hidden">
            <span className="hero-word hero-word-l inline-block text-[#f6efe9]">MOBILE</span>
          </span>
          <span className="overflow-hidden">
            <span className="hero-word hero-word-r inline-block text-transparent" style={{ WebkitTextStroke: "2px #f6efe9" }}>SHOP</span>
          </span>
        </h1>
        <div className="perspective relative z-10">
          <div className="hero-phone">
            <div className="hero-tilt preserve-3d">
              <PhoneImg which="a" className="h-[64vh] w-auto max-w-[80vw] md:h-[76vh]" />
            </div>
          </div>
        </div>
        <div className="orbit absolute left-[6%] top-[22%] z-20 w-[22vw] max-w-[190px] md:left-[12%]"><div><img src="/products/earbuds-yellow.png" alt="" className="w-full drop-shadow-[0_20px_40px_rgba(255,138,61,0.35)]" /></div></div>
        <div className="orbit absolute right-[6%] top-[18%] z-20 w-[24vw] max-w-[210px] md:right-[11%]"><div><img src="/products/powerbank.png" alt="" className="w-full drop-shadow-[0_20px_40px_rgba(255,59,78,0.35)]" /></div></div>
        <div className="orbit absolute bottom-[16%] right-[8%] z-20 w-[26vw] max-w-[230px] md:right-[17%]"><div><img src="/products/cable-c-lightning.png" alt="" className="w-full drop-shadow-[0_20px_40px_rgba(255,255,255,0.18)]" /></div></div>
        <div className="orbit absolute bottom-[18%] left-[5%] z-20 hidden w-[17vw] max-w-[190px] md:block"><div><img src="/products/headphones-anc.png" alt="" className="w-full drop-shadow-[0_20px_40px_rgba(194,24,91,0.4)]" /></div></div>

        <div className="hero-fade absolute bottom-8 left-5 z-30 max-w-[16rem] text-sm text-[#8f8590] md:left-10">
          Phones, accessories and same-day repairs, all under one roof.
        </div>
        <div className="hero-fade hero-ring absolute bottom-6 right-5 z-30 h-28 w-28 md:right-10 md:h-32 md:w-32">
          <svg viewBox="0 0 120 120" className="h-full w-full animate-[spin_16s_linear_infinite]">
            <defs><path id="c" d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0" /></defs>
            <text className="fill-[#f6efe9] text-[10px] tracking-[0.18em]">
              <textPath href="#c" textLength="270" lengthAdjust="spacing">{ringText}</textPath>
            </text>
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xl text-[#f6efe9]">↓</span>
        </div>
      </section>

      {/* Crossing diagonal tickers */}
      <section className="ticker relative z-10 flex h-[46vh] items-center overflow-hidden bg-[#07040a]">
        <div className="tk-band absolute inset-x-[-8%] top-1/2 -translate-y-1/2 -rotate-[3deg] bg-[#ff3b4e] py-4 text-[#07040a]">
          <div className="tk-a flex w-max whitespace-nowrap font-display text-4xl font-extrabold md:text-6xl">{tickerWords(true)}</div>
        </div>
        <div className="tk-band absolute inset-x-[-8%] top-1/2 -translate-y-1/2 rotate-[3deg] bg-[#f6efe9] py-4 text-[#07040a]">
          <div className="tk-b flex w-max whitespace-nowrap font-display text-4xl font-extrabold md:text-6xl">{tickerWords(false)}</div>
        </div>
      </section>

      {/* Products chapter */}
      <section id="products" className="chapter relative flex min-h-[85vh] items-center overflow-hidden px-5 md:px-10">
        <div className="ch-float pointer-events-none absolute right-[8%] top-[12%] w-[22vw] max-w-[220px]"><img src="/products/earbuds-yellow.png" alt="" className="w-full drop-shadow-[0_30px_50px_rgba(255,138,61,0.4)]" /></div>
        <div className="ch-float pointer-events-none absolute bottom-[8%] right-[26%] w-[18vw] max-w-[190px]"><img src="/products/cable-c-lightning.png" alt="" className="w-full drop-shadow-[0_30px_50px_rgba(255,255,255,0.2)]" /></div>
        <div className="ch-float pointer-events-none absolute right-[3%] bottom-[10%] hidden w-[16vw] max-w-[170px] md:block"><img src="/products/headphones-anc.png" alt="" className="w-full drop-shadow-[0_30px_50px_rgba(194,24,91,0.45)]" /></div>
        <div className="relative mx-auto w-full max-w-7xl">
          <div className="mb-4 flex items-center gap-4 text-xs uppercase tracking-[0.3em] text-[#ff3b4e]">
            <span className="h-px w-16 bg-[#ff3b4e]" />Chapter 01
          </div>
          <h2 className="font-display text-[19vw] font-extrabold leading-[0.9] tracking-tighter md:text-[13vw] text-[#f6efe9]">
            <Letters text="PRODUCTS" />
          </h2>
          <p className="ch-sub mt-5 max-w-md text-[#8f8590]">New phones, audio and charging gear. Pick what you like and continue to purchase.</p>
        </div>
      </section>

      {/* 3D product ring */}
      <section id="shelf" className="shelf relative flex h-screen flex-col items-center justify-between overflow-hidden bg-[#07040a] pb-8 pt-20">
        <div className="ring-glow pointer-events-none absolute left-1/2 top-[45%] h-[60vh] w-[60vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,59,78,0.35),transparent_65%)] blur-2xl" />
        <div className="relative z-10 w-full px-5 md:px-10">
          <p className="text-xs uppercase tracking-[0.3em] text-[#ff3b4e]">In store now · scroll to spin</p>
        </div>
        <div className="relative z-10 h-[46vh] w-full" style={{ perspective: 1700 }}>
          <div className="ring preserve-3d absolute left-1/2 top-1/2 h-0 w-0">
            {WEB_PRODUCTS.map((p) => (
              <div key={p.slug} className="ring-item preserve-3d absolute left-0 top-0 h-[36vh] w-[220px]" style={{ marginLeft: -110, marginTop: "-18vh" }}>
                <div className="flex h-full w-full items-center justify-center" style={{ backfaceVisibility: "hidden" }}>
                  <img src={p.src} alt={p.name} className="max-h-full max-w-full object-contain drop-shadow-[0_30px_40px_rgba(0,0,0,0.6)]" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 w-full max-w-xl px-5 text-center">
          <div key={rp.slug} className="animate-[fadeUp_.5s_ease-out]">
            <span className="rounded-full border border-[rgba(246,239,233,0.12)] px-3 py-1 text-xs text-[#f6efe9]">{rp.tag}</span>
            <h3 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-5xl text-[#f6efe9]">{rp.name}</h3>
            <p className="mt-2 text-[#8f8590]">{rp.blurb}</p>
            <div className="mt-3 font-display text-3xl text-[#ff3b4e]">{inr(rp.price)}</div>
          </div>
          <Link
            to={shopUrl(rp.slug)}
            className="magnet mt-4 inline-block rounded-full bg-[#ff3b4e] px-8 py-3 font-medium text-[#07040a] transition hover:bg-[#ff8a3d]"
          >
            Continue purchase →
          </Link>
          <div className="mt-4 flex justify-center gap-1.5">
            {WEB_PRODUCTS.map((p, i) => (
              <span key={p.slug} className={`h-1.5 rounded-full transition-all ${i === ringIdx ? "w-8 bg-[#ff3b4e]" : "w-1.5 bg-[rgba(246,239,233,0.12)]"}`} />
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="process mx-auto max-w-7xl px-5 pb-28 md:px-10">
        <p className="mb-10 text-xs uppercase tracking-[0.3em] text-[#ff3b4e]">How it works</p>
        {[
          ["01", "Bring it in", "Walk in or book a slot. No appointment needed for quick fixes."],
          ["02", "Free diagnosis", "We find the fault, quote it upfront and only start once you say yes."],
          ["03", "Fixed & covered", "Collect your phone with a 6-month warranty on the repair."],
        ].map(([n, t, d]) => (
          <div key={n} className="proc-row relative grid items-center gap-2 py-8 md:grid-cols-[auto_1fr] md:gap-12">
            <div
              className="proc-num font-display text-[26vw] font-extrabold leading-[0.85] tracking-tighter text-transparent md:text-[14rem]"
              style={{
                WebkitTextStroke: "2px #f6efe9",
                backgroundImage: "linear-gradient(#ff3b4e,#ff3b4e)",
                backgroundRepeat: "no-repeat",
                backgroundSize: "0% 100%",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
              }}
            >
              {n}
            </div>
            <div>
              <h3 className="font-display text-3xl font-bold md:text-5xl text-[#f6efe9]">{t}</h3>
              <p className="mt-3 max-w-md text-[#8f8590]">{d}</p>
            </div>
            <div className="proc-rule absolute inset-x-0 bottom-0 h-px origin-left bg-[rgba(246,239,233,0.12)]" />
          </div>
        ))}
        <div className="mt-20 grid gap-10 md:grid-cols-3">
          {[
            [30, "", " min", "Express screen and battery swaps"],
            [6, "", " mo", "Warranty on every repair"],
            [0, "₹", "", "Diagnosis, always free"],
          ].map(([n, pre, suf, t]) => (
            <div key={String(t)} className="border-t border-[rgba(246,239,233,0.12)] pt-6">
              <div className="font-display text-6xl font-extrabold tracking-tight text-[#ff3b4e] md:text-8xl">
                {pre}<span className="count" data-to={n}>{n}</span>{suf}
              </div>
              <p className="mt-3 text-[#8f8590]">{t}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Review card deck */}
      <section id="reviews" className="reviews relative flex h-screen items-center overflow-hidden">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-8 px-5 md:grid-cols-2 md:px-10">
          <div className="rev-head">
            <p className="mb-3 text-xs uppercase tracking-[0.3em] text-[#ff3b4e]">Customer reviews</p>
            <h2 className="font-display text-5xl font-bold leading-[1.02] tracking-tight md:text-7xl text-[#f6efe9]">
              Loved by<br />the neighbourhood.
            </h2>
            <div className="mt-8 flex items-center gap-5">
              <div className="font-display text-7xl font-extrabold text-[#ff3b4e]">
                <span className="count" data-to="4.9" data-dec="1">4.9</span>
              </div>
              <div>
                <div className="text-xl tracking-widest text-[#ff8a3d]">★★★★★</div>
                <div className="text-sm text-[#8f8590]"><span className="count" data-to="1200">1,200</span>+ happy customers</div>
              </div>
            </div>
            <p className="mt-6 text-sm text-[#8f8590]">Keep scrolling to flick through the cards.</p>
          </div>
          <div className="relative mx-auto h-[56vh] w-full max-w-md md:h-[60vh]">
            {WEB_REVIEWS.map((r) => (
              <article
                key={r.name}
                className="rv-card absolute inset-x-0 top-0 flex h-[44vh] flex-col justify-between rounded-[28px] border border-[rgba(246,239,233,0.12)] bg-[#1a0b12] p-7 shadow-[0_30px_80px_rgba(0,0,0,0.6)] md:h-[48vh]"
              >
                <div>
                  <div className="mb-4 text-xl tracking-widest text-[#ff8a3d]">
                    {"★".repeat(r.stars)}<span className="text-[rgba(246,239,233,0.12)]">{"★".repeat(5 - r.stars)}</span>
                  </div>
                  <p className="text-xl leading-relaxed md:text-2xl text-[#f6efe9]">"{r.text}"</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#ff3b4e] to-[#c2185b] font-display text-lg font-bold text-[#f6efe9]">
                    {r.name[0]}
                  </span>
                  <div>
                    <div className="font-medium text-[#f6efe9]">{r.name}</div>
                    <div className="text-sm text-[#8f8590]">{r.item}</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Outro */}
      <section
        id="contact"
        className="outro relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 text-center"
        style={{ perspective: 1200 }}
      >
        <div className="dp-wrap pointer-events-none absolute left-[4%] top-[12%] w-[22vw] max-w-[220px]">
          <div className="depth" data-depth="1.6"><div className="dp-float"><PhoneImg which="gold" className="w-full" /></div></div>
        </div>
        <div className="dp-wrap pointer-events-none absolute right-[5%] top-[10%] w-[20vw] max-w-[210px]">
          <div className="depth" data-depth="2.2"><div className="dp-float"><img src="/products/earbuds-chrome.png" alt="" className="w-full drop-shadow-[0_30px_50px_rgba(255,59,78,0.35)]" /></div></div>
        </div>
        <div className="dp-wrap pointer-events-none absolute bottom-[12%] left-[8%] w-[18vw] max-w-[200px]">
          <div className="depth" data-depth="2.8"><div className="dp-float"><img src="/products/charger-20w.png" alt="" className="w-full drop-shadow-[0_30px_50px_rgba(255,255,255,0.15)]" /></div></div>
        </div>
        <div className="dp-wrap pointer-events-none absolute bottom-[10%] right-[7%] w-[20vw] max-w-[220px]">
          <div className="depth" data-depth="1.2"><div className="dp-float"><img src="/products/phone-10t.png" alt="" className="w-full drop-shadow-[0_30px_60px_rgba(255,59,78,0.35)]" /></div></div>
        </div>
        <div className="relative z-10">
          <h2 className="reveal font-display text-6xl font-extrabold leading-[0.95] tracking-tighter md:text-[9vw] text-[#f6efe9]">
            Drop in.<br />Power up.
          </h2>
          <p className="reveal mx-auto mt-6 max-w-md text-[#8f8590]">Found something you like? Pick up where you left off.</p>
          <div className="reveal mt-8">
            <Link
              to="/home"
              className="magnet inline-block rounded-full bg-[#ff3b4e] px-10 py-4 text-lg font-medium text-[#07040a] transition hover:scale-105 hover:bg-[#ff8a3d]"
            >
              Continue purchase →
            </Link>
          </div>
        </div>
        <footer className="absolute inset-x-0 bottom-0 z-10 flex justify-between px-5 py-6 text-xs text-[#8f8590] md:px-10">
          <span>© {new Date().getFullYear()} {STORE_NAME.toLowerCase()}</span>
          <span>Phones · Accessories</span>
        </footer>
      </section>
    </div>
  );
}
