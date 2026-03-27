import { useState, useEffect } from 'react';
import {
    Plus,
    Key,
    RotateCw,
    Trash2,
    Calendar,
    Shield,
    AlertCircle,
    Copy,
    CheckCircle2,
    Loader2
} from 'lucide-react';
import { tenantApi, ApiKey as ApiKeyData } from '../api/tenantApi';
import toast from 'react-hot-toast';

const APIKeys = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [copiedNewKey, setCopiedNewKey] = useState(false);
    const [apiKeys, setApiKeys] = useState<ApiKeyData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newKeyData, setNewKeyData] = useState({ name: '' });
    const [createdKey, setCreatedKey] = useState<string | null>(null);

    const fetchKeys = async () => {
        setIsLoading(true);
        try {
            const keys = await tenantApi.listApiKeys();
            setApiKeys(keys);
        } catch (error) {
            console.error("Failed to fetch API keys:", error);
            toast.error("Failed to load API keys.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchKeys();
    }, []);

    const handleCreateKey = async () => {
        setIsCreating(true);
        try {
            const created = await tenantApi.createApiKey({
                name: newKeyData.name || undefined
            });
            setCreatedKey(created.key || null);
            toast.success("API Key created. Copy it now; it will not be shown again.");
            setIsModalOpen(false);
            setNewKeyData({ name: '' });
            fetchKeys();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to create API key.");
        } finally {
            setIsCreating(false);
        }
    };

    const handleRevokeKey = async (id: string) => {
        if (!window.confirm("Are you sure you want to revoke this API key? This action cannot be undone.")) return;

        try {
            await tenantApi.revokeApiKey(id);
            toast.success("API Key revoked successfully.");
            setApiKeys(prev => prev.filter(k => k.id !== id));
        } catch (error: any) {
            console.error("Failed to revoke API key:", error);
            toast.error(error?.response?.data?.message || "Failed to revoke API key.");
        }
    };

    const handleCopy = (key: ApiKeyData) => {
        if (!key.key) {
            toast.error("Full key is not available for existing keys. Create/rotate a key to copy full value once.");
            return;
        }
        navigator.clipboard.writeText(key.key);
        setCopiedId(key.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleCopyCreatedKey = () => {
        if (!createdKey) return;
        navigator.clipboard.writeText(createdKey);
        setCopiedNewKey(true);
        setTimeout(() => setCopiedNewKey(false), 2000);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">API Keys</h2>
                    <p className="text-slate-500 font-medium text-sm">Manage cryptographic keys used for API authentication.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-sm shadow-indigo-200 transition-all active:scale-95"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Register API Key
                </button>
            </div>

            {/* Security Notice */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-start space-x-3">
                <Shield className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-bold text-indigo-900">Key Management Best Practice</p>
                    <p className="text-xs text-indigo-700 font-medium leading-relaxed">Regularly rotating your API keys enhances security by limiting the lifespan of a potentially compromised key. We recommend rotating production keys every 90 days.</p>
                </div>
            </div>

            {createdKey && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2">
                    <p className="text-sm font-bold text-emerald-900">New API Key (shown once)</p>
                    <div className="flex items-center gap-2">
                        <code className="flex-1 text-xs font-mono bg-white border border-emerald-200 rounded-lg px-3 py-2 text-emerald-800 break-all">
                            {createdKey}
                        </code>
                        <button
                            onClick={handleCopyCreatedKey}
                            className="px-3 py-2 text-xs font-bold rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                        >
                            {copiedNewKey ? 'Copied' : 'Copy'}
                        </button>
                    </div>
                </div>
            )}

            {/* API Keys Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Key Name</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">API Key</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Created Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Expiry Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                                        Loading API Keys...
                                    </td>
                                </tr>
                            ) : apiKeys.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">
                                        No API Keys registered yet.
                                    </td>
                                </tr>
                            ) : (
                                apiKeys.map((key) => (
                                    <tr key={key.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                                                    <Key className="w-4 h-4 text-slate-500 group-hover:text-indigo-600" />
                                                </div>
                                                <span className="text-sm font-bold text-slate-900">{key.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <code className="text-xs font-mono font-bold text-slate-500">{key.keyMasked || '...'}</code>
                                                <button
                                                    onClick={() => handleCopy(key)}
                                                    className="text-slate-300 hover:text-indigo-600 transition-colors"
                                                    title={key.key ? 'Copy full key' : 'Full key unavailable for old keys'}
                                                >
                                                    {copiedId === key.id ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-slate-700">{key.createdDate}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center text-slate-400 text-xs font-bold">
                                                <Calendar className="w-3.5 h-3.5 mr-2" />
                                                {key.expiryDate}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${key.status === 'Active'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                : 'bg-red-50 text-red-700 border-red-100'
                                                }`}>
                                                {key.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button className="flex items-center px-3 py-1.5 text-[10px] font-bold text-indigo-600 border border-indigo-100 rounded-lg hover:bg-indigo-50 transition-all">
                                                    <RotateCw className="w-3 h-3 mr-1.5" />
                                                    Rotate
                                                </button>
                                                <button
                                                    onClick={() => handleRevokeKey(key.id)}
                                                    className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Register Modal Mock */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsModalOpen(false)}></div>
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="text-xl font-bold text-slate-900">Register API Key</h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-all">
                                <Plus className="w-5 h-5 rotate-45" />
                            </button>
                        </div>
                        <div className="p-8 space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Key Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Production Mobile App"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                    value={newKeyData.name}
                                    onChange={(e) => setNewKeyData(prev => ({ ...prev, name: e.target.value }))}
                                />
                            </div>
                            <div className="bg-indigo-50/50 rounded-xl p-3 flex items-start space-x-2">
                                <AlertCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                                <p className="text-[10px] text-indigo-700 font-medium">Only a key name is required. Plain API key is shown once after creation.</p>
                            </div>
                        </div>
                        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">Cancel</button>
                            <button
                                onClick={handleCreateKey}
                                disabled={isCreating}
                                className={`px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 ${isCreating ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {isCreating ? 'Registering...' : 'Register Key'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default APIKeys;
