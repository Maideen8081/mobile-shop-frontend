import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { WEB_PRODUCTS, inr, shopUrl } from "../data/websiteCatalog";
import "../styles/website-experience.css";
import ScrollEndRedirect from "../components/ScrollEndRedirect";
import { useRingStepper } from "../hooks/useRingStepper";

gsap.registerPlugin(ScrollTrigger);

export default function WebsiteExperience() {
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [ringIdx, setRingIdx] = useState(0);
  const { attach, sync, snap, goTo, step } = useRingStepper(WEB_PRODUCTS.length, stage);

  useEffect(() => {
    if (!root.current) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const lenis = new Lenis({ lerp: 0.09, smoothWheel: !reduce });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const ctx = gsap.context(() => {
      /* ── 3D PRODUCT RING ── */
      const ringItems = gsap.utils.toArray<HTMLElement>(".ring-item");
      const NR = ringItems.length, stepA = 360 / NR;
      const ringR = () => Math.max(380, Math.min(window.innerWidth * 0.4, 700));
      const layoutRing = () => {
        const R = ringR();
        ringItems.forEach((el, i) => { gsap.set(el, { rotateY: i * stepA }); (el.firstElementChild as HTMLElement).style.transform = `translateZ(${R}px)`; });
        gsap.set(".we-ring", { z: -R });
      };
      layoutRing();
      ScrollTrigger.addEventListener("refreshInit", layoutRing);
      let lastRing = -1;
      const spin = gsap.to(".we-ring", {
        rotateY: -(NR - 1) * stepA, ease: "none",
        scrollTrigger: {
          trigger: ".we-shelf", start: "top top", end: `+=${NR * 65}%`, pin: true, scrub: 0.7,
          snap: { snapTo: snap, duration: { min: 0.2, max: 0.6 }, ease: "power2.inOut" },
          onUpdate: (self) => {
            const pos = self.progress * (NR - 1), idx = Math.round(pos);
            ringItems.forEach((el, i) => {
              const d = Math.abs(i - pos);
              gsap.set(el.firstElementChild, { opacity: gsap.utils.clamp(0, 1, 1.15 - d * 0.42) });
            });
            sync(idx);
            if (idx !== lastRing) { lastRing = idx; setRingIdx(idx); }
          },
        },
      });
      attach(spin.scrollTrigger, (y, done) => lenis.scrollTo(y, { duration: reduce ? 0 : 1.1, immediate: reduce, onComplete: done }));
      gsap.to(".ring-glow", { scale: 1.15, opacity: 0.9, duration: 2.4, ease: "sine.inOut", yoyo: true, repeat: -1 });
      gsap.from(".we-ring", { opacity: 0, scale: 0.85, duration: 1.2, ease: "expo.out" });

      /* ── SCROLL PROGRESS ── */
      gsap.to(".we-progress", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });

      /* ── MAGNET BUTTONS ── */
      gsap.utils.toArray<HTMLElement>(".magnet").forEach((el) => {
        const mx = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3.out" });
        const my = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3.out" });
        el.addEventListener("pointermove", (e) => { const r = el.getBoundingClientRect(); mx((e.clientX - r.left - r.width / 2) * 0.3); my((e.clientY - r.top - r.height / 2) * 0.4); });
        el.addEventListener("pointerleave", () => { mx(0); my(0); });
      });

      /* ── CUSTOM CURSOR ── */
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

      return () => {
        ScrollTrigger.removeEventListener("refreshInit", layoutRing);
        removeCursor();
      };
    }, root);

    return () => {
      ctx.revert();
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, [attach, sync, snap]);

  const rp = WEB_PRODUCTS[ringIdx] ?? WEB_PRODUCTS[0];

  return (
    <div ref={root} className="we relative" style={{ background: "#07040a", color: "#f6efe9", overflowX: "hidden" }}>
      {/* Nav */}
      <header className="we-nav fixed inset-x-0 top-0 z-50 flex items-center justify-between px-5 py-4 md:px-10">
        <Link to="/home" className="font-display text-xl font-bold tracking-tight" style={{ color: "#f6efe9" }}>
          mobileshop<span style={{ color: "#ff3b4e" }}>.</span>
        </Link>
        <Link to="/home" className="magnet rounded-full px-5 py-2 text-sm font-medium transition hover:opacity-90" style={{ background: "#ff3b4e", color: "#07040a" }}>
          Continue purchase →
        </Link>
      </header>

      {/* Scroll progress bar */}
      <div className="we-progress fixed inset-x-0 top-0 z-[90] h-[3px] origin-left scale-x-0" style={{ background: "linear-gradient(to right, #ff3b4e, #ff8a3d, #c2185b)" }} />
      {/* Custom cursor */}
      <div className="we-cursor pointer-events-none fixed left-0 top-0 z-[95] -ml-3 -mt-3 hidden h-6 w-6 rounded-full opacity-0 mix-blend-difference md:block" style={{ border: "1px solid #f6efe9" }} />

      {/* ══ 3D PRODUCT RING ══ */}
      <section id="shelf" className="we-shelf relative flex h-screen flex-col items-center justify-between overflow-hidden pb-6 pt-20" style={{ background: "#07040a" }}>
        <div className="ring-glow pointer-events-none absolute left-1/2 top-[45%] h-[75vh] w-[75vh] -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl" style={{ background: "radial-gradient(circle, rgba(255,59,78,0.35), transparent 65%)" }} />
        <div className="relative z-10 w-full px-5 md:px-10">
          <p className="text-xs uppercase tracking-[0.3em]" style={{ color: "#ff3b4e" }}>In store now · scroll, swipe or use ← → to spin</p>
        </div>
        <div ref={stage} className="relative z-10 min-h-0 w-full flex-1 select-none" style={{ perspective: 1900, touchAction: "pan-y" }}>
          <div className="we-ring preserve-3d absolute left-1/2 top-1/2 h-0 w-0">
            {WEB_PRODUCTS.map((p) => (
              <div
                key={p.slug}
                className="ring-item preserve-3d absolute left-0 top-0"
                style={{ width: 340, height: "min(52vh, 560px)", marginLeft: -170, marginTop: "calc(min(52vh, 560px) / -2)" }}
              >
                <div className="flex h-full w-full items-center justify-center" style={{ backfaceVisibility: "hidden" }}>
                  <img src={p.src} alt={p.name} draggable={false} className="max-h-full max-w-full object-contain drop-shadow-[0_30px_40px_rgba(0,0,0,0.6)]" />
                </div>
              </div>
            ))}
          </div>
          {([["prev", -1, ChevronLeft, "left-4 md:left-10"], ["next", 1, ChevronRight, "right-4 md:right-10"]] as const).map(([label, dir, Icon, side]) => (
            <button
              key={label}
              type="button"
              onClick={() => step(dir)}
              aria-label={label === "prev" ? "Previous product" : "Next product"}
              className={`absolute top-1/2 z-20 -mt-7 flex h-14 w-14 items-center justify-center rounded-full backdrop-blur-md transition hover:scale-105 hover:border-[#ff3b4e] hover:text-[#ff3b4e] active:scale-95 ${side}`}
              style={{ background: "rgba(246,239,233,0.06)", border: "1px solid rgba(246,239,233,0.16)", color: "#f6efe9" }}
            >
              <Icon size={26} strokeWidth={1.75} />
            </button>
          ))}
        </div>
        <div className="relative z-10 w-full max-w-xl px-5 text-center">
          <div key={rp.slug}>
            <span className="rounded-full px-3 py-1 text-xs" style={{ border: "1px solid rgba(246,239,233,0.12)", color: "#f6efe9" }}>{rp.tag}</span>
            <h3 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-5xl" style={{ color: "#f6efe9" }}>{rp.name}</h3>
            <p className="mt-2" style={{ color: "#8f8590" }}>{rp.blurb}</p>
            <div className="mt-2 font-display text-3xl" style={{ color: "#ff3b4e" }}>{inr(rp.price)}</div>
          </div>
          <Link to={shopUrl(rp.slug)} className="magnet mt-4 inline-block rounded-full px-8 py-3 font-medium transition hover:opacity-80" style={{ background: "#ff3b4e", color: "#07040a" }}>
            Continue purchase →
          </Link>
          <div className="mt-2 flex justify-center">
            {WEB_PRODUCTS.map((p, i) => (
              <button key={p.slug} type="button" onClick={() => goTo(i)} aria-label={`Show ${p.name}`} aria-current={i === ringIdx} className="px-[3px] py-2">
                <span className="block h-1.5 rounded-full transition-all" style={{ width: i === ringIdx ? 32 : 6, background: i === ringIdx ? "#ff3b4e" : "rgba(246,239,233,0.12)" }} />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Run-out so the last product isn't the page end: landing on it (scroll, arrows, dots)
          shouldn't fire the redirect — scrolling on past it does. */}
      <div className="flex h-[35vh] items-center justify-center text-xs uppercase tracking-[0.3em]" style={{ color: "#8f8590" }}>
        Keep scrolling to enter the store ↓
      </div>

      <ScrollEndRedirect to="/home" />
    </div>
  );
}
