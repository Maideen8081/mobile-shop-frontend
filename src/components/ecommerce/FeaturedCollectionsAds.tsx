import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { categoryHref, resolveCategoryName, type HeaderCategory } from './navConfig'
import './FeaturedCollectionsAds.css'

type Props = { categories: HeaderCategory[] }

/** Desktop home "Featured Collections" advertisement grid (3 tiles + 2 wide banners). */
export default function FeaturedCollectionsAds({ categories }: Props) {
  const href = (label: string) => categoryHref(resolveCategoryName(label, categories))

  return (
    <section className="fca" aria-labelledby="fca-title">
      <div className="fca-head">
        <h2 id="fca-title">Featured Collections</h2>
        <Link to="/collection/all" className="fca-viewall">
          View All <ArrowRight size={14} />
        </Link>
      </div>

      <div className="fca-grid">
        {/* Laptops */}
        <Link to={href('Laptops')} className="fca-card fca-dark fca-laptop">
          <img className="fca-photo" src="/promos/laptop.jpg" alt="" loading="lazy" />
          <div className="fca-copy">
            <h3>Pro Performance<br />Everyday</h3>
            <p>Laptops for work, play<br />and beyond.</p>
            <span className="fca-btn fca-btn-light">Explore Laptops <ArrowRight size={14} /></span>
          </div>
        </Link>

        {/* Audio */}
        <Link to={href('Audio')} className="fca-card fca-dark fca-audio">
          <span className="fca-glow" aria-hidden="true" />
          <img className="fca-product" src="/products/headphones-anc.png" alt="" loading="lazy" />
          <div className="fca-copy">
            <h3>Sound<br />Reimagined</h3>
            <p>Premium audio<br />for a richer you.</p>
            <span className="fca-btn fca-btn-light">Shop Audio <ArrowRight size={14} /></span>
          </div>
        </Link>

        {/* Smart home */}
        <Link to={href('Smart Home')} className="fca-card fca-light fca-home">
          <img className="fca-photo" src="/promos/smart-home.jpg" alt="" loading="lazy" />
          <div className="fca-copy">
            <h3>Live Smarter<br />at Home</h3>
            <p>Smart devices for<br />a connected life.</p>
            <span className="fca-btn fca-btn-dark">Shop Smart Home <ArrowRight size={14} /></span>
          </div>
        </Link>

        {/* Deals banner */}
        <Link to="/collection/all?tab=deals" className="fca-card fca-light fca-deal">
          <div className="fca-copy">
            <span className="fca-kicker">Limited Time Offer</span>
            <h3 className="fca-deal-title">Up to <em>40%</em> Off</h3>
            <p className="fca-deal-sub">Top Tech Brands</p>
            <span className="fca-btn fca-btn-dark">Shop Deals <ArrowRight size={14} /></span>
          </div>
          <div className="fca-deal-art" aria-hidden="true">
            <span className="fca-pedestal" />
            <img className="fca-deal-phone" src="/products/phone-10t.png" alt="" loading="lazy" />
            <img className="fca-deal-buds" src="/products/earbuds-pro.png" alt="" loading="lazy" />
            <img className="fca-deal-watch" src="/promos/watch.png" alt="" loading="lazy" />
          </div>
        </Link>

        {/* Gaming banner */}
        <Link to={href('Gaming')} className="fca-card fca-accent fca-gaming">
          <img className="fca-photo" src="/promos/gaming.jpg" alt="" loading="lazy" />
          <div className="fca-copy">
            <h3>Upgrade<br />Your Game</h3>
            <p>Consoles, accessories<br />and more.</p>
            <span className="fca-btn fca-btn-accent">Shop Gaming <ArrowRight size={14} /></span>
          </div>
        </Link>
      </div>
    </section>
  )
}
