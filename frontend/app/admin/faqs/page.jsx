'use client';
import { useState, useRef } from 'react';
import { useFetch } from '@/lib/hooks/useFetch';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { Plus, Pencil, Trash2, X, GripVertical, Eye, EyeOff, ImagePlus, Check } from 'lucide-react';

// ── API helpers ───────────────────────────────────────────────────────────────
async function apiFaqs() {
  const res = await fetch('/api/admin/faqs', { credentials: 'include' });
  const data = await res.json();
  if (!res.ok) throw data.error || 'Failed to load FAQs';
  return data;
}

async function apiCreate(formData) {
  const res = await fetch('/api/admin/faqs', { method: 'POST', body: formData, credentials: 'include' });
  const data = await res.json();
  if (!res.ok) throw data.error || 'Failed to create FAQ';
  return data;
}

async function apiUpdate(id, formData) {
  const res = await fetch(`/api/admin/faqs/${id}`, { method: 'PATCH', body: formData, credentials: 'include' });
  const data = await res.json();
  if (!res.ok) throw data.error || 'Failed to update FAQ';
  return data;
}

async function apiDelete(id) {
  const res = await fetch(`/api/admin/faqs/${id}`, { method: 'DELETE', credentials: 'include' });
  if (!res.ok) { const d = await res.json(); throw d.error || 'Failed to delete'; }
}

// ── FAQ Form (add / edit) ─────────────────────────────────────────────────────
function FAQForm({ initial = null, onSave, onCancel }) {
  const [question, setQuestion] = useState(initial?.question || '');
  const [answer, setAnswer] = useState(initial?.answer || '');
  const [sortOrder, setSortOrder] = useState(initial?.sort_order ?? 0);
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(initial?.image_url || null);
  const [removeImage, setRemoveImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5 MB'); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setRemoveImage(false);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(true);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) { toast.error('Question and answer are required'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('question', question.trim());
      fd.append('answer', answer.trim());
      fd.append('sort_order', String(sortOrder));
      fd.append('is_active', String(isActive));
      if (imageFile) fd.append('image', imageFile);
      if (removeImage) fd.append('remove_image', 'true');

      if (initial?.id) {
        await apiUpdate(initial.id, fd);
        toast.success('FAQ updated');
      } else {
        await apiCreate(fd);
        toast.success('FAQ created');
      }
      onSave();
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to save FAQ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Question */}
      <div>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 8 }}>
          Question *
        </label>
        <input
          className="input"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder="e.g. Are your products 100% authentic?"
          required
        />
      </div>

      {/* Answer */}
      <div>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 8 }}>
          Answer *
        </label>
        <textarea
          className="input"
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          placeholder="Write a helpful answer..."
          rows={4}
          required
          style={{ resize: 'vertical', lineHeight: 1.6 }}
        />
      </div>

      {/* Image upload */}
      <div>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 8 }}>
          Image (optional)
        </label>
        {imagePreview ? (
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img
              src={imagePreview}
              alt="Preview"
              style={{ width: 200, height: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb' }}
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              style={{
                position: 'absolute', top: -8, right: -8,
                width: 24, height: 24, borderRadius: '50%',
                background: '#ef4444', color: '#fff', border: 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              padding: '20px 32px',
              border: '2px dashed #e5e7eb', borderRadius: 8,
              background: '#f9fafb', cursor: 'pointer', color: '#9ca3af',
              fontSize: 13, transition: 'border-color .15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#d1d5db'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}
          >
            <ImagePlus size={20} />
            Click to upload image (max 5 MB)
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          style={{ display: 'none' }}
        />
      </div>

      {/* Sort order + Active toggle */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 120 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 8 }}>
            Sort Order
          </label>
          <input
            type="number"
            className="input"
            value={sortOrder}
            onChange={e => setSortOrder(parseInt(e.target.value) || 0)}
            min={0}
            style={{ maxWidth: 100 }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
            <div
              onClick={() => setIsActive(v => !v)}
              style={{
                width: 40, height: 22, borderRadius: 11,
                background: isActive ? '#0c0c0c' : '#e5e7eb',
                position: 'relative', cursor: 'pointer', transition: 'background .2s',
              }}
            >
              <div style={{
                position: 'absolute', top: 3, left: isActive ? 21 : 3,
                width: 16, height: 16, borderRadius: '50%', background: '#fff',
                transition: 'left .2s',
              }} />
            </div>
            <span style={{ color: isActive ? '#0c0c0c' : '#9ca3af' }}>
              {isActive ? 'Active (visible on site)' : 'Hidden'}
            </span>
          </label>
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid #f3f4f6' }}>
        <button type="button" onClick={onCancel} className="btn-secondary text-sm py-2">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary text-sm py-2" style={{ minWidth: 100 }}>
          {saving ? 'Saving...' : initial?.id ? 'Save Changes' : 'Create FAQ'}
        </button>
      </div>
    </form>
  );
}

// ── Main admin FAQ page ───────────────────────────────────────────────────────
export default function AdminFAQsPage() {
  const { data, loading, error, refetch } = useFetch(apiFaqs);
  const faqs = data?.faqs || [];

  const [showForm, setShowForm] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (faq) => {
    if (!confirm(`Delete FAQ: "${faq.question}"?`)) return;
    setDeletingId(faq.id);
    try {
      await apiDelete(faq.id);
      toast.success('FAQ deleted');
      refetch();
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaved = () => {
    setShowForm(false);
    setEditingFaq(null);
    refetch();
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a' }}>FAQs</h1>
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
            Manage questions and answers shown on the public FAQ page
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <a
            href="/faq"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-sm py-2"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Eye size={13} /> Preview FAQ Page
          </a>
          <button
            onClick={() => { setEditingFaq(null); setShowForm(true); }}
            className="btn-primary text-sm py-2"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={13} /> Add FAQ
          </button>
        </div>
      </div>

      {/* Add form */}
      {showForm && !editingFaq && (
        <div style={{
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
          padding: 24, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, color: '#1a1a1a' }}>New FAQ</h2>
          <FAQForm onSave={handleSaved} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {/* FAQ List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ height: 80, background: '#f9fafb', borderRadius: 12, border: '1px solid #e5e7eb', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : error ? (
        <div style={{ padding: 32, textAlign: 'center', color: '#ef4444' }}>{error}</div>
      ) : faqs.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center', color: '#9ca3af', border: '2px dashed #e5e7eb', borderRadius: 12 }}>
          <p style={{ fontSize: 14, marginBottom: 12 }}>No FAQs yet</p>
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm py-2">
            <Plus size={13} style={{ display: 'inline', marginRight: 6 }} />Add your first FAQ
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {faqs.map((faq, idx) => (
            <div key={faq.id}>
              {/* FAQ card or edit form */}
              {editingFaq?.id === faq.id ? (
                <div style={{
                  background: '#fff', border: '2px solid #0c0c0c', borderRadius: 12,
                  padding: 24, boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                }}>
                  <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 20 }}>Edit FAQ</h2>
                  <FAQForm
                    initial={faq}
                    onSave={handleSaved}
                    onCancel={() => setEditingFaq(null)}
                  />
                </div>
              ) : (
                <div style={{
                  background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
                  padding: '16px 20px',
                  opacity: faq.is_active ? 1 : 0.55,
                  transition: 'box-shadow .15s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    {/* Drag handle + sort indicator */}
                    <div style={{ color: '#d1d5db', marginTop: 2, flexShrink: 0 }}>
                      <GripVertical size={16} />
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#9ca3af' }}>
                          #{idx + 1}
                        </span>
                        {!faq.is_active && (
                          <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: '#f3f4f6', color: '#9ca3af', fontWeight: 600 }}>
                            Hidden
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 6, lineHeight: 1.4 }}>
                        {faq.question}
                      </p>
                      <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {faq.answer}
                      </p>
                      {faq.image_url && (
                        <div style={{ marginTop: 10 }}>
                          <img
                            src={faq.image_url}
                            alt="FAQ"
                            style={{ height: 60, borderRadius: 6, border: '1px solid #e5e7eb', objectFit: 'cover' }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button
                        onClick={() => setEditingFaq(faq)}
                        style={{
                          width: 32, height: 32, borderRadius: 8,
                          border: '1px solid #e5e7eb', background: '#fff',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#4b5563',
                        }}
                        title="Edit"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(faq)}
                        disabled={deletingId === faq.id}
                        style={{
                          width: 32, height: 32, borderRadius: 8,
                          border: '1px solid #fee2e2', background: '#fff',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#ef4444',
                        }}
                        title="Delete"
                      >
                        {deletingId === faq.id ? '...' : <Trash2 size={13} />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: 12, color: '#d1d5db', marginTop: 20, textAlign: 'center' }}>
        {faqs.length} FAQ{faqs.length !== 1 && 's'} total · {faqs.filter(f => f.is_active).length} active
      </p>
    </div>
  );
}
