import { useEffect, useState } from 'react';
import {
    Building2,
    Globe,
    FileText,
    MapPin,
    Edit2,
    Save,
    X,
    Loader2
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { tenantApi, Tenant as TenantData } from '../api/tenantApi';
import toast from 'react-hot-toast';

const Tenant = () => {
    const { tenantId, tenantMetadata } = useAuthStore();
    const [tenantData, setTenantData] = useState<TenantData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [editForm, setEditForm] = useState({
        organizationName: '',
        industry: '',
        country: '',
        consentFlow: 'embedded' as 'embedded' | 'redirect',
        cin: '',
        gst: '',
        address: {
            line1: '',
            city: '',
            state: '',
            postal_code: '',
            country: ''
        }
    });

    const fetchTenant = async () => {
        try {
            setIsLoading(true);
            const data = await tenantApi.getCurrentTenant();
            setTenantData(data);
            setEditForm({
                organizationName: data.organizationName,
                industry: data.industry || '',
                country: data.country || '',
                consentFlow: data.consentFlow || 'embedded',
                cin: data.legal_info?.cin || '',
                gst: data.legal_info?.gst || '',
                address: {
                    line1: data.address?.line1 || '',
                    city: data.address?.city || '',
                    state: data.address?.state || '',
                    postal_code: data.address?.postal_code || '',
                    country: data.address?.country || data.country || ''
                }
            });
        } catch (err) {
            console.error("Failed to fetch tenant details:", err);
            toast.error("Failed to load profile");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTenant();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsSaving(true);
            await tenantApi.updateTenant(editForm);
            toast.success("Profile updated successfully");
            setIsEditing(false);
            fetchTenant();
        } catch (err: any) {
            console.error("Update failed:", err);
            toast.error(err?.response?.data?.message || err?.response?.data?.error || "Failed to update profile");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                <p className="text-slate-500 font-bold">Loading profile...</p>
            </div>
        );
    }

    const orgName = tenantData?.organizationName || tenantMetadata?.organizationName || 'Not Set';
    const industry = tenantData?.industry || tenantMetadata?.industry || 'Not Set';
    const country = tenantData?.country || tenantMetadata?.country || 'Not Set';
    const consentFlow = tenantData?.consentFlow || 'embedded';
    const createdAt = tenantData?.createdAt ? new Date(tenantData.createdAt).toLocaleDateString() : 'Unknown';

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 capitalize">Tenant Profile</h2>
                    <p className="text-slate-500 font-medium text-sm">Manage your organization's legal identity and contact information.</p>
                </div>
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="inline-flex items-center justify-center px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-all active:scale-95 space-x-2"
                    >
                        <Edit2 className="w-4 h-4 text-indigo-500" />
                        <span>Edit Profile</span>
                    </button>
                )}
            </div>

            <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Information Column */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* Organization Info */}
                    <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
                        <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <h3 className="font-bold text-slate-900 flex items-center text-sm uppercase tracking-wider">
                                <Building2 className="w-4 h-4 mr-2.5 text-indigo-500" />
                                Organization Information
                            </h3>
                        </div>
                        <div className="p-8">
                            {isEditing ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Organization Name</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                            value={editForm.organizationName}
                                            onChange={(e) => setEditForm({...editForm, organizationName: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Industry</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                            value={editForm.industry}
                                            onChange={(e) => setEditForm({...editForm, industry: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-1.5 md:col-span-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Consent Flow</label>
                                        <select
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                            value={editForm.consentFlow}
                                            onChange={(e) => setEditForm({ ...editForm, consentFlow: e.target.value as 'embedded' | 'redirect' })}
                                        >
                                            <option value="embedded">Embedded</option>
                                            <option value="redirect">Redirect</option>
                                        </select>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Organization Name</label>
                                        <p className="text-sm font-bold text-slate-700">{orgName}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Industry</label>
                                        <p className="text-sm font-bold text-slate-700">{industry}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Country</label>
                                        <p className="text-sm font-bold text-slate-700">{country}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Created On</label>
                                        <p className="text-sm font-bold text-slate-700">{createdAt}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Consent Flow</label>
                                        <p className="text-sm font-bold text-slate-700 capitalize">{consentFlow}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Legal Info */}
                    <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
                        <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <h3 className="font-bold text-slate-900 flex items-center text-sm uppercase tracking-wider">
                                <FileText className="w-4 h-4 mr-2.5 text-indigo-500" />
                                Legal Information
                            </h3>
                        </div>
                        <div className="p-8">
                            {isEditing ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">CIN (India)</label>
                                        <input
                                            type="text"
                                            placeholder="L12345..."
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none uppercase"
                                            value={editForm.cin}
                                            onChange={(e) => setEditForm({...editForm, cin: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">GSTIN</label>
                                        <input
                                            type="text"
                                            placeholder="22AAAAA..."
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none uppercase"
                                            value={editForm.gst}
                                            onChange={(e) => setEditForm({...editForm, gst: e.target.value})}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">CIN</label>
                                        <p className="text-sm font-bold text-slate-700 font-mono tracking-tight">{tenantData?.legal_info?.cin || 'Not Provided'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">GSTIN</label>
                                        <p className="text-sm font-bold text-slate-700 font-mono tracking-tight">{tenantData?.legal_info?.gst || 'Not Provided'}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Address Section */}
                    <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
                        <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <h3 className="font-bold text-slate-900 flex items-center text-sm uppercase tracking-wider">
                                <MapPin className="w-4 h-4 mr-2.5 text-indigo-500" />
                                Business Address
                            </h3>
                        </div>
                        <div className="p-8">
                            {isEditing ? (
                                <div className="space-y-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Street Address</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                            value={editForm.address.line1}
                                            onChange={(e) => setEditForm({...editForm, address: {...editForm.address, line1: e.target.value}})}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">City</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                                value={editForm.address.city}
                                                onChange={(e) => setEditForm({...editForm, address: {...editForm.address, city: e.target.value}})}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">State</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                                value={editForm.address.state}
                                                onChange={(e) => setEditForm({...editForm, address: {...editForm.address, state: e.target.value}})}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 w-1/2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Postal Code</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                            value={editForm.address.postal_code}
                                            onChange={(e) => setEditForm({...editForm, address: {...editForm.address, postal_code: e.target.value}})}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Address</label>
                                    <div className="text-sm font-bold text-slate-700 leading-relaxed max-w-sm">
                                        {tenantData?.address?.line1 ? (
                                            <>
                                                {tenantData.address.line1}<br />
                                                {tenantData.address.city}, {tenantData.address.state} {tenantData.address.postal_code}<br />
                                                {tenantData.address.country}
                                            </>
                                        ) : 'No address specified'}
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-8">
                    {/* Unique Identifier */}
                    <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl shadow-indigo-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-white/10 rounded-xl">
                                <Globe className="w-5 h-5 text-indigo-400" />
                            </div>
                            <h3 className="font-bold text-sm uppercase tracking-widest text-slate-400">Workspace Identity</h3>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Tenant Primary ID</label>
                                <div className="flex items-center gap-2 p-3 bg-white/5 rounded-2xl border border-white/10">
                                    <code className="text-sm font-mono font-bold text-indigo-300 flex-1 truncate">{tenantId}</code>
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            navigator.clipboard.writeText(tenantId || '');
                                            toast.success("ID copied to clipboard");
                                        }}
                                        className="text-[10px] font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-tight"
                                    >
                                        Copy
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form Controls */}
                    {isEditing && (
                        <div className="sticky top-8 space-y-4 animate-in slide-in-from-right-4 duration-500">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full inline-flex items-center justify-center px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-2xl shadow-lg shadow-indigo-200 transition-all active:scale-95 space-x-2 disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4" />}
                                <span>Save Changes</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="w-full inline-flex items-center justify-center px-6 py-4 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 text-sm font-bold rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95 space-x-2"
                            >
                                <X className="w-4 h-4" />
                                <span>Cancel</span>
                            </button>
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
};

export default Tenant;
