import React, { useEffect, useState } from 'react';
import { webhookApi, Webhook } from '../api/webhookApi';
import {
    Trash2,
    Plus,
    Loader2,
    Link as LinkIcon,
    Globe,
    X,
    Activity,
    CheckCircle2,
    Clock,
    Info
} from 'lucide-react';
import toast from 'react-hot-toast';

const EVENT_OPTIONS = [
    { id: 'consent.granted', label: 'consent.granted' },
    { id: 'consent.withdrawn', label: 'consent.withdrawn' },
    { id: 'policy.updated', label: 'policy.updated' },
    { id: 'purpose.created', label: 'purpose.created' },
    { id: 'dsr.completed', label: 'dsr.completed' },
];

export default function Webhooks() {
    const [webhooks, setWebhooks] = useState<Webhook[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    // Form fields
    const [url, setUrl] = useState('');
    const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

    useEffect(() => {
        fetchWebhooks();
    }, []);

    const fetchWebhooks = async () => {
        try {
            setLoading(true);
            const data = await webhookApi.getWebhooks();
            setWebhooks(data);
        } catch (error) {
            toast.error('Failed to fetch webhooks');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateWebhook = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url) {
            toast.error('Webhook URL is required');
            return;
        }
        if (selectedEvents.length === 0) {
            toast.error('At least one event is required');
            return;
        }

        try {
            setIsCreating(true);
            await webhookApi.createWebhook({ url, events: selectedEvents });
            toast.success('Webhook created successfully');
            setShowCreateModal(false);
            setUrl('');
            setSelectedEvents([]);
            fetchWebhooks();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to create webhook');
        } finally {
            setIsCreating(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this webhook?')) return;

        try {
            await webhookApi.deleteWebhook(id);
            toast.success('Webhook deleted successfully');
            setWebhooks(webhooks.filter(w => w.id !== id));
            if (selectedWebhook?.id === id) setSelectedWebhook(null);
        } catch (error) {
            toast.error('Failed to delete webhook');
        }
    };

    const toggleEvent = (eventId: string) => {
        setSelectedEvents(prev =>
            prev.includes(eventId)
                ? prev.filter(id => id !== eventId)
                : [...prev, eventId]
        );
    };

    const getStatusBadge = (active: boolean) => {
        if (active) {
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Active
            </span>;
        }
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-50 text-slate-500 border border-slate-100">
            <X className="w-3 h-3 mr-1" /> Inactive
        </span>;
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Webhooks</h2>
                    <p className="text-slate-500 font-medium text-sm">Manage webhook endpoints for real-time event notifications.</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-95"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Webhook
                </button>
            </div>

            {/* List Section */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Webhook ID</th>
                                <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">URL</th>
                                <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Events</th>
                                <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Created At</th>
                                <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center text-slate-500">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-600" />
                                        <p className="font-bold uppercase tracking-widest text-[10px]">Syncing endpoints...</p>
                                    </td>
                                </tr>
                            ) : webhooks.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center text-slate-500">
                                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                            <Globe className="w-8 h-8 text-slate-300" />
                                        </div>
                                        <p className="font-bold text-slate-900">No webhooks configured</p>
                                        <p className="text-sm text-slate-500 mt-1">No webhooks configured for this tenant.</p>
                                    </td>
                                </tr>
                            ) : (
                                webhooks.map((webhook) => (
                                    <tr key={webhook.id} className="hover:bg-slate-50/50 transition-all group">
                                        <td className="px-8 py-6">
                                            <span className="text-xs font-mono font-bold text-slate-400">#{webhook.id.substring(0, 8)}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 mr-3 shrink-0">
                                                    <Activity className="w-4 h-4" />
                                                </div>
                                                <span className="text-sm font-bold text-slate-900 truncate max-w-xs">{webhook.url}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-wrap gap-1.5">
                                                {webhook.events.slice(0, 2).map(ev => (
                                                    <span key={ev} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase">
                                                        {ev.split('.')[1]}
                                                    </span>
                                                ))}
                                                {webhook.events.length > 2 && (
                                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-400 border border-slate-200">
                                                        +{webhook.events.length - 2}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            {getStatusBadge(webhook.active)}
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap">
                                            <span className="text-sm font-medium text-slate-500">
                                                {webhook.created_at ? new Date(webhook.created_at).toLocaleDateString() : 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => setSelectedWebhook(webhook)}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                                >
                                                    <Info className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(webhook.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Webhook Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200/50 animate-in zoom-in-95 duration-300">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Create Webhook</h3>
                                <p className="text-xs font-medium text-slate-500">Register a new endpoint for event delivery</p>
                            </div>
                            <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-white rounded-2xl text-slate-400 hover:text-slate-600 transition-all border border-transparent hover:border-slate-100">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateWebhook} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Webhook URL</label>
                                <div className="relative">
                                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="url"
                                        required
                                        placeholder="https://your-api.com/webhooks"
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Select Events</label>
                                <div className="grid grid-cols-1 gap-3">
                                    {EVENT_OPTIONS.map(event => (
                                        <label
                                            key={event.id}
                                            className={`flex items-center p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                                                selectedEvents.includes(event.id)
                                                    ? 'bg-indigo-50 border-indigo-600'
                                                    : 'bg-slate-50 border-slate-100 hover:border-slate-200'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={selectedEvents.includes(event.id)}
                                                onChange={() => toggleEvent(event.id)}
                                            />
                                            <div className={`w-5 h-5 rounded-md border-2 mr-4 flex items-center justify-center transition-all ${
                                                selectedEvents.includes(event.id)
                                                    ? 'bg-indigo-600 border-indigo-600'
                                                    : 'bg-white border-slate-300'
                                            }`}>
                                                {selectedEvents.includes(event.id) && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                            </div>
                                            <span className={`text-sm font-bold ${selectedEvents.includes(event.id) ? 'text-indigo-900' : 'text-slate-600'}`}>
                                                {event.label}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-2xl transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-2xl shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50 inline-flex items-center justify-center"
                                >
                                    {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Endpoint'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Details Drawer */}
            {selectedWebhook && (
                <div className="fixed inset-0 z-[60] flex justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-md h-full shadow-2xl border-l border-slate-100 flex flex-col animate-in slide-in-from-right duration-500">
                        <div className="px-8 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Webhook Details</h3>
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mt-1">ID: #{selectedWebhook.id.substring(0, 12)}</p>
                            </div>
                            <button onClick={() => setSelectedWebhook(null)} className="p-2 hover:bg-white rounded-2xl text-slate-400 hover:text-slate-600 transition-all border border-transparent hover:border-slate-100">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-8">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Status</label>
                                <div>{getStatusBadge(selectedWebhook.active)}</div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Endpoint URL</label>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 font-mono text-xs break-all text-slate-600 font-bold leading-relaxed">
                                    {selectedWebhook.url}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Subscribed Events</label>
                                <div className="flex flex-wrap gap-2">
                                    {selectedWebhook.events.map((ev: string) => (
                                        <span key={ev} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold border border-indigo-100">
                                            {ev}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Created Date</label>
                                <div className="flex items-center text-sm font-bold text-slate-600">
                                    <Clock className="w-4 h-4 mr-2 text-slate-400" />
                                    {selectedWebhook.created_at ? new Date(selectedWebhook.created_at).toLocaleString() : 'N/A'}
                                </div>
                            </div>
                        </div>

                        <div className="p-8 border-t border-slate-100 bg-slate-50/30">
                            <button
                                onClick={() => handleDelete(selectedWebhook.id)}
                                className="w-full py-4 bg-white hover:bg-red-50 text-red-600 text-sm font-bold rounded-2xl border border-red-100 transition-all flex items-center justify-center"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Webhook Endpoint
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
