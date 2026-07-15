"use client";

import React, { useState, useEffect } from 'react';

interface Campaign {
    campaign_id: number;
    title: string;
    body: string;
    deep_link: string | null;
    image_url: string | null;
    recipient_count: number;
    sent_count: number;
    push_success_count: number;
    status: 'processing' | 'sent' | 'failed' | 'partial';
    error_message: string | null;
    sent_by_name: string;
    sent_by_email: string;
    created_at: string;
    completed_at: string | null;
}

const STATUS_STYLES: Record<string, string> = {
    sent: 'bg-green-100 text-green-700',
    partial: 'bg-amber-100 text-amber-700',
    processing: 'bg-blue-100 text-blue-700',
    failed: 'bg-red-100 text-red-700',
};

export default function AdminNotificationsPage() {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [deepLink, setDeepLink] = useState('');
    const [imageUrl, setImageUrl] = useState('');

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [history, setHistory] = useState<Campaign[]>([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchHistory = async () => {
        setHistoryLoading(true);
        try {
            const res = await fetch(`/api/v1/admin/notifications?page=${page}&limit=20`);
            if (!res.ok) throw new Error('Failed to load');
            const data = await res.json();
            setHistory(data.rows);
            setTotalPages(data.meta.totalPages);
        } catch (err) {
            console.error('Error loading broadcast history:', err);
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [page]);

    const handleOpenConfirm = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        if (!title.trim() || !body.trim()) {
            setError('Title and message are required.');
            return;
        }
        setConfirmOpen(true);
    };

    const handleSend = async () => {
        setSending(true);
        setError('');
        try {
            const res = await fetch('/api/v1/admin/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title.trim(),
                    body: body.trim(),
                    deepLink: deepLink.trim() || undefined,
                    imageUrl: imageUrl.trim() || undefined,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to send broadcast');
            }

            setSuccessMessage(`Sent to ${data.sent_count} of ${data.recipient_count} users (status: ${data.status}).`);
            setTitle('');
            setBody('');
            setDeepLink('');
            setImageUrl('');
            setConfirmOpen(false);
            setPage(1);
            fetchHistory();
        } catch (err: any) {
            setError(err.message || 'An error occurred');
            setConfirmOpen(false);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="pb-12">
            {/* Header */}
            <div className="mb-8">
                <h2 className="text-2xl font-extrabold text-[#065758] tracking-tight">Push Notifications</h2>
                <p className="text-gray-500 text-sm mt-1">Send a custom push notification to all app users</p>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 border border-red-100 text-sm font-medium p-3 rounded-xl mb-4">
                    {error}
                </div>
            )}
            {successMessage && (
                <div className="bg-green-50 text-green-700 border border-green-100 text-sm font-medium p-3 rounded-xl mb-4">
                    {successMessage}
                </div>
            )}

            {/* Compose Form */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 shadow-sm">
                <form onSubmit={handleOpenConfirm} className="space-y-4">
                    <div>
                        <label className="block text-gray-600 font-semibold text-xs uppercase mb-1">Title *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            maxLength={255}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:border-[#065758] outline-none transition"
                            placeholder="e.g. New feature: Lost & Found matching"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-600 font-semibold text-xs uppercase mb-1">Message *</label>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            rows={3}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:border-[#065758] outline-none transition resize-none"
                            placeholder="What do you want to tell your users?"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-600 font-semibold text-xs uppercase mb-1">Deep Link (optional)</label>
                            <input
                                type="text"
                                value={deepLink}
                                onChange={(e) => setDeepLink(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:border-[#065758] outline-none transition"
                                placeholder="paltuu://home"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-600 font-semibold text-xs uppercase mb-1">Image URL (optional)</label>
                            <input
                                type="text"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:border-[#065758] outline-none transition"
                                placeholder="https://..."
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="bg-[#065758] hover:bg-[#043b3c] text-white font-semibold py-2.5 px-5 rounded-xl shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition duration-200"
                    >
                        Review &amp; Send
                    </button>
                </form>
            </div>

            {/* Recent Broadcasts */}
            <h3 className="text-lg font-bold text-gray-800 mb-3">Recent Broadcasts</h3>
            {historyLoading ? (
                <div className="text-center py-12 text-gray-500 font-medium animate-pulse">Loading broadcasts...</div>
            ) : history.length === 0 ? (
                <div className="text-center py-12 bg-white border border-gray-200 rounded-2xl text-gray-400">
                    No broadcasts sent yet.
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/75 border-b border-gray-200 text-gray-500 font-semibold text-xs tracking-wider uppercase">
                                    <th className="p-4">Message</th>
                                    <th className="p-4">Recipients</th>
                                    <th className="p-4">Sent</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Sent By</th>
                                    <th className="p-4">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {history.map((c) => (
                                    <tr key={c.campaign_id} className="hover:bg-gray-50/50 transition">
                                        <td className="p-4 max-w-xs">
                                            <div className="font-semibold text-gray-800">{c.title}</div>
                                            <div className="text-gray-500 text-xs truncate">{c.body}</div>
                                        </td>
                                        <td className="p-4 font-semibold text-gray-800">{c.recipient_count}</td>
                                        <td className="p-4 text-gray-500">{c.sent_count}</td>
                                        <td className="p-4">
                                            <span className={`inline-block px-2.5 py-1 rounded-full font-bold text-xs ${STATUS_STYLES[c.status] || 'bg-gray-100 text-gray-700'}`}>
                                                {c.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-500">{c.sent_by_name}</td>
                                        <td className="p-4 text-gray-500">{new Date(c.created_at).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {totalPages > 1 && (
                        <div className="flex justify-between items-center p-4 border-t border-gray-100 text-sm">
                            <button
                                disabled={page <= 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                            >
                                Previous
                            </button>
                            <span className="text-gray-500">Page {page} of {totalPages}</span>
                            <button
                                disabled={page >= totalPages}
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Confirm Send Modal */}
            {confirmOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md p-6 relative shadow-xl">
                        <button
                            onClick={() => !sending && setConfirmOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-medium text-xl"
                        >
                            ×
                        </button>

                        <h3 className="text-xl font-bold text-gray-800 mb-4">Confirm Broadcast</h3>

                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
                            <div className="font-semibold text-gray-800">{title}</div>
                            <div className="text-gray-600 text-sm mt-1">{body}</div>
                        </div>

                        <p className="text-sm text-gray-600 mb-6">
                            This will send a push notification to <strong>all app users</strong> right now. This action cannot be undone.
                        </p>

                        <button
                            onClick={handleSend}
                            disabled={sending}
                            className={`w-full py-3 bg-[#065758] hover:bg-[#043b3c] text-white font-semibold rounded-xl shadow-sm transition ${sending ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {sending ? 'Sending...' : 'Yes, send to all users'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
