'use client';
import { useState, useMemo, useRef, useCallback } from 'react';
import Image from 'next/image';
import { X, Plus, ImageOff, Tag, Package, BarChart2, Image as ImageIcon, Settings, Wind, Bold, Italic, Underline, List, ListOrdered, Type } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';

// ─── Lightweight Rich Text Editor ──────────────────────────────────────────────
function RichTextEditor({ value, onChange }) {
  const editorRef = useRef(null);
  const isInitialized = useRef(false);

  // Set initial content only once
  const initEditor = useCallback((el) => {
    if (el && !isInitialized.current) {
      editorRef.current = el;
      el.innerHTML = value || '';
      isInitialized.current = true;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const exec = (cmd, val = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    onChange(editorRef.current?.innerHTML || '');
  };

  const handleInput = () => {
    onChange(editorRef.current?.innerHTML || '');
  };

  const ToolBtn = ({ cmd, val, title, children }) => (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); exec(cmd, val); }}
      className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200 text-gray-700 transition text-sm font-medium"
    >
      {children}
    </button>
  );

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-black focus-within:border-black transition">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-gray-50 border-b border-gray-200">
        <ToolBtn cmd="bold" title="Bold"><Bold size={14} /></ToolBtn>
        <ToolBtn cmd="italic" title="Italic"><Italic size={14} /></ToolBtn>
        <ToolBtn cmd="underline" title="Underline"><Underline size={14} /></ToolBtn>
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <ToolBtn cmd="formatBlock" val="h2" title="Heading 2"><span className="text-xs font-bold">H2</span></ToolBtn>
        <ToolBtn cmd="formatBlock" val="h3" title="Heading 3"><span className="text-xs font-bold">H3</span></ToolBtn>
        <ToolBtn cmd="formatBlock" val="p" title="Paragraph"><Type size={13} /></ToolBtn>
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <ToolBtn cmd="insertUnorderedList" title="Bullet List"><List size={14} /></ToolBtn>
        <ToolBtn cmd="insertOrderedList" title="Numbered List"><ListOrdered size={14} /></ToolBtn>
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <select
          className="text-xs border-0 bg-transparent text-gray-600 outline-none cursor-pointer py-1"
          onChange={(e) => { exec('fontSize', e.target.value); e.target.value = ''; }}
          defaultValue=""
        >
          <option value="" disabled>Size</option>
          {[1, 2, 3, 4, 5, 6].map(s => <option key={s} value={s}>{['8', '10', '12', '14', '18', '24'][s - 1]}px</option>)}
        </select>
      </div>

      {/* Editable area */}
      <div
        ref={initEditor}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        className="min-h-[260px] p-4 text-sm text-gray-800 leading-relaxed outline-none prose prose-sm max-w-none"
        style={{ minHeight: 260 }}
        data-placeholder="Write a detailed product description..."
      />
    </div>
  );
}

export default function ProductForm({ initial, onSubmit, onCancel, loading, submitLabel }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    description: initial?.description || '',
    price: initial?.price || '',
    compare_price: initial?.compare_price || '',
    stock: initial?.stock || '',
    category: initial?.category || '',
    is_featured: initial?.is_featured || false,
    is_active: initial?.is_active ?? true,
    meta_title: initial?.meta_title || '',
    meta_description: initial?.meta_description || '',
    sku: initial?.sku || '',
    weight: initial?.weight || '',
    hsn: initial?.hsn_code || initial?.hsn || '',
    gst: initial?.gst_rate || initial?.gst || '18',
    // Fragrance notes
    top_notes: initial?.top_notes || '',
    heart_notes: initial?.heart_notes || '',
    base_notes: initial?.base_notes || '',
    scent_family: initial?.scent_family || '',
    longevity: initial?.longevity || '',
    sillage: initial?.sillage || '',
    season: initial?.season || '',
    occasion: initial?.occasion || '',
  });

  const [variants, setVariants] = useState(
    initial?.variants?.map(v => ({
      id: v.id,
      size: v.value,
      price: v.price_modifier !== undefined && v.price_modifier !== null
        ? (parseFloat(initial.price) + parseFloat(v.price_modifier)).toFixed(2)
        : parseFloat(initial.price).toFixed(2),
      compare_price: v.compare_price || '',
      stock: v.stock
    })) || []
  );

  const [files, setFiles] = useState([]);
  const [existingImages, setExistingImages] = useState(initial?.images || []);
  const [deletedImages, setDeletedImages] = useState([]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const discount = useMemo(() => {
    if (!form.price || !form.compare_price) return 0;
    return Math.round(((form.compare_price - form.price) / form.compare_price) * 100);
  }, [form.price, form.compare_price]);

  const slugPreview = form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (v !== '' && v !== null && v !== undefined) fd.append(k, v);
    });
    
    // Add variants
    if (variants.length > 0) {
      const variantsArr = variants.filter(v => v.size).map(v => ({
        type: 'Size',
        value: v.size,
        price: parseFloat(v.price) || 0,
        compare_price: v.compare_price ? parseFloat(v.compare_price) : null,
        stock: parseInt(v.stock) || 0
      }));
      fd.append('variants', JSON.stringify(variantsArr));
    } else {
      fd.append('variants', '[]');
    }

    // Add deleted images tracking
    if (deletedImages.length > 0) {
      fd.append('deleted_images', JSON.stringify(deletedImages));
    }

    // Add files
    files.forEach((f) => fd.append('images', f));
    
    onSubmit(fd);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[85vh] md:max-h-[85vh]">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 md:space-y-8 bg-gray-50/50">
        
        {/* Basics */}
        <section className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-gray-900 font-semibold">
            <Tag size={18} className="text-gray-400" /> Basics
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Product name *</label>
              <input className="input text-sm" value={form.name} onChange={(e) => set('name', e.target.value)} required />
              {slugPreview && <p className="text-xs text-gray-400 mt-1">/products/{slugPreview}</p>}
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select className="input text-sm" value={form.category} onChange={(e) => set('category', e.target.value)}>
                <option value="">Select category</option>
                {['Men', 'Women', 'Unisex', 'Attar', 'Gift Sets', 'Niche', 'Limited Edition'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <div className="flex justify-between items-end mb-2">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <span className="text-xs text-gray-400">Supports rich formatting</span>
              </div>
              <RichTextEditor
                value={form.description}
                onChange={(val) => set('description', val)}
              />
            </div>
          </div>
        </section>

        {/* Pricing & Inventory */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-gray-900 font-semibold">
              <BarChart2 size={18} className="text-gray-400" /> Pricing
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sale Price (₹) *</label>
                <input type="number" step="0.01" min="0" className="input text-sm font-medium" value={form.price} onChange={(e) => set('price', e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Compare at Price / MRP (₹)</label>
                <div className="flex items-center gap-3">
                  <input type="number" step="0.01" min="0" className="input text-sm flex-1" value={form.compare_price} onChange={(e) => set('compare_price', e.target.value)} />
                  {discount > 0 && <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">{discount}% OFF</span>}
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-gray-900 font-semibold">
              <Package size={18} className="text-gray-400" /> Inventory
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">Base Stock *</label>
                  {form.stock !== '' && form.stock <= 10 && <span className="text-xs text-red-500 font-medium">Low stock</span>}
                </div>
                <input type="number" min="0" className="input text-sm" value={form.stock} onChange={(e) => set('stock', e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU (Optional)</label>
                <input type="text" className="input text-sm" value={form.sku} onChange={(e) => set('sku', e.target.value)} placeholder="e.g. OUD-WD-01" />
              </div>
            </div>
          </section>
        </div>

        {/* Variants */}
        <section className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-gray-900 font-semibold">
              <Settings size={18} className="text-gray-400" /> Variants (Sizes)
            </div>
            <button type="button" onClick={() => setVariants([...variants, { size: '', price: '', compare_price: '', stock: '' }])} className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded">
              <Plus size={14} /> Add Variant
            </button>
          </div>
          
          {variants.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No variants. The product will be sold as a single item.</p>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-3 mb-2 px-1 hidden md:grid">
                <div className="col-span-3 text-xs font-medium text-gray-500 uppercase">Size / Name</div>
                <div className="col-span-3 text-xs font-medium text-gray-500 uppercase">Sale Price (₹)</div>
                <div className="col-span-3 text-xs font-medium text-gray-500 uppercase">Compare Price (₹)</div>
                <div className="col-span-2 text-xs font-medium text-gray-500 uppercase">Stock</div>
                <div className="col-span-1"></div>
              </div>
              {variants.map((v, i) => (
                <div key={i} className="grid grid-cols-12 gap-3 items-center bg-gray-50 p-2 rounded border border-gray-100">
                  <div className="col-span-12 md:col-span-3">
                    <input className="input text-sm bg-white" placeholder="e.g. 50ml" value={v.size} onChange={(e) => {
                      const newV = [...variants]; newV[i] = { ...newV[i], size: e.target.value }; setVariants(newV);
                    }} />
                  </div>
                  <div className="col-span-12 md:col-span-3">
                    <input type="number" step="0.01" className="input text-sm bg-white" placeholder="Sale price" value={v.price} onChange={(e) => {
                      const newV = [...variants]; newV[i] = { ...newV[i], price: e.target.value }; setVariants(newV);
                    }} />
                  </div>
                  <div className="col-span-12 md:col-span-3">
                    <input type="number" step="0.01" className="input text-sm bg-white" placeholder="MRP / Compare price" value={v.compare_price} onChange={(e) => {
                      const newV = [...variants]; newV[i] = { ...newV[i], compare_price: e.target.value }; setVariants(newV);
                    }} />
                  </div>
                  <div className="col-span-10 md:col-span-2">
                    <input type="number" className="input text-sm bg-white" placeholder="Stock" value={v.stock} onChange={(e) => {
                      const newV = [...variants]; newV[i] = { ...newV[i], stock: e.target.value }; setVariants(newV);
                    }} />
                  </div>
                  <div className="col-span-2 md:col-span-1 flex justify-center">
                    <button type="button" onClick={() => setVariants(variants.filter((_, idx) => idx !== i))} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition">
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Fragrance Notes */}
        <section className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-gray-900 font-semibold">
            <Wind size={18} className="text-gray-400" /> Fragrance Notes
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                🟡 Top Notes
              </label>
              <input
                className="input text-sm"
                placeholder="e.g. Bergamot, Pepper, Lemon"
                value={form.top_notes}
                onChange={(e) => set('top_notes', e.target.value)}
              />
              <p className="text-xs text-gray-400 mt-1">Comma-separated</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ❤️ Heart Notes
              </label>
              <input
                className="input text-sm"
                placeholder="e.g. Lavender, Geranium, Rose"
                value={form.heart_notes}
                onChange={(e) => set('heart_notes', e.target.value)}
              />
              <p className="text-xs text-gray-400 mt-1">Comma-separated</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                🟤 Base Notes
              </label>
              <input
                className="input text-sm"
                placeholder="e.g. Amberwood, Musk, Vanilla"
                value={form.base_notes}
                onChange={(e) => set('base_notes', e.target.value)}
              />
              <p className="text-xs text-gray-400 mt-1">Comma-separated</p>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Scent Profile (Optional)</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { key: 'scent_family', label: 'Scent Family', placeholder: 'e.g. Oriental, Woody, Floral' },
                { key: 'longevity', label: 'Longevity', placeholder: 'e.g. 8-10 hours' },
                { key: 'sillage', label: 'Sillage', placeholder: 'e.g. Moderate, Strong' },
                { key: 'season', label: 'Season', placeholder: 'e.g. All Seasons, Winter' },
                { key: 'occasion', label: 'Occasion', placeholder: 'e.g. Evening, Casual' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    className="input text-sm"
                    placeholder={placeholder}
                    value={form[key]}
                    onChange={(e) => set(key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Media */}
        <section className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-gray-900 font-semibold">
            <ImageIcon size={18} className="text-gray-400" /> Media
          </div>
          
          {existingImages.length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Existing Images</p>
              <div className="flex flex-wrap gap-4">
                {existingImages.map((img) => (
                  <div key={img.id} className="relative group rounded-lg border border-gray-200 overflow-hidden bg-gray-50" style={{ width: 100, height: 100 }}>
                    <Image src={img.url} alt="Product" fill style={{ objectFit: 'cover' }} sizes="100px" />
                    {img.is_primary && <div className="absolute top-1 left-1 bg-black text-white text-[9px] px-1.5 py-0.5 rounded font-medium z-10">Primary</div>}
                    {/* Dimensions badge */}
                    {(img.width && img.height) && (
                      <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[8px] px-1 py-0.5 rounded font-mono z-10">
                        {img.width}×{img.height}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center z-10">
                      <button type="button" onClick={() => {
                        setDeletedImages([...deletedImages, img.public_id]);
                        setExistingImages(existingImages.filter(i => i.id !== img.id));
                      }} className="w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-full hover:bg-red-600">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Upload New Images</p>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition relative">
              <input
                type="file" accept="image/*" multiple
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={(e) => setFiles([...files, ...Array.from(e.target.files)])}
              />
              <ImageIcon size={32} className="text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-700 mb-1">Drag files here or click to browse</p>
              <p className="text-xs text-gray-500">PNG, JPG up to 5MB each · Recommended: 800×800px</p>
            </div>
            
            {files.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-3">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 bg-gray-50 pl-3 pr-2 py-1.5 rounded-lg border border-gray-200">
                    <div>
                      <span className="text-xs font-medium text-gray-700 max-w-[120px] truncate block">{f.name}</span>
                      <span className="text-[10px] text-gray-400">{(f.size / 1024).toFixed(0)} KB</span>
                    </div>
                    <button type="button" onClick={() => setFiles(files.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* SEO & Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-gray-900 font-semibold">
              <Tag size={18} className="text-gray-400" /> SEO & Tax (Optional)
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
                <input className="input text-sm" value={form.meta_title} onChange={(e) => set('meta_title', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                <textarea className="input text-sm resize-none" rows={2} value={form.meta_description} onChange={(e) => set('meta_description', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight (g)</label>
                  <input type="number" className="input text-sm" value={form.weight} onChange={(e) => set('weight', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">HSN Code</label>
                  <input type="text" className="input text-sm" value={form.hsn} onChange={(e) => set('hsn', e.target.value)} />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 mb-4 text-gray-900 font-semibold">
              <Settings size={18} className="text-gray-400" /> Status
            </div>
            <div className="space-y-5 flex-1">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center mt-0.5">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} className="peer sr-only" />
                  <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
                  <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-5 shadow-sm"></div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Active</p>
                  <p className="text-xs text-gray-500">Product is visible on the store.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center mt-0.5">
                  <input type="checkbox" checked={form.is_featured} onChange={(e) => set('is_featured', e.target.checked)} className="peer sr-only" />
                  <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-black transition-colors"></div>
                  <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-5 shadow-sm"></div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Featured</p>
                  <p className="text-xs text-gray-500">Show this product on the homepage featured section.</p>
                </div>
              </label>
            </div>
          </section>
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="bg-white border-t border-gray-200 p-3 md:p-4 px-4 md:px-6 flex items-center justify-end gap-3 shrink-0">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary px-6">Cancel</button>
        )}
        <button type="submit" disabled={loading} className="btn-primary px-8">
          {loading ? <Spinner size="sm" /> : submitLabel}
        </button>
      </div>
    </form>
  );
}
