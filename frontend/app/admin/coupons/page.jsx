'use client';
import { useState } from 'react';
import { adminGetCoupons, adminCreateCoupon, adminDeleteCoupon, adminUpdateCoupon, adminGetProducts } from '@/lib/api';
import { useFetch } from '@/lib/hooks/useFetch';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import ErrorState from '@/components/ui/ErrorState';
import EmptyState from '@/components/ui/EmptyState';
import { Plus, Trash2, ToggleLeft, ToggleRight, Package } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  code: '', type: 'percentage', value: '', min_order: '',
  max_uses: '100', expiry_date: '', applicable_products: [], free_shipping: false,
};

export default function AdminCouponsPage() {
  const { data: coupons, loading, error, refetch } = useFetch(adminGetCoupons);
  const { data: productsData } = useFetch(adminGetProducts);
  const products = productsData?.products || productsData || [];

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const toggleProduct = (id) =>
    set('applicable_products',
      form.applicable_products.includes(id)
        ? form.applicable_products.filter((p) => p !== id)
        : [...form.applicable_products, id]
    );

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await adminCreateCoupon({
        code: form.code.toUpperCase(),
        type: form.type,
        value: parseFloat(form.value),
        min_order: parseFloat(form.min_order || 0),
        max_uses: parseInt(form.max_uses || 100),
        expiry_date: form.expiry_date ? new Date(form.expiry_date).toISOString() : null,
        is_active: true,
        free_shipping: form.free_shipping,
        applicable_products: form.applicable_products,
      });
      toast.success('Coupon created');
      setCreateOpen(false);
      setForm(EMPTY_FORM);
      refetch();
    } catch (err) {
      toast.error(err?.error || 'Failed to create coupon');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this coupon?')) return;
    setDeletingId(id);
    try {
      await adminDeleteCoupon(id);
      toast.success('Coupon deleted');
      refetch();
    } catch (err) {
      toast.error(err?.error || 'Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggle = async (coupon) => {
    setTogglingId(coupon.id);
    try {
      await adminUpdateCoupon(coupon.id, { is_active: !coupon.is_active });
      toast.success(`Coupon ${coupon.is_active ? 'deactivated' : 'activated'}`);
      refetch();
    } catch (err) {
      toast.error(err?.error || 'Failed to update');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Coupons</h1>
        <button onClick={() => setCreateOpen(true)} className="btn-primary text-sm gap-2">
          <Plus size={16} /> Create Coupon
        </button>
      </div>

      {loading ? (
        <div className="card p-6 animate-pulse space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-12 skeleton rounded-lg" />)}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : !coupons?.length ? (
        <EmptyState icon="tag" title="No coupons yet" description="Create your first coupon to offer discounts" actionLabel="Create coupon" onAction={() => setCreateOpen(true)} />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="table-th">Code</th>
                  <th className="table-th">Type</th>
                  <th className="table-th">Value</th>
                  <th className="table-th">Min Order</th>
                  <th className="table-th">Used / Max</th>
                  <th className="table-th">Applies To</th>
                  <th className="table-th">Expiry</th>
                  <th className="table-th">Status</th>
                  <th className="table-th"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition">
                    <td className="table-td font-mono font-semibold text-sm">{c.code}</td>
                    <td className="table-td capitalize text-gray-500">{c.type}</td>
                    <td className="table-td font-medium">
                      {c.type === 'percentage' ? `${c.value}%` : `₹${parseFloat(c.value).toLocaleString('en-IN')}`}
                      {c.free_shipping && <span className="block text-xs text-green-600 font-semibold mt-0.5">+ Free Shipping</span>}
                    </td>
                    <td className="table-td text-gray-500">
                      {parseFloat(c.min_order) > 0 ? `₹${parseFloat(c.min_order).toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="table-td text-gray-500">{c.used_count} / {c.max_uses}</td>
                    <td className="table-td">
                      {c.applicable_products?.length > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-1 rounded-full">
                          <Package size={10} />
                          {c.applicable_products.length} product{c.applicable_products.length > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">All products</span>
                      )}
                    </td>
                    <td className="table-td text-gray-500">
                      {c.expiry_date ? new Date(c.expiry_date).toLocaleDateString('en-IN') : 'No expiry'}
                    </td>
                    <td className="table-td">
                      <Badge variant={c.is_active ? 'active' : 'inactive'}>{c.is_active ? 'Active' : 'Inactive'}</Badge>
                    </td>
                    <td className="table-td">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleToggle(c)} disabled={togglingId === c.id} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition">
                          {togglingId === c.id ? <Spinner size="sm" /> : c.is_active ? <ToggleRight size={16} className="text-green-500" /> : <ToggleLeft size={16} />}
                        </button>
                        <button onClick={() => handleDelete(c.id)} disabled={deletingId === c.id} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition">
                          {deletingId === c.id ? <Spinner size="sm" /> : <Trash2 size={14} />}
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

      {/* Create Coupon Modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create Coupon">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
            <input className="input text-sm uppercase" placeholder="SAVE10" value={form.code} onChange={(e) => set('code', e.target.value.toUpperCase())} required maxLength={50} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <select className="input text-sm" value={form.type} onChange={(e) => set('type', e.target.value)}>
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat (₹)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Value *</label>
              <input type="number" step="0.01" min="0" className="input text-sm" placeholder={form.type === 'percentage' ? '10' : '100'} value={form.value} onChange={(e) => set('value', e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min order (₹)</label>
              <input type="number" min="0" className="input text-sm" placeholder="0" value={form.min_order} onChange={(e) => set('min_order', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max uses</label>
              <input type="number" min="1" className="input text-sm" value={form.max_uses} onChange={(e) => set('max_uses', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry date</label>
            <input type="date" className="input text-sm" value={form.expiry_date} onChange={(e) => set('expiry_date', e.target.value)} />
          </div>

          <div>
            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition">
              <input 
                type="checkbox" 
                className="w-4 h-4 text-black rounded border-gray-300 focus:ring-black"
                checked={form.free_shipping} 
                onChange={(e) => set('free_shipping', e.target.checked)} 
              />
              <span className="text-sm font-medium text-gray-800">Include Free Shipping</span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-1">If value is 0, this will act as a free-shipping-only coupon.</p>
          </div>

          {/* Product restriction */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Applicable products
              <span className="ml-2 text-xs font-normal text-gray-400">(leave empty = all products)</span>
            </label>
            {products.length > 0 ? (
              <div className="border border-gray-200 rounded-lg max-h-44 overflow-y-auto divide-y divide-gray-50">
                {products.map((p) => (
                  <label key={p.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 transition">
                    <input
                      type="checkbox"
                      checked={form.applicable_products.includes(p.id)}
                      onChange={() => toggleProduct(p.id)}
                      className="rounded border-gray-300 text-black focus:ring-black"
                    />
                    <span className="text-sm text-gray-700 flex-1 truncate">{p.name}</span>
                    <span className="text-xs text-gray-400">₹{parseFloat(p.price).toLocaleString('en-IN')}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 py-2">Loading products...</p>
            )}
            {form.applicable_products.length > 0 && (
              <p className="text-xs text-indigo-600 mt-1 font-medium">
                ✓ Restricted to {form.applicable_products.length} product{form.applicable_products.length > 1 ? 's' : ''}
              </p>
            )}
          </div>

          <button type="submit" disabled={formLoading} className="btn-primary w-full py-3">
            {formLoading ? <Spinner size="sm" /> : 'Create Coupon'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
