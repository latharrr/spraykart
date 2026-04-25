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

import ProductForm from '@/components/admin/ProductForm';

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
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Add Product" size="xl">
        <div className="bg-gray-50 -mx-6 -mb-6">
          <ProductForm 
            onSubmit={handleCreate} 
            onCancel={() => setCreateOpen(false)}
            loading={formLoading} 
            submitLabel="Create Product" 
          />
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal isOpen={!!editProduct} onClose={() => setEditProduct(null)} title="Edit Product" size="xl">
        {editProduct && (
          <div className="bg-gray-50 -mx-6 -mb-6">
            <ProductForm
              initial={editProduct}
              onSubmit={handleUpdate}
              onCancel={() => setEditProduct(null)}
              loading={formLoading}
              submitLabel="Save Changes"
            />
          </div>
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
