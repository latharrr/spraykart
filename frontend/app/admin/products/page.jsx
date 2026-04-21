'use client';
import { useState } from 'react';
import Image from 'next/image';
import { adminGetProducts, adminDeleteProduct, adminCreateProduct, adminUpdateProduct } from '@/lib/api';
import { useFetch } from '@/lib/hooks/useFetch';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import ErrorState from '@/components/ui/ErrorState';
import EmptyState from '@/components/ui/EmptyState';
import { Plus, Pencil, Trash2, ImageOff } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  name: '', description: '', price: '', compare_price: '',
  stock: '', category: '', is_featured: 'false', meta_title: '', meta_description: '',
};

function ProductForm({ initial = EMPTY_FORM, onSubmit, loading, submitLabel }) {
  const [form, setForm] = useState(initial);
  const [files, setFiles] = useState([]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => v !== '' && fd.append(k, v));
    files.forEach((f) => fd.append('images', f));
    onSubmit(fd);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Product name *</label>
          <input className="input text-sm" value={form.name} onChange={(e) => set('name', e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
          <input type="number" step="0.01" min="0" className="input text-sm" value={form.price} onChange={(e) => set('price', e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Compare price (₹)</label>
          <input type="number" step="0.01" min="0" className="input text-sm" value={form.compare_price} onChange={(e) => set('compare_price', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
          <input type="number" min="0" className="input text-sm" value={form.stock} onChange={(e) => set('stock', e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select className="input text-sm" value={form.category} onChange={(e) => set('category', e.target.value)}>
            <option value="">Select category</option>
            {['Men', 'Women', 'Unisex', 'Attar', 'Gift Sets', 'Niche', 'Limited Edition'].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea className="input text-sm resize-none" rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} />
        </div>
        <div className="col-span-2 flex items-center gap-3">
          <input type="checkbox" id="is_featured" checked={form.is_featured === 'true'} onChange={(e) => set('is_featured', e.target.checked ? 'true' : 'false')} className="w-4 h-4 rounded" />
          <label htmlFor="is_featured" className="text-sm font-medium text-gray-700">Featured product</label>
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Images</label>
          <input
            type="file"
            accept="image/*"
            multiple
            className="text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
            onChange={(e) => setFiles(Array.from(e.target.files))}
          />
          {files.length > 0 && <p className="text-xs text-gray-400 mt-1">{files.length} file(s) selected</p>}
        </div>
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full py-3">
        {loading ? <Spinner size="sm" /> : submitLabel}
      </button>
    </form>
  );
}

export default function AdminProductsPage() {
  const { data: products, loading, error, refetch } = useFetch(adminGetProducts);
  const [createOpen, setCreateOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleCreate = async (fd) => {
    setFormLoading(true);
    try {
      await adminCreateProduct(fd);
      toast.success('Product created');
      setCreateOpen(false);
      refetch();
    } catch (err) {
      toast.error(err?.error || 'Failed to create product');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (fd) => {
    setFormLoading(true);
    try {
      await adminUpdateProduct(editProduct.id, fd);
      toast.success('Product updated');
      setEditProduct(null);
      refetch();
    } catch (err) {
      toast.error(err?.error || 'Failed to update product');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await adminDeleteProduct(deleteTarget.id);
      toast.success('Product deleted');
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      toast.error(err?.error || 'Failed to delete product');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Products</h1>
        <button onClick={() => setCreateOpen(true)} className="btn-primary text-sm gap-2">
          <Plus size={16} /> Add Product
        </button>
      </div>

      {loading ? (
        <div className="card overflow-hidden">
          <div className="divide-y divide-gray-50">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
                <div className="w-12 h-12 skeleton rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 skeleton rounded w-1/3" />
                  <div className="h-3 skeleton rounded w-1/5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : !products?.length ? (
        <EmptyState icon="package" title="No products yet" description="Add your first product to get started" actionLabel="Add product" onAction={() => setCreateOpen(true)} />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="table-th">Product</th>
                  <th className="table-th">Price</th>
                  <th className="table-th">Stock</th>
                  <th className="table-th">Category</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Sales</th>
                  <th className="table-th"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition">
                    <td className="table-td">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                          {p.image ? (
                            <Image src={p.image} alt={p.name} width={40} height={40} className="object-cover w-full h-full" />
                          ) : (
                            <ImageOff size={14} className="text-gray-300" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{p.name}</p>
                          {p.is_featured && <Badge variant="featured" className="text-[10px] mt-0.5">Featured</Badge>}
                        </div>
                      </div>
                    </td>
                    <td className="table-td font-medium">₹{parseFloat(p.price).toLocaleString('en-IN')}</td>
                    <td className="table-td">
                      <span className={p.stock === 0 ? 'text-red-500 font-medium' : p.stock <= 10 ? 'text-yellow-600 font-medium' : 'text-gray-700'}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="table-td text-gray-500">{p.category || '—'}</td>
                    <td className="table-td">
                      <Badge variant={p.is_active ? 'active' : 'inactive'}>{p.is_active ? 'Active' : 'Hidden'}</Badge>
                    </td>
                    <td className="table-td text-gray-500">{p.units_sold || 0} sold</td>
                    <td className="table-td">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setEditProduct(p)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 hover:text-black transition">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleteTarget(p)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Add Product" size="lg">
        <ProductForm onSubmit={handleCreate} loading={formLoading} submitLabel="Create Product" />
      </Modal>

      {/* Edit modal */}
      <Modal isOpen={!!editProduct} onClose={() => setEditProduct(null)} title="Edit Product" size="lg">
        {editProduct && (
          <ProductForm
            initial={{ name: editProduct.name, description: editProduct.description || '', price: editProduct.price, compare_price: editProduct.compare_price || '', stock: editProduct.stock, category: editProduct.category || '', is_featured: editProduct.is_featured ? 'true' : 'false', meta_title: editProduct.meta_title || '', meta_description: editProduct.meta_description || '' }}
            onSubmit={handleUpdate}
            loading={formLoading}
            submitLabel="Save Changes"
          />
        )}
      </Modal>

      {/* Delete confirmation modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Product">
        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This will also remove all images. This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleDelete} disabled={deleting} className="btn-danger flex-1">
            {deleting ? <Spinner size="sm" /> : 'Delete'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
