import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { 
    Building2, 
    Briefcase, 
    Globe2, 
    AlertCircle, 
    ArrowRight, 
    FileText, 
    MapPin,
    Building
} from 'lucide-react';
import { tenantApi } from '../api/tenantApi';

const Onboarding = () => {
    const { user, completeOnboarding } = useAuthStore();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
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
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Basic validation
        if (!formData.organizationName || !formData.country || !formData.address.line1 || !formData.address.city || !formData.address.state || !formData.address.postal_code) {
            setError('Please fill in all required fields (Organization, Country, and Address)');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await tenantApi.onboardTenant({
                organizationName: formData.organizationName,
                industry: formData.industry,
                country: formData.country,
                consentFlow: formData.consentFlow,
                cin: formData.cin,
                gst: formData.gst,
                address: {
                    ...formData.address,
                    country: formData.country // Use the selected country for address as well
                }
            });

            const tenantId = response.tenant?.id || response.tenant_id;
            const clientId = response.client?.id || response.client_id;
            const fullToken = response.token;

            completeOnboarding(fullToken, tenantId, clientId, {
                organizationName: formData.organizationName,
                industry: formData.industry,
                country: formData.country
            });

            navigate('/dashboard');

        } catch (err: any) {
            console.error('Onboarding failed:', err);
            setError(err?.response?.data?.message || err?.response?.data?.error || 'An error occurred setting up your tenant. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-2xl text-center">
                <div className="inline-flex items-center justify-center p-3 bg-indigo-100 rounded-2xl text-indigo-600 mb-6">
                    <Building2 className="w-8 h-8" />
                </div>
                <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">
                    Setup your Organization
                </h2>
                <p className="mt-3 text-lg text-slate-600">
                    Welcome, <span className="text-indigo-600 font-bold">{user?.name}</span>. Let's get your secure environment ready.
                </p>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-2xl">
                <div className="bg-white py-10 px-8 shadow-xl shadow-slate-200/50 border border-slate-200 sm:rounded-3xl">
                    <form className="space-y-8" onSubmit={handleSubmit}>

                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start animate-in fade-in slide-in-from-top-2">
                                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                                <p className="text-sm font-bold text-red-700">{error}</p>
                            </div>
                        )}

                        {/* Section 1: Basic Information */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                <Building className="w-4 h-4 text-indigo-500" />
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Basic Information</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label htmlFor="organizationName" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Organization Name *</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <Building2 className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g., Acme Corp"
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                            value={formData.organizationName}
                                            onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label htmlFor="industry" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Industry</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <Briefcase className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="e.g., Technology"
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                            value={formData.industry}
                                            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="country" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Country *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Globe2 className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <select
                                        id="country"
                                        required
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none"
                                        value={formData.country}
                                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                    >
                                        <option value="" disabled>Select Organization Location</option>
                                        <option value="IN">India</option>
                                        <option value="US">United States</option>
                                        <option value="UK">United Kingdom</option>
                                        <option value="CA">Canada</option>
                                        <option value="AU">Australia</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="consent_flow" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Consent Flow *</label>
                                <div className="relative">
                                    <select
                                        id="consent_flow"
                                        className="w-full pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none"
                                        value={formData.consentFlow}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                consentFlow: e.target.value as 'embedded' | 'redirect',
                                            })
                                        }
                                    >
                                        <option value="embedded">Embedded</option>
                                        <option value="redirect">Redirect</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Legal Information (Conditional/Optional) */}
                        <div className="space-y-6 pt-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                <FileText className="w-4 h-4 text-indigo-500" />
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Legal Information</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label htmlFor="cin" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">CIN (India Only)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., L12345MH2020PLC123456"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all uppercase"
                                        value={formData.cin}
                                        onChange={(e) => setFormData({ ...formData, cin: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label htmlFor="gst" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">GSTIN</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., 22AAAAA0000A1Z5"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all uppercase"
                                        value={formData.gst}
                                        onChange={(e) => setFormData({ ...formData, gst: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Business Address */}
                        <div className="space-y-6 pt-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                <MapPin className="w-4 h-4 text-indigo-500" />
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Business Address</h3>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label htmlFor="line1" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Street Address *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Flat, House no., Building, Company, Apartment"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        value={formData.address.line1}
                                        onChange={(e) => setFormData({ ...formData, address: { ...formData.address, line1: e.target.value } })}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label htmlFor="city" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">City *</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                            value={formData.address.city}
                                            onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label htmlFor="state" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">State / Province *</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                            value={formData.address.state}
                                            onChange={(e) => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label htmlFor="postal_code" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Zip / Postal Code *</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        value={formData.address.postal_code}
                                        onChange={(e) => setFormData({ ...formData, address: { ...formData.address, postal_code: e.target.value } })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full flex items-center justify-center py-4 px-4 border border-transparent rounded-2xl shadow-lg shadow-indigo-100 text-sm font-bold text-white transition-all active:scale-[0.98] ${loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/30'
                                    }`}
                            >
                                {loading ? (
                                    <>
                                        <Building2 className="w-4 h-4 mr-2 animate-pulse" />
                                        Creating Workspace...
                                    </>
                                ) : (
                                    <>
                                        Complete Onboarding
                                        <ArrowRight className="ml-2 w-4 h-4" />
                                    </>
                                )}
                            </button>
                            <p className="mt-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                                Secure CMS - DPDP Compliant Data Management
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
