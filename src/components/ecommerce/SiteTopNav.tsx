import HomeTopNav from './HomeTopNav'

/**
 * Shared site navigation. Every storefront page renders this same bar — it is
 * the Home page top nav (announcement bar + header + category nav).
 */
export default function SiteTopNav(props: { transparent?: boolean } = {}) {
  void props
  return <HomeTopNav />
}
