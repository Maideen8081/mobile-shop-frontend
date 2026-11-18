import { Link } from 'react-router-dom'
import type { Category } from '../../services/categoryService'
import { categoryHref, iconForCategory } from '../ecommerce/navConfig'
import CategoryRail from '../ecommerce/CategoryRail'
import { getImageUrl } from './helpers'

export default function MobileCategoryGrid({ categories }: { categories: Category[] }) {
  if (!categories.length) return null

  return (
    <CategoryRail className="mobile-categories mx-3.5 mt-5" headingClassName="mb-3" trackClassName="mobile-category-row">
      {categories.map((category) => {
        const image = getImageUrl(category.image)
        const Icon = iconForCategory(category.name)
        return (
          <Link
            key={category.id}
            to={categoryHref(category.name)}
            className="flex min-w-0 flex-col items-center gap-1.5"
          >
            <span className="mobile-category-media relative grid aspect-square w-full place-items-center text-[#0f3b2c]">
              <Icon size={30} strokeWidth={1.5} aria-hidden="true" />
              {image && (
                <img
                  key={image}
                  src={image}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 h-full w-full rounded-full object-cover"
                  onError={(event) => { event.currentTarget.hidden = true }}
                />
              )}
            </span>
            <span className="max-w-full text-center text-caption font-semibold leading-tight wrap-anywhere text-[#0f3b2c]">
              {category.name}
            </span>
          </Link>
        )
      })}
    </CategoryRail>
  )
}
