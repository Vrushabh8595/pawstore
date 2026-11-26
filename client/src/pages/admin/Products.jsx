import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, X, AlertTriangle } from 'lucide-react'
import { api } from '@/lib/api'
import { useFieldErrors } from '@/components/FormField'
import { ItemImg } from './ui'
import { inr } from '@/lib/format'

const LOW_STOCK = 3

const cx = (...a) => a.filter(Boolean).join(' ')
const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
const totalStock = (p) => (p.variants || []).reduce((n, v) => n + (Number(v.stock) || 0), 0)
const minPrice = (p) => Math.min(...(p.variants || [{ price: 0 }]).map((v) => Number(v.price) || 0))

const LIFE = ['puppy', 'adult', 'senior', 'all']
const SIZES = ['small', 'medium', 'large']
const TYPES = ['dry', 'wet', 'treats', 'accessory']

const blankVariant = () => ({ sku: '', size: '', flavour: '', price: '', mrp: '', stock: 0 })
const blankProduct = () => ({
  name: '', slug: '', brand: '', category: '', images: [''], short: '', description: '',
  lifeStage: 'adult', breedSize: 'medium', foodType: 'dry', diet: '', tags: '',
  rating: 0, reviews: 0, variants: [blankVariant()],
})

export default function AdminProducts() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(null) // product object or 'new' or null

  const productsQ = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => api.get('/products?limit=200&sort=popular'),
  })
  const categoriesQ = useQuery({ queryKey: ['categories'], queryFn: () => api.get('/products/categories') })

  const products = productsQ.data?.items || []
  const categories = categoriesQ.data || []
  const lowStock = useMemo(() => products.filter((p) => totalStock(p) < LOW_STOCK), [products])

  const save = useMutation({
    mutationFn: (payload) =>
      payload._id
        ? api.patch('/admin/products/' + payload._id, payload)
        : api.post('/admin/products', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] })
      qc.invalidateQueries({ queryKey: ['catalog'] })
      setEditing(null)
    },
  })
  const remove = useMutation({
    mutationFn: (id) => api.del('/admin/products/' + id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] })
      qc.invalidateQueries({ queryKey: ['catalog'] })
    },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-extrabold">Products</h1>
        <button onClick={() => setEditing('new')} className="btn-primary !py-2 text-sm"><Plus size={16} /> Add product</button>
      </div>
      <p className="text-ink-500 text-sm mb-5">{products.length} products · {categories.length} categories</p>

      {lowStock.length > 0 && (
        <div className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-4 flex gap-3">
          <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
          <div className="text-sm">
            <p className="font-bold text-amber-800">{lowStock.length} product{lowStock.length > 1 ? 's' : ''} low on stock (under {LOW_STOCK} units)</p>
            <p className="text-amber-700 mt-0.5">{lowStock.map((p) => p.name + ' (' + totalStock(p) + ')').join(' · ')}</p>
          </div>
        </div>
      )}

      {productsQ.isLoading ? (
        <div className="card p-10 text-center text-ink-500">Loading products…</div>
      ) : productsQ.isError ? (
        <div className="card p-10 text-center text-red-600">Couldn’t load products. Is the API awake? ({String(productsQ.error.message)})</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="bg-ink-50 text-left text-ink-500">
              <tr><Th>Product</Th><Th>Category</Th><Th>Variants</Th><Th>Price from</Th><Th>Total stock</Th><Th>Actions</Th></tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const stock = totalStock(p)
                return (
                  <tr key={p._id} className="border-t border-[#f0f0ec]">
                    <Td>
                      <div className="flex items-center gap-3">
                        <ItemImg src={p.images?.[0]} alt={p.name} className="w-10 h-10" />
                        <span className="font-semibold">{p.name}</span>
                      </div>
                    </Td>
                    <Td className="capitalize">{(p.category || '').replace(/-/g, ' ')}</Td>
                    <Td>{(p.variants || []).map((v) => v.size).filter(Boolean).join(', ') || '—'}</Td>
                    <Td className="font-semibold">{inr(minPrice(p))}</Td>
                    <Td>
                      <span className={cx('font-bold', stock >= 30 ? 'text-green-600' : stock >= LOW_STOCK ? 'text-amber-600' : 'text-red-600')}>{stock}</span>
                    </Td>
                    <Td>
                      <div className="flex gap-1.5">
                        <button onClick={() => setEditing({ ...p, images: p.images?.length ? p.images : [''], diet: (p.diet || []).join(', '), tags: (p.tags || []).join(', ') })}
                          className="p-1.5 rounded-lg hover:bg-ink-100" title="Edit"><Pencil size={16} /></button>
                        <button onClick={() => { if (confirm('Deactivate ' + p.name + '?')) remove.mutate(p._id) }}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-500" title="Delete"><Trash2 size={16} /></button>
                      </div>
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <ProductForm
          initial={editing === 'new' ? blankProduct() : editing}
          categories={categories}
          saving={save.isPending}
          error={save.isError ? String(save.error.message) : ''}
          onCancel={() => setEditing(null)}
          onSave={(payload) => save.mutate(payload)}
          onCategoryAdded={() => qc.invalidateQueries({ queryKey: ['categories'] })}
        />
      )}
    </div>
  )
}

function ProductForm({ initial, categories, saving, error, onCancel, onSave, onCategoryAdded }) {
  const [f, setF] = useState(initial)
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }))
  const setVariant = (i, k, v) => { setF((s) => ({ ...s, variants: s.variants.map((x, j) => (j === i ? { ...x, [k]: v } : x)) })); fe.clear(`v${i}`) }
  const addVariant = () => setF((s) => ({ ...s, variants: [...s.variants, blankVariant()] }))
  const delVariant = (i) => setF((s) => ({ ...s, variants: s.variants.filter((_, j) => j !== i) }))

  const fe = useFieldErrors()
  const addCategory = useMutation({
    mutationFn: (cat) => api.post('/admin/categories', cat),
    onSuccess: (cat) => { onCategoryAdded(); set('category', cat.slug) },
  })
  const newCategory = () => {
    const name = prompt('New category name (e.g. Grooming)')
    if (!name) return
    addCategory.mutate({ name: name.trim(), slug: slugify(name) })
  }

  const submit = (e) => {
    e.preventDefault()
    const rules = {
      name: !f.name?.trim() ? 'Enter the product name.' : null,
      category: !f.category ? 'Choose a category.' : null,
      variants: !(f.variants || []).length ? 'Add at least one size / variant.' : null,
    }
    ;(f.variants || []).forEach((v, i) => {
      rules[`v${i}`] = !String(v.sku || '').trim() ? `Variant ${i + 1}: enter a SKU.` : !String(v.size || '').trim() ? `Variant ${i + 1}: enter the size / weight.` : !(Number(v.price) > 0) ? `Variant ${i + 1}: enter a price above 0.` : v.mrp && Number(v.mrp) < Number(v.price) ? `Variant ${i + 1}: MRP can’t be lower than the price.` : null
    })
    if (!fe.validate(rules)) return
    const payload = {
      ...f,
      slug: f.slug || slugify(f.name),
      images: (f.images || []).map((s) => s.trim()).filter(Boolean),
      diet: String(f.diet || '').split(',').map((s) => s.trim()).filter(Boolean),
      tags: String(f.tags || '').split(',').map((s) => s.trim()).filter(Boolean),
      rating: Number(f.rating) || 0,
      reviews: Number(f.reviews) || 0,
      variants: (f.variants || []).map((v) => ({
        sku: v.sku, size: v.size, flavour: v.flavour,
        price: Number(v.price) || 0, mrp: Number(v.mrp) || 0, stock: Number(v.stock) || 0,
      })),
    }
    onSave(payload)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex justify-end">
      <div className="w-full max-w-2xl bg-white h-full overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-[#f0f0ec] px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-extrabold">{f._id ? 'Edit product' : 'Add product'}</h2>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-ink-100"><X size={20} /></button>
        </div>

        <form onSubmit={submit} noValidate className="p-6 space-y-4">
          <p className="text-xs text-ink-500 -mb-1"><span className="text-red-500">*</span> required</p>
          <Row>
            <Input name="name" error={fe.errors.name} label="Name" value={f.name} onChange={(v) => { set('name', v); fe.clear('name'); if (!f._id) set('slug', slugify(v)) }} required />
            <Input label="Slug (URL)" value={f.slug} onChange={(v) => set('slug', v)} />
          </Row>
          <Row>
            <Input label="Brand" value={f.brand} onChange={(v) => set('brand', v)} />
            <div>
              <Label>Category<span className="text-red-500 ml-0.5">*</span></Label>
              <div className="flex gap-2">
                <select data-field="category" value={f.category} onChange={(e) => { set('category', e.target.value); fe.clear('category') }} className={`${inputCls} ${fe.errors.category ? '!border-red-400 ring-2 ring-red-100' : ''}`} required aria-invalid={fe.errors.category ? true : undefined}>
                  <option value="">Select…</option>
                  {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                </select>
                <button type="button" onClick={newCategory} className="btn-ghost whitespace-nowrap !py-2 text-sm border border-[#e5e5e0] rounded-lg px-3">+ New</button>
              </div>
            </div>
          </Row>
          <Input label="Image URL" value={f.images?.[0] || ''} onChange={(v) => set('images', [v])} />
          <Input label="Short description" value={f.short} onChange={(v) => set('short', v)} />
          <div>
            <Label>Full description</Label>
            <textarea value={f.description} onChange={(e) => set('description', e.target.value)} rows={3} className={inputCls} />
          </div>
          <Row>
            <Select label="Life stage" value={f.lifeStage} onChange={(v) => set('lifeStage', v)} options={LIFE} />
            <Select label="Breed size" value={f.breedSize} onChange={(v) => set('breedSize', v)} options={SIZES} />
            <Select label="Food type" value={f.foodType} onChange={(v) => set('foodType', v)} options={TYPES} />
          </Row>
          <Row>
            <Input label="Diet (comma-separated)" value={f.diet} onChange={(v) => set('diet', v)} />
            <Input label="Tags (comma-separated)" value={f.tags} onChange={(v) => set('tags', v)} />
          </Row>

          <div>
            <div className="flex items-center justify-between">
              <Label>Variations</Label>
              <button type="button" onClick={addVariant} className="text-sm font-semibold text-brand-600">+ Add variation</button>
            </div>
            <div className="space-y-2 mt-1">
              {f.variants.map((v, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-end bg-ink-50 rounded-lg p-2">
                  <Mini className="col-span-3" label="SKU *" value={v.sku} onChange={(x) => setVariant(i, 'sku', x)} />
                  <Mini className="col-span-3" label="Size / Weight *" value={v.size} onChange={(x) => setVariant(i, 'size', x)} />
                  <Mini className="col-span-2" label="Price *" type="number" value={v.price} onChange={(x) => setVariant(i, 'price', x)} />
                  <Mini className="col-span-2" label="MRP" type="number" value={v.mrp} onChange={(x) => setVariant(i, 'mrp', x)} />
                  <Mini className="col-span-1" label="Stock" type="number" value={v.stock} onChange={(x) => setVariant(i, 'stock', x)} />
                  <button type="button" onClick={() => delVariant(i)} className="col-span-1 p-2 text-red-500 hover:bg-red-50 rounded-lg justify-self-center"><Trash2 size={15} /></button>
                </div>
              ))}
            </div>
          </div>

          {Object.entries(fe.errors).filter(([k, m]) => m && (k === 'category' || k === 'variants' || /^v\d/.test(k))).map(([k, m]) => (
            <p key={k} data-field={k} role="alert" className="text-sm font-semibold text-red-600 bg-red-50 rounded-lg px-3 py-2">{m}</p>
          ))}
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button disabled={saving} className="btn-primary disabled:opacity-60">{saving ? 'Saving…' : 'Save product'}</button>
            <button type="button" onClick={onCancel} className="btn-ghost border border-[#e5e5e0] rounded-lg px-4">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

const inputCls = 'w-full mt-1 border border-[#e5e5e0] rounded-lg px-3 py-2 outline-none focus:border-brand-400 bg-white'
const Th = ({ children }) => <th className="px-4 py-3 font-semibold whitespace-nowrap">{children}</th>
const Td = ({ children, className = '' }) => <td className={'px-4 py-3 whitespace-nowrap ' + className}>{children}</td>
const Row = ({ children }) => <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">{children}</div>
const Label = ({ children }) => <span className="font-bold text-sm">{children}</span>

function Input({ label, value, onChange, required, type = 'text', name, error }) {
  return (
    <label className="block" data-field={name}>
      <Label>{label}{required && <span className="text-red-500 ml-0.5">*</span>}</Label>
      <input type={type} value={value ?? ''} required={required} aria-invalid={error ? true : undefined} onChange={(e) => onChange(e.target.value)} className={`${inputCls} ${error ? '!border-red-400 ring-2 ring-red-100' : ''}`} />
      {error && <span role="alert" className="block mt-1 text-xs font-semibold text-red-600">{error}</span>}
    </label>
  )
}
function Select({ label, value, onChange, options }) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
        {options.map((o) => <option key={o} value={o} className="capitalize">{o}</option>)}
      </select>
    </label>
  )
}
function Mini({ label, value, onChange, type = 'text', className = '' }) {
  return (
    <label className={'block ' + className}>
      <span className="text-[11px] font-semibold text-ink-500">{label}</span>
      <input type={type} value={value ?? ''} onChange={(e) => onChange(e.target.value)} className="w-full border border-[#e5e5e0] rounded-md px-2 py-1.5 text-sm outline-none focus:border-brand-400" />
    </label>
  )
}
