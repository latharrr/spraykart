'use client';
import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { fetchWithCsrf } from '@/lib/csrf';

export default function AdminImportPage() {
  const [file,     setFile]     = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState(null);
  const [error,    setError]    = useState('');
  const inputRef = useRef();

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    setError('');

    try {
      const fd = new FormData();
      fd.append('csv', file);

      const res  = await fetchWithCsrf('/api/admin/import', { method: 'POST', body: fd, credentials: 'include' });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Import failed');
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Import Products</h1>
        <p className="text-gray-500 text-sm mt-1">
          Upload a Shopify CSV export to import products
        </p>
      </div>

      {/* Upload Box */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files[0];
          if (f?.name.endsWith('.csv')) setFile(f);
        }}
        className="card p-10 text-center cursor-pointer border-2 border-dashed hover:border-black transition"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <Upload size={32} className="mx-auto text-gray-300 mb-3" />
        {file ? (
          <div className="flex items-center justify-center gap-2 text-sm font-medium text-gray-800">
            <FileText size={16} />
            {file.name}
            <span className="text-gray-400">
              ({(file.size / 1024).toFixed(0)} KB)
            </span>
          </div>
        ) : (
          <>
            <p className="text-sm font-medium text-gray-700">
              Drop your Shopify CSV here or click to browse
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Export from Shopify → Products → Export → CSV for Excel
            </p>
          </>
        )}
      </div>

      {/* Import Button */}
      {file && !loading && !result && (
        <button
          onClick={handleUpload}
          className="btn-primary w-full mt-4 py-3"
        >
          Start Import
        </button>
      )}

      {/* Loading */}
      {loading && (
        <div className="card p-8 mt-4 text-center">
          <div className="w-10 h-10 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-medium">Importing products...</p>
          <p className="text-sm text-gray-500 mt-1">
            Uploading images to Cloudinary. This may take a few minutes.
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Do not close this tab.
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card p-5 mt-4 border-red-200 bg-red-50 flex gap-3">
          <XCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">Import failed</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="card p-6 mt-4">
          <div className="flex items-center gap-2 mb-6">
            <CheckCircle size={20} className="text-green-500" />
            <h2 className="font-semibold text-gray-900">Import Complete</h2>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-green-700">{result.inserted}</p>
              <p className="text-xs text-green-600 mt-1">Imported</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-gray-700">{result.skipped}</p>
              <p className="text-xs text-gray-500 mt-1">Skipped</p>
            </div>
            <div className="bg-red-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-red-700">{result.failed}</p>
              <p className="text-xs text-red-500 mt-1">Failed</p>
            </div>
          </div>

          {result.errors?.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <AlertCircle size={14} /> Errors
              </p>
              <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto space-y-1">
                {result.errors.map((e, i) => (
                  <p key={i} className="text-xs text-red-600">{e}</p>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <a href="/admin/products" className="btn-primary flex-1 text-center">
              View Products
            </a>
            <button
              onClick={() => { setResult(null); setFile(null); }}
              className="btn-secondary flex-1"
            >
              Import Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
