'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Modal, Form, Input, Button, message, Upload } from 'antd';
import { UploadOutlined, CloseOutlined } from '@ant-design/icons';

interface Props {
  onClose: () => void;
  visible: boolean;
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function ReportIssueModal({ onClose, visible }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files && e.target.files[0];
    if (!f) return setFile(null);
    // Limit to 8MB
    if (f.size > 8 * 1024 * 1024) {
      messageApi.error('Screenshot is too large. Max 8 MB.');
      e.currentTarget.value = '';
      return;
    }
    setFile(f);
  }

  function removeFile() {
    setFile(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      if (file) formData.append('screenshot', file);

      const res = await fetch('/api/v1/issues', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        messageApi.error(data?.error || 'Failed to submit issue');
      } else {
        setSuccess(true);
        messageApi.success('Issue reported. Thank you!');
        setTitle('');
        setDescription('');
        setFile(null);
        // Keep the success state visible briefly then close
        setTimeout(() => onClose(), 1200);
      }
    } catch (err: any) {
      messageApi.error(err?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {contextHolder}
      <Modal
        title="Report a Problem"
        visible={visible}
        onCancel={onClose}
        footer={null}
        className="rounded-lg"
        width={600}
      >
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Title *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Short title of the problem"
              className="mt-1 p-3 w-full border rounded-2xl"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Description *</label>
            <Input.TextArea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              required
              placeholder="Describe what happened and where. Add steps to reproduce if possible."
              className="mt-1 p-3 w-full border rounded-2xl"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Screenshot (optional)</label>
            <div className="mt-2 flex flex-col gap-3">
              <label className="inline-flex items-center gap-2 cursor-pointer px-3 py-2 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 w-full">
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <UploadOutlined />
                <span className="text-sm text-gray-700">Attach screenshot</span>
              </label>

              {file && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                  <div className="w-20 h-12 bg-gray-100 rounded overflow-hidden flex items-center justify-center border">
                    {preview ? (
                      <img src={preview} alt="preview" className="object-cover w-full h-full" />
                    ) : (
                      <span className="text-xs text-gray-500">Preview</span>
                    )}
                  </div>
                  <div className="text-sm flex-1">
                    <div className="font-medium truncate">{file.name}</div>
                    <div className="text-xs text-gray-500">{formatBytes(file.size)}</div>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <CloseOutlined />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <Button
              onClick={onClose}
              className="flex-1 px-5 py-3 text-primary rounded-xl font-semibold border hover:border-primary border-primary bg-white h-auto"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="flex-1 px-5 py-3 bg-primary hover:bg-primary text-white rounded-xl font-semibold border border-primary h-auto"
            >
              Submit Report
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}