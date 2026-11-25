import { products, categories } from '@/data/products'
import { inr } from '@/lib/format'
import { Plus } from 'lucide-react'

export default function AdminProducts() {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-extrabold">Products</h1>
        <button className="btn-primary !py-2 text-sm" title="Hooks up to POST /admin/products"><Plus size={16} /> Add product</button>
      </div>
      <p className="text-ink-500 text-sm mb-5">{products.length} products · {categories.length} categories. CRUD connects to the backend later.</p>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead className="bg-ink-50 text-left text-ink-500">
            <tr><Th>Product</Th><Th>Category</Th><Th>Variants</Th><Th>Price from</Th><Th>Total stock</Th><Th>Status</Th></tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const stock = p.variants.reduce((n, v) => n + v.stock, 0)
              return (
                <tr key={p.id} className="border-t border-[#f0f0ec]">
                  <Td>
                    <div className="flex items-center gap-3">
                      <img src={p.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      <span className="font-semibold">{p.name}</span>
                    </div>
                  </Td>
                  <Td className="capitalize">{p.category.replace('-', ' ')}</Td>
                  <Td>{p.variants.map((v) => v.size).join(', ')}</Td>
                  <Td className="font-semibold">{inr(Math.min(...p.variants.map((v) => v.price)))}</Td>
                  <Td>
                    <span className={`font-bold ${stock > 30 ? 'text-green-600' : stock > 0 ? 'text-amber-600' : 'text-red-600'}`}>{stock}</span>
                  </Td>
                  <Td><span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700">Active</span></Td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
const Th = ({ children }) => <th className="px-4 py-3 font-semibold whitespace-nowrap">{children}</th>
const Td = ({ children, className = '' }) => <td className={`px-4 py-3 whitespace-nowrap ${className}`}>{children}</td>
