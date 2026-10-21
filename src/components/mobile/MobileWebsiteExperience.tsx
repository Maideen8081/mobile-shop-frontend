import { useEffect, useRef, useState, type CSSProperties } from "react";
import ScrollEndRedirect from "../ScrollEndRedirect";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import ChatAssistantIcon from "../ecommerce/ChatAssistantIcon";
import { WEB_PRODUCTS, WEB_REVIEWS, inr, shopUrl } from "../../data/websiteCatalog";
import "../../styles/website-experience.css";

gsap.registerPlugin(ScrollTrigger);
// Mobile browsers resize the viewport as the address bar shows/hides; don't
// recompute every pin and scrub when that happens.
ScrollTrigger.config({ ignoreMobileResize: true });

// Touch-first version of WebsiteExperience. Native scrolling throughout, with 3D
// scenes driven by scroll, the gyroscope and touch: an orbiting hero stage, a
// pinned product ring, a coverflow shelf, stacking step cards and a swipe deck.

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

const STEPS: [string, string, string, string, string][] = [
  ["01", "Bring it in", "Walk in or book a slot. No appointment needed for quick fixes.", "/phones/ios-b.png", "linear-gradient(150deg, #2a0f1a, #140910 70%)"],
  ["02", "Free diagnosis", "We find the fault, quote it upfront and only start once you say yes.", "/products/repair-internals.png", "linear-gradient(150deg, #3a0d1c, #1a0910 70%)"],
  ["03", "Fixed & covered", "Collect your phone with a 6-month warranty on the repair.", "/phones/gold.png", "linear-gradient(150deg, #ff3b4e, #c2185b 80%)"],
];

const STATS: [number, string, string, string][] = [
  [30, "", "min", "Express swaps"],
  [6, "", "mo", "Repair warranty"],
  [0, "₹", "", "Diagnosis"],
];

const ORBIT = [
  { src: "/products/earbuds-yellow.png", y: "-6svh", w: "17vw" },
  { src: "/products/powerbank.png", y: "4svh", w: "16vw" },
  { src: "/products/cable-c-lightning.png", y: "0svh", w: "17vw" },
];

const clamp = gsap.utils.clamp(-1, 1);
const buzz = () => navigator.vibrate?.(8);

type OrientationPermission = { requestPermission?: () => Promise<"granted" | "denied"> };
const orientationApi = () =>
  (typeof window !== "undefined" ? window.DeviceOrientationEvent : undefined) as OrientationPermission | undefined;

/** Text split into words and characters so each glyph can flip in on its own. */
function Split({ text, className = "", style }: { text: string; className?: string; style?: CSSProperties }) {
  return (
    <span className={`wem-split ${className}`} style={style} aria-label={text} role="text">
      {text.split(" ").map((word, wi, words) => (
        <span key={wi} className="wem-w" aria-hidden="true">
          {Array.from(word).map((ch, ci) => (
            <span key={ci} className="wem-ch">{ch}</span>
          ))}
          {wi < words.length - 1 && <span className="wem-ch">&nbsp;</span>}
        </span>
      ))}
    </span>
  );
}

/** Center-snapping carousel whose cards rotate in 3D by their distance from center. */
function useCoverflow(resetKey: string) {
  const ref = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTo({ left: 0 });
    let raf = 0;
    const render = () => {
      raf = 0;
      const mid = el.scrollLeft + el.clientWidth / 2;
      let best = 0, bestD = Infinity;
      Array.from(el.children).forEach((child, i) => {
        const c = child as HTMLElement;
        const d = gsap.utils.clamp(-1.6, 1.6, (c.offsetLeft + c.offsetWidth / 2 - mid) / c.offsetWidth);
        const a = Math.abs(d);
        const inner = c.firstElementChild as HTMLElement | null;
        if (inner) {
          inner.style.transform = `rotateY(${-d * 38}deg) translateZ(${-a * 90}px) scale(${1 - a * 0.06})`;
          inner.style.opacity = String(1 - a * 0.35);
        }
        if (a < bestD) { bestD = a; best = i; }
      });
      setIdx(best);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(render); };
    raf = requestAnimationFrame(render);
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [resetKey]);

  const goTo = (i: number) => {
    const el = ref.current;
    const child = el?.children[i] as HTMLElement | undefined;
    if (el && child) el.scrollTo({ left: child.offsetLeft + child.offsetWidth / 2 - el.clientWidth / 2, behavior: "smooth" });
  };
  return { ref, idx, goTo };
}

type Review = (typeof WEB_REVIEWS)[number];

/** One card of the review deck; only the top card can be dragged off. */
function DeckCard({ r, depth, onSwipe }: { r: Review; depth: number; onSwipe: () => void }) {
  const x = useMotionValue(0);
  const rotateZ = useTransform(x, [-240, 240], [-16, 16]);
  const rotateY = useTransform(x, [-240, 240], [24, -24]);
  const top = depth === 0;

  return (
    <motion.article
      drag={top ? "x" : false}
      dragElastic={0.9}
      style={{
        x, rotateZ, rotateY, zIndex: 20 - depth, touchAction: "pan-y",
        background: "linear-gradient(160deg, #24101a, #14070d 70%)",
        border: `1px solid ${C.border}`,
        boxShadow: "0 30px 60px rgba(0,0,0,0.55)",
      }}
      initial={false}
      animate={{ y: depth * 18, scale: 1 - depth * 0.06, opacity: depth > 2 ? 0 : 1 - depth * 0.2 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      onDragEnd={(_, info) => {
        if (Math.abs(info.offset.x) > 90 || Math.abs(info.velocity.x) > 500) {
          const dir = Math.sign(info.offset.x || info.velocity.x);
          buzz();
          animate(x, dir * 520, { duration: 0.3, ease: "easeIn" }).then(() => { onSwipe(); x.set(0); });
        } else {
          animate(x, 0, { type: "spring", stiffness: 420, damping: 28 });
        }
      }}
      className="absolute inset-x-0 top-0 flex min-h-[260px] cursor-grab flex-col justify-between rounded-[28px] p-6 active:cursor-grabbing"
      aria-hidden={!top}
    >
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
    </motion.article>
  );
}

function ReviewDeck() {
  const [order, setOrder] = useState(() => WEB_REVIEWS.map((_, i) => i));
  const next = () => setOrder((o) => [...o.slice(1), o[0]]);
  const front = order[0];

  return (
    <div className="px-5">
      <div className="relative h-[330px]" style={{ perspective: 1100 }}>
        {order.map((ri, depth) => (
          <DeckCard key={WEB_REVIEWS[ri].name} r={WEB_REVIEWS[ri]} depth={depth} onSwipe={next} />
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <div className="flex gap-1.5">
          {WEB_REVIEWS.map((r, i) => (
            <span key={r.name} className="h-1.5 rounded-full transition-all duration-500" style={{ width: i === front ? 28 : 6, background: i === front ? C.primary : C.border }} />
          ))}
        </div>
        <button onClick={() => { buzz(); next(); }} className="flex h-10 items-center gap-2 rounded-full px-4 text-[13px] font-semibold transition active:scale-95" style={{ border: `1px solid ${C.border}` }}>
          Next review <span aria-hidden="true">→</span>
        </button>
      </div>
      <p className="mt-3 text-center text-[11px] uppercase tracking-[0.3em]" style={{ color: C.muted }}>Swipe the card</p>
    </div>
  );
}

export default function MobileWebsiteExperience() {
  const root = useRef<HTMLDivElement>(null);
  const [reduce] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [needsMotionPermission, setNeedsMotionPermission] = useState(() => typeof orientationApi()?.requestPermission === "function");
  const [count, setCount] = useState(0);
  const [tag, setTag] = useState("All");
  const [active, setActive] = useState(0);
  const [showBar, setShowBar] = useState(false);
  const products = tag === "All" ? WEB_PRODUCTS : WEB_PRODUCTS.filter((p) => p.tag === tag);
  const { ref: shelfRef, idx: shelfIdx, goTo: shelfGoTo } = useCoverflow(tag);
  const lineupProduct = WEB_PRODUCTS[active];

  const enableMotion = async () => {
    try {
      await orientationApi()?.requestPermission?.();
    } finally {
      setNeedsMotionPermission(false);
    }
  };

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const cleanups: (() => void)[] = [];

    const ctx = gsap.context(() => {
      /* ── Loader iris → hero intro ── */
      const counter = { v: 0 };
      gsap.timeline({ onComplete: () => ScrollTrigger.refresh() })
        .to(counter, { v: 100, duration: reduce ? 0.1 : 1.1, ease: "power2.inOut", onUpdate: () => setCount(Math.round(counter.v)) })
        .to(".wem-loader-inner", { scale: 0.85, opacity: 0, duration: reduce ? 0.1 : 0.4, ease: "power2.in" })
        .to(".wem-loader", { clipPath: "circle(0% at 50% 50%)", duration: reduce ? 0.1 : 0.9, ease: "expo.inOut" }, "<0.1")
        .set(".wem-loader", { display: "none" })
        .from(".wem-hero-title .wem-ch", { yPercent: 110, rotateX: -100, opacity: 0, duration: 1.1, stagger: 0.045, ease: "expo.out" }, "-=0.55")
        .from(".wem-hero-phone", { y: 120, rotateY: -70, scale: 0.7, opacity: 0, duration: 1.4, ease: "expo.out" }, "<0.1")
        .from(".wem-orbit-img", { scale: 0, opacity: 0, duration: 0.9, stagger: 0.12, ease: "back.out(2)" }, "-=1")
        .from(".wem-hero-fade", { y: 24, opacity: 0, duration: 0.7, stagger: 0.08, ease: "power3.out" }, "-=0.8");

      if (reduce) return;

      /* ── Scroll progress + auto-hiding header ── */
      gsap.to(".wem-progress", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });
      let hidden = false;
      ScrollTrigger.create({
        start: 120, end: "max",
        onUpdate: (s) => {
          const hide = s.direction === 1;
          if (hide !== hidden) { hidden = hide; gsap.to(".wem-header", { yPercent: hide ? -120 : 0, duration: 0.45, ease: "power3.out" }); }
        },
        onLeaveBack: () => { hidden = false; gsap.to(".wem-header", { yPercent: 0, duration: 0.45 }); },
      });

      /* ── Hero: tilt stage from gyroscope / touch drag ── */
      const stage = el.querySelector<HTMLElement>(".wem-stage");
      const hero = el.querySelector<HTMLElement>(".wem-hero");
      if (stage && hero) {
        const rx = gsap.quickTo(stage, "rotateX", { duration: 0.9, ease: "power3.out" });
        const ry = gsap.quickTo(stage, "rotateY", { duration: 0.9, ease: "power3.out" });
        const gx = gsap.quickTo(".wem-glare-beam", "xPercent", { duration: 0.9, ease: "power3.out" });
        const pars = gsap.utils.toArray<HTMLElement>(".wem-par").map((p) => ({
          d: parseFloat(p.dataset.depth || "1"),
          x: gsap.quickTo(p, "x", { duration: 1.1, ease: "power3.out" }),
          y: gsap.quickTo(p, "y", { duration: 1.1, ease: "power3.out" }),
        }));
        const tilt = (nx: number, ny: number) => {
          rx(-ny * 16); ry(nx * 24); gx(nx * 70);
          pars.forEach((p) => { p.x(nx * p.d * 16); p.y(ny * p.d * 12); });
        };

        let base: number | null = null;
        let dragging = false;
        const onOrient = (e: DeviceOrientationEvent) => {
          if (dragging || e.beta == null || e.gamma == null) return;
          if (base == null) base = e.beta;
          base += (e.beta - base) * 0.004; // slowly re-center on however the phone is held
          tilt(clamp(e.gamma / 25), clamp((e.beta - base) / 25));
        };
        let sx = 0, sy = 0;
        const onDown = (e: PointerEvent) => { dragging = true; sx = e.clientX; sy = e.clientY; };
        const onMove = (e: PointerEvent) => {
          if (e.pointerType === "mouse") {
            const r = hero.getBoundingClientRect();
            tilt(clamp(((e.clientX - r.left) / r.width) * 2 - 1), clamp(((e.clientY - r.top) / r.height) * 2 - 1));
          } else if (dragging) {
            tilt(clamp((e.clientX - sx) / 110), clamp((e.clientY - sy) / 160));
          }
        };
        const onUp = () => { dragging = false; tilt(0, 0); };
        window.addEventListener("deviceorientation", onOrient);
        hero.addEventListener("pointerdown", onDown);
        hero.addEventListener("pointermove", onMove);
        hero.addEventListener("pointerup", onUp);
        hero.addEventListener("pointercancel", onUp);
        hero.addEventListener("pointerleave", onUp);
        cleanups.push(() => {
          window.removeEventListener("deviceorientation", onOrient);
          hero.removeEventListener("pointerdown", onDown);
          hero.removeEventListener("pointermove", onMove);
          hero.removeEventListener("pointerup", onUp);
          hero.removeEventListener("pointercancel", onUp);
          hero.removeEventListener("pointerleave", onUp);
        });
      }

      /* Hero scroll-out: the stage swings away in 3D as the title lifts off */
      const heroOut = { trigger: ".wem-hero", start: "top top", end: "bottom top", scrub: 0.6 };
      gsap.to(".wem-hero-3d", { rotateX: 32, rotateY: -22, scale: 0.72, y: 140, ease: "none", scrollTrigger: heroOut });
      gsap.to(".wem-hero-title", { yPercent: -45, rotateX: 55, opacity: 0, ease: "none", scrollTrigger: heroOut });
      gsap.to(".wem-floor", { opacity: 0, ease: "none", scrollTrigger: heroOut });

      /* ── Ticker: speed and skew follow scroll velocity, direction follows scroll ── */
      const loops = gsap.utils.toArray<HTMLElement>(".wem-loop").map((row, i) =>
        gsap.fromTo(row, { xPercent: i % 2 ? -50 : 0 }, { xPercent: i % 2 ? 0 : -50, duration: 20 + i * 4, ease: "none", repeat: -1 }),
      );
      const skew = gsap.quickSetter(".wem-ticker", "skewX", "deg");
      let boost = 0, dir = 1;
      ScrollTrigger.create({
        onUpdate: (s) => {
          boost = gsap.utils.clamp(-6, 6, s.getVelocity() / 260);
          if (s.direction) dir = s.direction;
        },
      });
      const tick = () => {
        boost *= 0.92;
        loops.forEach((t) => t.timeScale(dir * (1 + Math.abs(boost))));
        skew(boost * -1.6);
      };
      gsap.ticker.add(tick);
      cleanups.push(() => gsap.ticker.remove(tick));

      /* ── Lineup: pinned 3D ring, scroll spins it one product at a time ── */
      const ring = el.querySelector<HTMLElement>(".wem-ring");
      const items = gsap.utils.toArray<HTMLElement>(".wem-ring-item");
      if (ring && items.length) {
        const N = items.length, step = 360 / N;
        const R = Math.round((items[0].offsetWidth / 2 / Math.tan(Math.PI / N)) * 1.12);
        items.forEach((it, i) => { it.style.transform = `rotateY(${i * step}deg) translateZ(${R}px)`; });
        const spin = { r: 0 };
        let last = -1;
        const render = () => {
          ring.style.transform = `translateZ(${-R}px) rotateX(-8deg) rotateY(${spin.r}deg)`;
          items.forEach((it, i) => {
            const a = (((i * step + spin.r) % 360) + 360) % 360;
            const c = Math.cos((a * Math.PI) / 180);
            (it.firstElementChild as HTMLElement).style.opacity = String(Math.max(0, c) ** 1.6);
          });
          const front = (((Math.round(-spin.r / step) % N) + N) % N);
          if (front !== last) { last = front; setActive(front); }
        };
        render();
        gsap.to(spin, {
          r: -(N - 1) * step, ease: "none", onUpdate: render,
          scrollTrigger: {
            trigger: ".wem-lineup", start: "top top", end: () => `+=${N * 55}%`,
            pin: true, scrub: 0.7, anticipatePin: 1,
            snap: { snapTo: 1 / (N - 1), duration: { min: 0.2, max: 0.5 }, delay: 0.05, ease: "power2.inOut" },
          },
        });
        gsap.to(".wem-lineup-bar", { scaleX: 1, ease: "none", scrollTrigger: { trigger: ".wem-lineup", start: "top top", end: () => `+=${N * 55}%`, scrub: true } });
      }

      /* ── Steps: cards stack and tilt back as the next one slides over ── */
      const steps = gsap.utils.toArray<HTMLElement>(".wem-step");
      steps.forEach((s, i) => {
        const next = steps[i + 1];
        if (!next) return;
        const st = { trigger: next, start: "top bottom", end: () => `top ${parseFloat(getComputedStyle(next).top) || 100}px`, scrub: true };
        gsap.to(s.querySelector(".wem-step-card"), { scale: 0.9, rotateX: -14, ease: "none", scrollTrigger: st });
        gsap.to(s.querySelector(".wem-step-shade"), { opacity: 0.55, ease: "none", scrollTrigger: st });
      });
      gsap.utils.toArray<HTMLElement>(".wem-step-img").forEach((img) => {
        gsap.fromTo(img, { rotate: 24, y: 60 }, { rotate: -6, y: -30, ease: "none", scrollTrigger: { trigger: img, start: "top bottom", end: "bottom top", scrub: true } });
      });

      /* ── Generic reveals ── */
      gsap.utils.toArray<HTMLElement>(".wem-split.wem-rv").forEach((s) => {
        gsap.from(s.querySelectorAll(".wem-ch"), {
          yPercent: 110, rotateX: -90, opacity: 0, duration: 1, stagger: 0.03, ease: "expo.out",
          scrollTrigger: { trigger: s, start: "top 88%", once: true },
        });
      });
      gsap.utils.toArray<HTMLElement>(".wem-reveal").forEach((r) => {
        gsap.from(r, { y: 40, opacity: 0, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: r, start: "top 90%", once: true } });
      });
      gsap.utils.toArray<HTMLElement>(".wem-flip").forEach((f, i) => {
        gsap.from(f, { rotateX: -95, opacity: 0, transformOrigin: "50% 100%", duration: 1, delay: (i % 3) * 0.1, ease: "back.out(1.4)", scrollTrigger: { trigger: f, start: "top 92%", once: true } });
      });
      gsap.utils.toArray<HTMLElement>(".wem-count").forEach((c) => {
        const to = parseFloat(c.dataset.to || "0"), dec = parseInt(c.dataset.dec || "0"), o = { v: 0 };
        gsap.to(o, {
          v: to, duration: 1.6, ease: "power2.out",
          scrollTrigger: { trigger: c, start: "top 92%", once: true },
          onUpdate: () => { c.textContent = o.v.toLocaleString("en-IN", { minimumFractionDigits: dec, maximumFractionDigits: dec }); },
        });
      });

      /* ── Press-to-tilt cards with a moving highlight ── */
      gsap.utils.toArray<HTMLElement>(".wem-tilt").forEach((card) => {
        const rx = gsap.quickTo(card, "rotateX", { duration: 0.6, ease: "power3.out" });
        const ry = gsap.quickTo(card, "rotateY", { duration: 0.6, ease: "power3.out" });
        const move = (e: PointerEvent) => {
          const r = card.getBoundingClientRect();
          const nx = ((e.clientX - r.left) / r.width) * 2 - 1, ny = ((e.clientY - r.top) / r.height) * 2 - 1;
          rx(-ny * 12); ry(nx * 16);
          card.style.setProperty("--mx", `${((nx + 1) / 2) * 100}%`);
          card.style.setProperty("--my", `${((ny + 1) / 2) * 100}%`);
        };
        const reset = () => { rx(0); ry(0); };
        card.addEventListener("pointerdown", move);
        card.addEventListener("pointermove", move);
        card.addEventListener("pointerup", reset);
        card.addEventListener("pointercancel", reset);
        card.addEventListener("pointerleave", reset);
        cleanups.push(() => {
          card.removeEventListener("pointerdown", move);
          card.removeEventListener("pointermove", move);
          card.removeEventListener("pointerup", reset);
          card.removeEventListener("pointercancel", reset);
          card.removeEventListener("pointerleave", reset);
        });
      });

      /* ── Outro: floating gear drifts at different depths ── */
      gsap.utils.toArray<HTMLElement>(".wem-float").forEach((f) => {
        const speed = parseFloat(f.dataset.speed || "1");
        gsap.fromTo(f, { y: 120 * speed }, { y: -120 * speed, ease: "none", scrollTrigger: { trigger: ".wem-outro", start: "top bottom", end: "bottom top", scrub: true } });
      });
    }, root);

    /* Sticky purchase bar once past the hero and the lineup (which has its own Buy button) */
    const bar = ScrollTrigger.create({ trigger: "#products", start: "top 70%", end: "max", onToggle: (s) => setShowBar(s.isActive) });

    return () => { bar.kill(); cleanups.forEach((fn) => fn()); ctx.revert(); };
  }, [reduce]);

  return (
    <div ref={root} className="we wem relative min-h-screen" style={{ background: C.bg, color: C.fg }}>
      {/* Loader */}
      <div className="wem-loader fixed inset-0 z-[100] flex flex-col items-center justify-center" style={{ background: C.primary, color: C.bg, clipPath: "circle(150% at 50% 50%)" }}>
        <div className="wem-loader-inner flex flex-col items-center">
          <div className="font-display text-[28vw] font-extrabold leading-none tabular-nums">{count}%</div>
          <div className="mt-3 h-[3px] w-40 overflow-hidden rounded-full" style={{ background: "rgba(7,4,10,0.2)" }}>
            <div className="h-full rounded-full" style={{ width: `${count}%`, background: C.bg }} />
          </div>
          <p className="mt-3 text-[11px] uppercase tracking-[0.3em]">Powering up the store</p>
        </div>
      </div>

      {/* Scroll progress */}
      <div className="wem-progress fixed inset-x-0 top-0 z-[60] h-[2px] origin-left scale-x-0" style={{ background: `linear-gradient(90deg, ${C.accent}, ${C.primary}, ${C.magenta})` }} />

      {/* Top bar */}
      <header className="wem-header fixed inset-x-0 top-0 z-50 flex items-center justify-between px-5 pb-3 pt-[calc(env(safe-area-inset-top)+12px)]" style={{ background: "linear-gradient(to bottom, rgba(7,4,10,0.92), rgba(7,4,10,0.6) 70%, transparent)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}>
        <a href="#top" className="font-display text-lg font-bold tracking-tight" style={{ color: C.fg }}>
          mobileshop<span style={{ color: C.primary }}>.</span>
        </a>
        <div className="flex items-center gap-2">
          <Link to="/support" aria-label="Chat with PhoneFix Assistant" className="flex h-9 w-9 items-center justify-center rounded-full active:scale-90 transition" style={{ background: "rgba(246,239,233,0.08)", border: `1px solid ${C.border}` }}>
            <ChatAssistantIcon size={20} />
          </Link>
          <Link to="/home" className="wem-shine relative overflow-hidden rounded-full px-4 py-2 text-[13px] font-semibold active:scale-95 transition" style={{ background: C.primary, color: C.bg }}>
            Shop now
          </Link>
        </div>
      </header>

      {/* ══ HERO ══ */}
      <section id="top" className="wem-hero relative flex min-h-[100svh] flex-col items-center overflow-hidden px-5 pt-[calc(env(safe-area-inset-top)+80px)] pb-10" style={{ touchAction: "pan-y" }}>
        {/* Aurora + perspective grid floor */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="wem-aurora wem-aurora-a" />
          <div className="wem-aurora wem-aurora-b" />
          <div className="wem-aurora wem-aurora-c" />
          <div className="wem-floor">
            <div className="wem-floor-grid" />
          </div>
        </div>

        <h1 className="wem-hero-title relative z-0 w-full text-center font-display font-extrabold leading-[0.85] tracking-tighter" style={{ fontSize: "clamp(64px, 22vw, 120px)", transformOrigin: "50% 100%" }}>
          <Split text="MOBILE" className="block" style={{ color: C.fg }} />
          <Split text="SHOP" className="block" style={{ color: "transparent", WebkitTextStroke: `2px ${C.fg}` }} />
        </h1>

        {/* 3D stage: phone with masked glare, accessories orbiting around it */}
        <div className="relative z-10 -mt-[4vw] flex w-full flex-1 items-center justify-center" style={{ perspective: 1000 }} aria-hidden="true">
          <div className="wem-hero-3d p3d relative flex items-center justify-center">
            <div className="wem-stage p3d relative flex items-center justify-center">
              <div className="wem-hero-phone relative" style={{ transform: "translateZ(40px)" }}>
                <img src="/phones/ios-a.png" alt="" draggable={false} className="block h-[38svh] w-auto max-w-[58vw] select-none object-contain drop-shadow-[0_30px_60px_rgba(255,59,78,0.45)]" />
                <div className="wem-glare absolute inset-0" style={{ WebkitMaskImage: "url(/phones/ios-a.png)", maskImage: "url(/phones/ios-a.png)" }}>
                  <div className="wem-glare-beam" />
                </div>
              </div>
              <div className="wem-orbit-tilt p3d absolute left-1/2 top-1/2">
                <div className="wem-orbit-spin p3d">
                  {ORBIT.map((o, i) => (
                    <div key={o.src} className="p3d absolute" style={{ transform: `rotateY(${i * 120}deg) translateZ(44vw) rotateY(${-i * 120}deg) translateY(${o.y})` }}>
                      <div className="wem-orbit-face">
                        <img src={o.src} alt="" draggable={false} className="wem-orbit-img block max-w-none select-none" style={{ width: o.w, marginLeft: `calc(${o.w} / -2)`, marginTop: `calc(${o.w} / -2)`, filter: "drop-shadow(0 16px 26px rgba(255,90,70,0.35))" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="wem-hero-fade relative z-10 mt-4 max-w-[19rem] text-center text-[15px] leading-relaxed" style={{ color: C.muted }}>
          Phones, accessories and same-day repairs, all under one roof.
        </p>
        <div className="wem-hero-fade relative z-10 mt-6 grid w-full max-w-sm grid-cols-2 gap-3">
          <Link to="/home" className="wem-shine relative flex h-12 items-center justify-center overflow-hidden rounded-full text-[15px] font-semibold active:scale-95 transition" style={{ background: C.primary, color: C.bg, boxShadow: "0 12px 30px rgba(255,59,78,0.35)" }}>
            Shop now →
          </Link>
          <Link to="/book-repair" className="flex h-12 items-center justify-center rounded-full text-[15px] font-semibold active:scale-95 transition" style={{ border: `1px solid ${C.border}`, color: C.fg, background: "rgba(246,239,233,0.04)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
            Book repair
          </Link>
        </div>
        <div className="wem-hero-fade relative z-10 mt-6 flex flex-col items-center gap-2">
          {needsMotionPermission && !reduce ? (
            <button onClick={enableMotion} className="rounded-full px-4 py-2 text-[12px] font-semibold active:scale-95 transition" style={{ border: `1px solid ${C.border}`, background: "rgba(246,239,233,0.06)" }}>
              ✦ Enable 3D motion
            </button>
          ) : (
            !reduce && <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: C.muted }}>Tilt or drag to explore</span>
          )}
          <a href={reduce ? "#products" : "#lineup"} className="flex flex-col items-center gap-1 text-[10px] uppercase tracking-[0.3em]" style={{ color: C.muted }}>
            Swipe up
            <span className="wem-bob text-base" style={{ color: C.fg }}>↓</span>
          </a>
        </div>
      </section>

      {/* ══ TICKER ══ */}
      <section className="relative z-10 overflow-hidden py-10" aria-hidden="true">
        <div className="wem-ticker">
          <div className="-mx-4 -rotate-[3deg] py-3" style={{ background: C.primary, color: C.bg }}>
            <div className="wem-loop flex w-max whitespace-nowrap font-display text-3xl font-extrabold">
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
            <div className="wem-loop flex w-max whitespace-nowrap font-display text-3xl font-extrabold">
              {[0, 1].map((k) => (
                <span key={k} className="flex shrink-0 items-center gap-6 pr-6">
                  {["Screens fixed", "Batteries swapped", "Warranty included", "Easy checkout"].map((w) => (
                    <span key={w} className="flex items-center gap-6"><span>{w}</span><span className="text-lg">✦</span></span>
                  ))}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ LINEUP: pinned 3D ring ══ */}
      {!reduce && (
        <section id="lineup" className="wem-lineup relative flex h-[100svh] flex-col overflow-hidden pt-[calc(env(safe-area-inset-top)+72px)] pb-[calc(env(safe-area-inset-bottom)+20px)]">
          <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(70% 40% at 50% 55%, rgba(194,24,91,0.35), transparent 70%)" }} />
          <div className="relative px-5">
            <div className="mb-2 flex items-center gap-3 text-[11px] uppercase tracking-[0.3em]" style={{ color: C.primary }}>
              <span className="h-px w-10" style={{ background: C.primary }} />Chapter 01
            </div>
            <Split text="THE LINEUP" className="wem-rv block font-display font-extrabold leading-[0.9] tracking-tighter" style={{ fontSize: "clamp(44px, 14vw, 84px)" }} />
          </div>

          <div className="relative flex flex-1 items-center justify-center" style={{ perspective: 900 }}>
            <div className="wem-ring p3d relative h-0 w-0">
              {WEB_PRODUCTS.map((p) => (
                <div key={p.slug} className="wem-ring-item p3d absolute" style={{ width: "44vw", maxWidth: 210, height: "min(58vw, 280px)", left: "calc(min(44vw, 210px) / -2)", top: "calc(min(58vw, 280px) / -2)" }}>
                  <Link to={shopUrl(p.slug)} className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-[26px] p-3" style={{ background: `linear-gradient(160deg, #2a111d, ${C.card} 65%)`, border: `1px solid ${C.border}`, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", boxShadow: "0 30px 60px rgba(0,0,0,0.6)" }}>
                    <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full" style={{ background: "radial-gradient(circle, rgba(255,59,78,0.45), transparent 70%)" }} />
                    <img src={p.src} alt={p.name} loading="lazy" draggable={false} className="max-h-[75%] max-w-[85%] object-contain drop-shadow-[0_18px_28px_rgba(0,0,0,0.6)]" />
                    <span className="absolute bottom-3 left-3 rounded-full px-2.5 py-0.5 text-[10px] font-medium" style={{ border: `1px solid ${C.border}` }}>{p.tag}</span>
                  </Link>
                </div>
              ))}
            </div>
            {/* reflective floor */}
            <div className="pointer-events-none absolute bottom-[6%] left-1/2 h-10 w-[70vw] -translate-x-1/2 rounded-[50%] blur-xl" style={{ background: "rgba(255,59,78,0.35)" }} />
          </div>

          <div className="relative px-5" style={{ perspective: 600 }}>
            <motion.div key={active} initial={{ opacity: 0, y: 24, rotateX: -60 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="flex items-end justify-between gap-3" style={{ transformOrigin: "50% 100%" }}>
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.25em]" style={{ color: C.muted }}>{String(active + 1).padStart(2, "0")} / {String(WEB_PRODUCTS.length).padStart(2, "0")} · {lineupProduct.tag}</p>
                <h3 className="mt-1 truncate font-display text-2xl font-bold tracking-tight">{lineupProduct.name}</h3>
                <p className="font-display text-xl font-bold" style={{ color: C.primary }}>{inr(lineupProduct.price)}</p>
              </div>
              <Link to={shopUrl(lineupProduct.slug)} className="wem-shine relative flex h-12 shrink-0 items-center overflow-hidden rounded-full px-5 text-[14px] font-semibold active:scale-95 transition" style={{ background: C.primary, color: C.bg }}>
                Buy →
              </Link>
            </motion.div>
            <div className="mt-4 h-[2px] w-full overflow-hidden rounded-full" style={{ background: C.border }}>
              <div className="wem-lineup-bar h-full origin-left scale-x-0" style={{ background: C.primary }} />
            </div>
          </div>
        </section>
      )}

      {/* ══ SHOP: coverflow shelf ══ */}
      <section id="products" className="relative pt-14 pb-14">
        <div className="px-5">
          <div className="wem-reveal mb-3 flex items-center gap-3 text-[11px] uppercase tracking-[0.3em]" style={{ color: C.primary }}>
            <span className="h-px w-10" style={{ background: C.primary }} />Chapter 02
          </div>
          <Split text="PRODUCTS" className="wem-rv block font-display font-extrabold leading-[0.9] tracking-tighter" style={{ fontSize: "clamp(52px, 17vw, 96px)" }} />
          <p className="wem-reveal mt-3 max-w-sm text-[15px]" style={{ color: C.muted }}>New phones, audio and charging gear. Swipe through and pick what you like.</p>
        </div>

        <div className="wem-noscroll wem-reveal mt-6 flex gap-2 overflow-x-auto px-5" role="tablist" aria-label="Product categories">
          {TAGS.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tag === t}
              onClick={() => { buzz(); setTag(t); }}
              className="relative h-9 shrink-0 rounded-full px-4 text-[13px] font-semibold transition active:scale-95"
              style={tag === t ? { color: C.bg } : { border: `1px solid ${C.border}`, color: C.fg }}
            >
              {tag === t && <motion.span layoutId="wem-chip" className="absolute inset-0 rounded-full" style={{ background: C.fg }} transition={{ type: "spring", stiffness: 420, damping: 32 }} />}
              <span className="relative">{t}</span>
            </button>
          ))}
        </div>

        <div ref={shelfRef} className="wem-noscroll relative mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto py-4" style={{ paddingInline: "16vw" }}>
          {products.map((p, i) => (
            <div key={`${tag}-${p.slug}`} className="w-[68vw] max-w-[300px] shrink-0 snap-center" style={{ perspective: 900 }}>
              <div className="h-full will-change-transform" style={{ transformStyle: "preserve-3d" }}>
                <article className="wem-card-in relative flex h-full flex-col overflow-hidden rounded-[26px] p-4" style={{ animationDelay: `${Math.min(i, 3) * 70}ms`, background: `linear-gradient(160deg, #22101a, ${C.card} 60%)`, border: `1px solid ${C.border}`, boxShadow: "0 24px 50px rgba(0,0,0,0.5)" }}>
                  <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full" style={{ background: "radial-gradient(circle, rgba(255,59,78,0.35), transparent 70%)" }} />
                  <span className="relative z-10 self-start rounded-full px-3 py-1 text-[11px] font-medium" style={{ border: `1px solid ${C.border}` }}>{p.tag}</span>
                  <div className="relative z-10 flex h-[38vw] max-h-[180px] items-center justify-center py-3">
                    <img src={p.src} alt={p.name} loading="lazy" draggable={false} className={`max-h-full max-w-[80%] object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.6)] transition-transform duration-700 ${i === shelfIdx ? "scale-110 -rotate-3" : ""}`} />
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
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-center gap-1.5">
          {products.map((p, i) => (
            <button key={p.slug} onClick={() => shelfGoTo(i)} aria-label={`Show ${p.name}`} className="h-1.5 rounded-full transition-all duration-500" style={{ width: i === shelfIdx ? 28 : 6, background: i === shelfIdx ? C.primary : C.border }} />
          ))}
        </div>
      </section>

      {/* ══ HOW IT WORKS: stacking 3D cards ══ */}
      <section className="px-4 pb-16">
        <div className="px-1">
          <p className="wem-reveal mb-2 text-[11px] uppercase tracking-[0.3em]" style={{ color: C.primary }}>How it works</p>
          <Split text="Fixed in three steps." className="wem-rv mb-8 block font-display text-[40px] font-bold leading-[1.02] tracking-tight" />
        </div>
        {STEPS.map(([n, t, d, img, bg], i) => (
          <div key={n} className="wem-step sticky mb-5" style={{ top: `calc(env(safe-area-inset-top) + ${76 + i * 16}px)`, perspective: 1000 }}>
            <div className="wem-step-card relative min-h-[280px] overflow-hidden rounded-[30px] p-6" style={{ transformOrigin: "50% 0%", background: bg, border: `1px solid ${C.border}`, boxShadow: "0 -10px 40px rgba(0,0,0,0.5)" }}>
              <div className="relative z-10 max-w-[62%]">
                <div className="font-display text-[72px] font-extrabold leading-[0.85] tracking-tighter" style={{ color: "transparent", WebkitTextStroke: `1.5px ${i === 2 ? C.bg : C.fg}` }}>{n}</div>
                <h3 className="mt-4 font-display text-2xl font-bold">{t}</h3>
                <p className="mt-2 text-[14px] leading-relaxed" style={{ color: i === 2 ? "rgba(255,255,255,0.85)" : C.muted }}>{d}</p>
              </div>
              <img src={img} alt="" loading="lazy" className="wem-step-img pointer-events-none absolute -right-6 bottom-2 h-[210px] w-auto object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.5)]" />
              <div className="wem-step-shade pointer-events-none absolute inset-0 z-20 bg-black opacity-0" />
            </div>
          </div>
        ))}

        <div className="mt-8 grid grid-cols-3 gap-2" style={{ perspective: 800 }}>
          {STATS.map(([n, pre, suf, t]) => (
            <div key={t} className="wem-flip rounded-2xl px-2 py-4 text-center" style={{ background: C.card, border: `1px solid ${C.border}` }}>
              <div className="font-display text-[32px] font-extrabold leading-none tracking-tight" style={{ color: C.primary }}>
                {pre}<span className="wem-count" data-to={n}>{n}</span><span className="text-lg">{suf}</span>
              </div>
              <p className="mt-2 text-[11px] leading-tight" style={{ color: C.muted }}>{t}</p>
            </div>
          ))}
        </div>

        <div className="wem-reveal mt-6" style={{ perspective: 900 }}>
          <Link to="/book-repair" className="wem-tilt wem-glow-card relative flex items-center gap-4 rounded-[26px] p-5" style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.magenta})`, color: C.fg, transformStyle: "preserve-3d" }}>
            <div className="relative flex-1" style={{ transform: "translateZ(30px)" }}>
              <p className="text-[11px] uppercase tracking-[0.25em] opacity-80">Same-day repair</p>
              <p className="mt-1 font-display text-xl font-bold leading-tight">Cracked screen? Dead battery?</p>
              <p className="mt-2 text-[13px] font-semibold">Book a slot →</p>
            </div>
            <img src="/phones/ios-b.png" alt="" className="relative h-28 w-auto drop-shadow-[0_16px_24px_rgba(0,0,0,0.45)]" style={{ transform: "translateZ(60px) rotate(12deg)" }} />
          </Link>
        </div>
      </section>

      {/* ══ REVIEWS: swipe deck ══ */}
      <section id="reviews" className="pb-16" style={{ background: "linear-gradient(to bottom, transparent, #14060c 18%, #14060c 82%, transparent)" }}>
        <div className="px-5 pt-6">
          <p className="wem-reveal mb-2 text-[11px] uppercase tracking-[0.3em]" style={{ color: C.primary }}>Customer reviews</p>
          <Split text="Loved by the neighbourhood." className="wem-rv block font-display text-[40px] font-bold leading-[1.02] tracking-tight" />
          <div className="wem-reveal mt-5 mb-8 flex items-center gap-4">
            <div className="font-display text-6xl font-extrabold" style={{ color: C.primary }}>
              <span className="wem-count" data-to="4.9" data-dec="1">4.9</span>
            </div>
            <div>
              <div className="text-lg tracking-widest" style={{ color: C.accent }}>★★★★★</div>
              <div className="text-[13px]" style={{ color: C.muted }}><span className="wem-count" data-to="1200">1,200</span>+ happy customers</div>
            </div>
          </div>
        </div>
        <div className="wem-reveal">
          <ReviewDeck />
        </div>
      </section>

      {/* ══ OUTRO ══ */}
      <section id="contact" className="wem-outro relative flex min-h-[85svh] flex-col items-center justify-center overflow-hidden px-5 pb-32 pt-16 text-center">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(70% 40% at 50% 45%, rgba(255,59,78,0.3), transparent 70%)" }} />
        {[
          { src: "/phones/gold.png", cls: "left-[-6%] top-[4%] w-[22vw] max-w-[110px] opacity-80", speed: 1.3, depth: 1.6 },
          { src: "/products/earbuds-chrome.png", cls: "right-[2%] top-[12%] w-[24vw] max-w-[120px]", speed: 0.7, depth: 1 },
          { src: "/products/charger-20w.png", cls: "bottom-[24%] left-[4%] w-[20vw] max-w-[100px]", speed: 0.9, depth: 0.8 },
          { src: "/products/phone-10t.png", cls: "bottom-[20%] right-[-4%] w-[22vw] max-w-[110px] opacity-80", speed: 1.5, depth: 1.8 },
        ].map((f, i) => (
          <div key={f.src} className={`wem-float pointer-events-none absolute ${f.cls}`} data-speed={f.speed} aria-hidden="true">
            <div className="wem-par" data-depth={f.depth}>
              <img src={f.src} alt="" loading="lazy" className={`w-full ${i % 2 ? "wem-bob-alt" : "wem-bob"}`} />
            </div>
          </div>
        ))}

        <div className="relative z-10">
          <h2 className="font-display font-extrabold leading-[0.95] tracking-tighter" style={{ fontSize: "clamp(52px, 16vw, 90px)" }}>
            <Split text="Drop in." className="wem-rv block" />
            <Split text="Power up." className="wem-rv block" style={{ color: "transparent", WebkitTextStroke: `2px ${C.fg}` }} />
          </h2>
          <p className="wem-reveal mx-auto mt-4 max-w-[17rem] text-[15px]" style={{ color: C.muted }}>Found something you like? Pick up where you left off.</p>
          <div className="wem-reveal relative mt-8 inline-block">
            <span className="wem-pulse absolute inset-0 rounded-full" style={{ background: C.primary }} aria-hidden="true" />
            <Link to="/home" className="wem-shine relative inline-flex h-14 items-center overflow-hidden rounded-full px-9 text-[16px] font-semibold active:scale-95 transition" style={{ background: C.primary, color: C.bg }}>
              Continue purchase →
            </Link>
          </div>
        </div>

        <footer className="absolute inset-x-0 bottom-0 z-10 flex justify-between px-5 pb-[calc(env(safe-area-inset-bottom)+88px)] text-[11px]" style={{ color: C.muted }}>
          <span>© {new Date().getFullYear()} mobileshop</span>
          <span>Phones · Accessories</span>
        </footer>
      </section>

      {/* Sticky purchase bar */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] transition-transform duration-500"
        style={{ transform: showBar ? "translateY(0)" : "translateY(120%)", transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)" }}
        aria-hidden={!showBar}
      >
        <div className="flex items-center gap-3 rounded-full p-1.5 pl-5 shadow-[0_16px_40px_rgba(0,0,0,0.6)]" style={{ background: "rgba(26,11,18,0.88)", border: `1px solid ${C.border}`, backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" }}>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold">Phones, audio & repairs</p>
            <p className="text-[11px]" style={{ color: C.muted }}>Free diagnosis · 6-mo warranty</p>
          </div>
          <Link to="/home" tabIndex={showBar ? 0 : -1} className="wem-shine relative flex h-11 shrink-0 items-center overflow-hidden rounded-full px-5 text-[14px] font-semibold active:scale-95 transition" style={{ background: C.primary, color: C.bg }}>
            Shop now →
          </Link>
        </div>
      </div>

      <ScrollEndRedirect to="/home" bottomOffset={92} />
    </div>
  );
}
