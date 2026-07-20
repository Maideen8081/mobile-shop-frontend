import { ProductSection } from './ProductSection'

export default function RefurbishedSection({ products }: { products: any[] }) {
  return <ProductSection title="Certified Refurbished" viewAllTo="/phones" products={products} />
}
