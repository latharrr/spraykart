'use client';
import { useState } from 'react';
import { adminGetTestimonials, adminCreateTestimonial, adminUpdateTestimonial, adminDeleteTestimonial } from '@/lib/api';
import { useFetch } from '@/lib/hooks/useFetch';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, X, Eye, EyeOff, Star } from 'lucide-react';
import { fetchWithCsrf } from '@/lib/csrf';

async function apiTestimonials() {
  const res = await fetch('/api/admin/testimonials', { credentials: 'include', cache: 'no-store' });
  const jsonData = await res.json();
  if (!res.ok) throw jsonData.error || 'Failed to load testimonials';
  return { data: jsonData };
}

async function apiCreate(data) {
  const res = await fetchWithCsrf('/api/admin/testimonials', { method: 'POST', body: JSON.stringify(data), credentials: 'include', cache: 'no-store', headers: { 'Content-Type': 'application/json' } });
  const result = await res.json();
  if (!res.ok) throw result.error || 'Failed to create';
  return result;
}

async function apiUpdate(id, data) {
  const res = await fetchWithCsrf(`/api/admin/testimonials/${id}`, { method: 'PATCH', body: JSON.stringify(data), credentials: 'include', cache: 'no-store', headers: { 'Content-Type': 'application/json' } });
  const result = await res.json();
  if (!res.ok) throw result.error || 'Failed to update';
  return result;
}

async function apiDelete(id) {
  const res = await fetchWithCsrf(`/api/admin/testimonials/${id}`, { method: 'DELETE', credentials: 'include', cache: 'no-store' });
  if (!res.ok) { const d = await res.json(); throw d.error || 'Failed to delete'; }
}

function TestimonialForm({ initial = null, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || '');
  const [location, setLocation] = useState(initial?.location || '');
  const [rating, setRating] = useState(initial?.rating || 5);
  const [review, setReview] = useState(initial?.review || '');
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [sortOrder, setSortOrder] = useState(initial?.sort_order ?? 0);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !review.trim()) { toast.error('Name and review are required'); return; }
    setSaving(true);
    try {
      const data = { name: name.trim(), location: location.trim() || null, rating, review: review.trim(), is_active: isActive, sort_order: sortOrder };
      if (initial?.id) {
        await apiUpdate(initial.id, data);
        toast.success('Testimonial updated');
      } else {
        await apiCreate(data);
        toast.success('Testimonial created');
      }
      onSave();
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 8 }}>
          Name *
        </label>
        <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Customer name" required />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 8 }}>
          Location
        </label>
        <input className="input" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Mumbai, Delhi" />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 8 }}>
          Rating *
        </label>
        <select className="input" value={rating} onChange={e => setRating(parseInt(e.target.value))} required>
          {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} ⭐ {'⭐'.repeat(r)}</option>)}
        </select>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 8 }}>
          Review *
        </label>
        <textarea className="input" value={review} onChange={e => setReview(e.target.value)} placeholder="Customer testimonial..." rows={4} required />
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 120 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 8 }}>
            Sort Order
          </label>
          <input type="number" className="input" value={sortOrder} onChange={e => setSortOrder(parseInt(e.target.value) || 0)} min={0} />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
            <div onClick={() => setIsActive(v => !v)} style={{ width: 40, height: 22, borderRadius: 11, background: isActive ? '#0c0c0c' : '#e5e7eb', position: 'relative', cursor: 'pointer', transition: 'background .2s' }}>
              <div style={{ position: 'absolute', top: 3, left: isActive ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
            </div>
            <span style={{ color: isActive ? '#0c0c0c' : '#9ca3af' }}>{isActive ? 'Active' : 'Hidden'}</span>
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid #f3f4f6' }}>
        <button type="button" onClick={onCancel} className="btn-secondary text-sm py-2">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary text-sm py-2" style={{ minWidth: 100 }}>
          {saving ? 'Saving...' : initial?.id ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}

export default function AdminTestimonialsPage() {
  const { data, loading, error, refetch } = useFetch(apiTestimonials);
  const testimonials = data?.testimonials || [];
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const handleDelete = async (t) => {
    if (!confirm(`Delete testimonial from ${t.name}?`)) return;
    setDeleting(t.id);
    try {
      await apiDelete(t.id);
      toast.success('Deleted');
      refetch();
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  const handleSaved = () => {
    setShowForm(false);
    setEditing(null);
    refetch();
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;
  if (error) return <div style={{ padding: 40, textAlign: 'center', color: '#dc2626' }}>Error: {error}</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Testimonials</h1>
          <p style={{ fontSize: 14, color: '#6b7280' }}>Manage customer testimonials for homepage</p>
        </div>
        {!showForm && <button onClick={() => setShowForm(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={18} /> Add Testimonial
        </button>}
      </div>

      {showForm && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 24, marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
            {editing?.id ? 'Edit Testimonial' : 'New Testimonial'}
          </h2>
          <TestimonialForm initial={editing} onSave={handleSaved} onCancel={() => { setShowForm(false); setEditing(null); }} />
        </div>
      )}

      {testimonials.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
          <p>No testimonials yet</p>
          <button onClick={() => setShowForm(true)} className="btn-primary" style={{ marginTop: 16 }}>
            Add your first testimonial
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {testimonials.map(t => (
            <div key={t.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{t.name}</span>
                  {t.location && <span style={{ fontSize: 12, color: '#9ca3af' }}>📍 {t.location}</span>}
                  <div style={{ display: 'flex', gap: 2 }}>
                    {[...Array(t.rating)].map((_, i) => <Star key={i} size={14} fill="#fbbf24" stroke="#fbbf24" />)}
                  </div>
                  {!t.is_active && <span style={{ fontSize: 11, background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: 4 }}>Hidden</span>}
                </div>
                <p style={{ fontSize: 14, color: '#555', lineHeight: 1.6 }}>{t.review}</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setEditing(t); setShowForm(true); }} className="btn-secondary" style={{ padding: '6px 12px' }}>
                  <Pencil size={16} />
                </button>
                <button onClick={() => handleDelete(t)} disabled={deleting === t.id} className="btn-secondary" style={{ padding: '6px 12px', background: deleting === t.id ? '#fca5a5' : undefined }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
