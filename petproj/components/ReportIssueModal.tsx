'use client';
import React, { useEffect, useRef, useState } from 'react';

interface Props {
  onClose: () => void;
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function ReportIssueModal({ onClose }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files && e.target.files[0];
    if (!f) return setFile(null);
    // Limit to 8MB
    if (f.size > 8 * 1024 * 1024) {
      setMessage('Screenshot is too large. Max 8 MB.');
      e.currentTarget.value = '';
      return;
    }
    setMessage(null);
    setFile(f);
  }

  function removeFile() {
    setFile(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      if (file) formData.append('screenshot', file);

      const res = await fetch('/api/issues', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data?.error || 'Failed to submit issue');
      } else {
        setSuccess(true);
        setMessage('Issue reported. Thank you!');
        setTitle('');
        setDescription('');
        setFile(null);
        // Keep the success state visible briefly then close
        setTimeout(() => onClose(), 1200);
      }
    } catch (err: any) {
      setMessage(err?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Report a problem dialog"
    >
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 bg-primary text-white">
          <h2 className="text-lg font-semibold">Report a problem?</h2>
          <button
            aria-label="Close"
            onClick={onClose}
            className="text-white/90 hover:text-white"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Short title of the problem"
              title="Issue title"
              className="mt-2 block w-full border border-gray-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Describe what happened and where. Add steps to reproduce if possible."
              title="Issue description"
              className="mt-2 block w-full border border-gray-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Screenshot (optional)</label>
            <div className="mt-2 flex items-center gap-3">
              <label className="inline-flex items-center gap-2 cursor-pointer px-3 py-2 bg-white border border-gray-200 rounded hover:bg-gray-50">
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  title="Screenshot upload"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <span className="text-sm text-gray-700">Attach screenshot</span>
              </label>

              {file && (
                <div className="flex items-center gap-3">
                  <div className="w-20 h-12 bg-gray-100 rounded overflow-hidden flex items-center justify-center border">
                    {preview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={preview} alt="preview" className="object-cover w-full h-full" />
                    ) : (
                      <span className="text-xs text-gray-500">Preview</span>
                    )}
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">{file.name}</div>
                    <div className="text-xs text-gray-500">{formatBytes(file.size)}</div>
                  </div>
                  <button type="button" onClick={removeFile} className="ml-2 text-sm text-red-600 underline">
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>

          {message && (
            <div className={`text-sm ${success ? 'text-green-600' : 'text-red-600'} text-center`}>{message}</div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 rounded bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary text-white rounded disabled:opacity-60"
            >
              {loading ? 'Submitting…' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
