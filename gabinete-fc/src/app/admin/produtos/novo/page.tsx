import { ProductForm } from '@/components/admin/ProductForm'

export default function NovoProdutoPage() {
  return (
    <div>
      <div className="px-6 py-6 border-b border-border">
        <h1 className="text-xl font-bold uppercase tracking-widest">Novo Produto</h1>
      </div>
      <div className="p-6 max-w-2xl">
        <ProductForm />
      </div>
    </div>
  )
}
