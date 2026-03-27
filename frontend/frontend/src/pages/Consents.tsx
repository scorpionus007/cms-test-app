import React, { useEffect, useState } from 'react';
import {
    Search,
    RotateCcw,
    ShieldCheck,
    X,
    Clock,
    ChevronRight,
    Calendar,
    FileText,
    History,
    Plus,
    Loader2,
    ShieldAlert,
    User
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useAppStore } from '../store/appStore';
import { consentApi } from '../api/consentApi';
import { purposeApi, Purpose } from '../api/purposeApi';
import { policyApi, PolicyVersion } from '../api/policyApi';
import toast from 'react-hot-toast';

interface ConsentRecord {
    id: string;
    userId: string;
    purposeId: string;
    purposeName: string;
    policyVersion: string;
    currentStatus: 'granted' | 'withdrawn';
    updatedAt: string;
}

const Consents = () => {
    const { selectedAppId } = useAppStore();
    const { } = useAuthStore();
    const [consents, setConsents] = useState<ConsentRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedConsent, setSelectedConsent] = useState<ConsentRecord | null>(null);
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All Statuses');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [purposes, setPurposes] = useState<Purpose[]>([]);
    const [policies, setPolicies] = useState<PolicyVersion[]>([]);
    const [isCreating, setIsCreating] = useState(false);

    // Create form state
    const [newConsentEmail, setNewConsentEmail] = useState('');
    const [newConsentPhone, setNewConsentPhone] = useState('');
    const [newConsentPurposeId, setNewConsentPurposeId] = useState('');
    const [newConsentPolicyId, setNewConsentPolicyId] = useState('');
    const [identityHash, setIdentityHash] = useState('');

    // OTP Flow state
    const [isOtpStep, setIsOtpStep] = useState(false);
    const [manualSessionId, setManualSessionId] = useState('');
    const [otpSentTo, setOtpSentTo] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [devOtp, setDevOtp] = useState('');

    useEffect(() => {
        if (selectedAppId) {
            fetchConsents();
            fetchLookupData();
        }
    }, [selectedAppId]);

    const fetchLookupData = async () => {
        if (!selectedAppId) return;
        try {
            const [pData, vData] = await Promise.all([
                purposeApi.getPurposes(),
                policyApi.getPolicyVersions(selectedAppId)
            ]);
            setPurposes(pData);
            setPolicies(vData);
        } catch (error) {
            console.error('Failed to fetch lookups:', error);
        }
    };

    const fetchConsents = async () => {
        if (!selectedAppId) return;
        try {
            setLoading(true);
            const data = await consentApi.getAllConsents(selectedAppId);
            setConsents(data);
        } catch (error) {
            toast.error('Failed to fetch consents');
        } finally {
            setLoading(false);
        }
    };



    const handleOpenCreateModal = () => {
        const activePolicies = policies.filter(v => v.isActive);
        if (activePolicies.length > 0 && !newConsentPolicyId) {
            setNewConsentPolicyId(activePolicies[0].id);
        }
        setShowCreateModal(true);
    };

    // Helper to generate a simple SHA-256 hash preview
    const generateHashPreview = async (email: string, phone: string) => {
        if (!email && !phone) {
            setIdentityHash('');
            return;
        }

        try {
            const msgBuffer = new TextEncoder().encode(`${email.trim().toLowerCase()}${phone.trim()}`);
            const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            setIdentityHash(hashHex);
        } catch (e) {
            console.error('Hash generation failed:', e);
        }
    };

    const truncateHash = (hash: string) => {
        if (!hash) return '';
        return hash.length > 12 ? `${hash.substring(0, 6)}...${hash.substring(hash.length - 6)}` : hash;
    };

    useEffect(() => {
        generateHashPreview(newConsentEmail, newConsentPhone);
    }, [newConsentEmail, newConsentPhone]);

    const handleRecordConsent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newConsentEmail && !newConsentPhone) {
            toast.error('Please provide at least Email or Phone Number');
            return;
        }
        if (!newConsentPurposeId || !newConsentPolicyId) {
            toast.error('Please select a Purpose and Policy');
            return;
        }

        try {
            setIsCreating(true);
            const response = await consentApi.requestManualOtp(selectedAppId!, {
                email: newConsentEmail,
                phone_number: newConsentPhone || undefined,
                purposeId: newConsentPurposeId,
                policyVersionId: newConsentPolicyId
            });
            
            if (response.success) {
                setManualSessionId(response.sessionId);
                setOtpSentTo(response.sentTo);
                setDevOtp(response.dev_otp || '');
                setIsOtpStep(true);
                toast.success(`OTP sent to ${response.sentTo}`);
            } else {
                toast.error('Failed to send OTP');
            }
        } catch (error) {
            toast.error('Failed to initiate consent request');
        } finally {
            setIsCreating(false);
        }
    };

    const handleVerifyManualOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otpCode) {
            toast.error('Please enter the OTP');
            return;
        }

        try {
            setIsCreating(true);
            const response = await consentApi.verifyManualOtp(selectedAppId!, manualSessionId, otpCode);
            if (response.success) {
                toast.success('Consent recorded successfully');
                setShowCreateModal(false);
                resetCreateForm();
                fetchConsents();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Invalid OTP');
        } finally {
            setIsCreating(false);
        }
    };

    const resetCreateForm = () => {
        setNewConsentEmail('');
        setNewConsentPhone('');
        setNewConsentPurposeId('');
        setIsOtpStep(false);
        setManualSessionId('');
        setOtpCode('');
        setDevOtp('');
    };

    const handleWithdraw = async () => {
        if (!selectedConsent || !selectedAppId) return;
        try {
            setIsWithdrawing(true);
            await consentApi.withdrawConsent(selectedAppId, selectedConsent.userId, selectedConsent.purposeId);
            toast.success('Consent withdrawn successfully');
            setSelectedConsent(null);
            fetchConsents();
        } catch (error) {
            toast.error('Failed to withdraw consent');
        } finally {
            setIsWithdrawing(false);
        }
    };

    const filteredConsents = consents.filter(c => {
        const matchesSearch = c.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.purposeName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All Statuses' || c.currentStatus === statusFilter.toLowerCase();
        return matchesSearch && matchesStatus;
    });

    const resetFilters = () => {
        setSearchTerm('');
        setStatusFilter('All Statuses');
    };

    const getPolicyVersionLabel = (consent: any) => {
        const policyId = consent.policyVersionId || consent.policy_version_id || consent.policyVersion;
        const policy = policies.find(p => p.id === policyId || p.version === policyId);
        return policy?.version || consent.policyVersion || 'N/A';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">User Consents</h2>
                    <p className="text-slate-500 font-medium text-sm">Monitor and manage user consent records across all purposes.</p>
                </div>
                <button
                    onClick={handleOpenCreateModal}
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-200 active:scale-95"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Record New Consent
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by Identity Hash or purpose..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <select
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 bg-white hover:bg-slate-50 transition-colors focus:outline-none"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option>All Statuses</option>
                        <option>Granted</option>
                        <option>Withdrawn</option>
                    </select>
                    <button
                        onClick={resetFilters}
                        className="inline-flex items-center px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset
                    </button>
                </div>
            </div>

            {/* Table */}
            {!selectedAppId ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
                    <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-900 mb-2">No Application Selected</h3>
                    <p className="text-slate-500 max-w-xs mx-auto">Please select an application from the header to manage its user consents.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Identity Hash</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Purpose</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Updated At</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
                                        <p className="text-sm text-slate-500 font-medium">Loading consents...</p>
                                    </td>
                                </tr>
                            ) : filteredConsents.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <ShieldAlert className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                        <p className="text-sm text-slate-500 font-medium">No consent records found.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredConsents.map((consent) => (
                                    <tr
                                        key={consent.id}
                                        className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                                        onClick={() => setSelectedConsent(consent)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 mr-3 shrink-0">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <span 
                                                    className="text-sm font-bold text-slate-900 font-mono"
                                                    title={consent.userId}
                                                >
                                                    {truncateHash(consent.userId)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-700">{consent.purposeName}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Policy {getPolicyVersionLabel(consent)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${consent.currentStatus === 'granted'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                    : 'bg-amber-50 text-amber-700 border-amber-100'
                                                }`}>
                                                {consent.currentStatus === 'granted' && <ShieldCheck className="w-3 h-3 mr-1" />}
                                                <span className="capitalize">{consent.currentStatus}</span>
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center text-sm text-slate-500 font-medium">
                                                <Clock className="w-3.5 h-3.5 mr-1.5 opacity-50" />
                                                {formatDate(consent.updatedAt)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors ml-auto" />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                    </div>
                </div>
            )}

            {/* Details Drawer */}
            {selectedConsent && (
                <div className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-white shadow-2xl z-50 border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-500">
                    <div className="px-6 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Consent Details</h3>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{selectedConsent.id}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setSelectedConsent(null)}
                            className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {(() => {
                        const purpose = purposes.find(p => p.id === selectedConsent.purposeId);
                        const policyLabel = getPolicyVersionLabel(selectedConsent);
                        
                        return (
                            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                                {/* Summary Card */}
                                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-slate-500">Current Status</span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${selectedConsent.currentStatus === 'granted'
                                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                                : 'bg-amber-100 text-amber-700 border-amber-200'
                                            }`}>
                                            {selectedConsent.currentStatus.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="h-px bg-slate-200"></div>
                                    <div className="space-y-4">
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Identity Hash</span>
                                            <span className="text-sm font-bold text-slate-900 font-mono break-all bg-slate-100 p-2 rounded-lg block border border-slate-200">
                                                {selectedConsent.userId}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Purpose</span>
                                            <span className="text-sm font-bold text-slate-900">{selectedConsent.purposeName}</span>
                                        </div>
                                    </div>
                                    {purpose?.description && (
                                        <>
                                            <div className="h-px bg-slate-200"></div>
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Description</span>
                                                <p className="text-xs text-slate-600 font-medium leading-relaxed">{purpose.description}</p>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Purpose Details */}
                                {purpose && (
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold text-slate-900 flex items-center">
                                            <ShieldCheck className="w-4 h-4 mr-2 text-indigo-600" />
                                            Purpose Configuration
                                        </h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            {purpose.validity_days && (
                                                <div className="p-3 bg-white border border-slate-100 rounded-xl">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Validity</span>
                                                    <span className="text-sm font-bold text-slate-900">{purpose.validity_days} Days</span>
                                                </div>
                                            )}
                                            {purpose.retention_days && (
                                                <div className="p-3 bg-white border border-slate-100 rounded-xl">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Retention</span>
                                                    <span className="text-sm font-bold text-slate-900">{purpose.retention_days} Days</span>
                                                </div>
                                            )}
                                        </div>
                                        {purpose.required_data && purpose.required_data.length > 0 && (
                                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Required Data Points</span>
                                                <div className="flex flex-wrap gap-2">
                                                    {purpose.required_data.map((data, i) => (
                                                        <span key={i} className="px-2 py-1 bg-white border border-slate-200 rounded-md text-[10px] font-bold text-slate-600">
                                                            {data}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Metadata */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-slate-900 flex items-center">
                                        <FileText className="w-4 h-4 mr-2 text-indigo-600" />
                                        Metadata & Compliance
                                    </h4>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl">
                                            <div className="flex items-center">
                                                <History className="w-4 h-4 mr-3 text-slate-400" />
                                                <span className="text-sm font-medium text-slate-600">Policy Version</span>
                                            </div>
                                            <span className="text-sm font-bold text-slate-900">
                                                {policyLabel}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl">
                                            <div className="flex items-center">
                                                <Calendar className="w-4 h-4 mr-3 text-slate-400" />
                                                <span className="text-sm font-medium text-slate-600">Last Updated</span>
                                            </div>
                                            <span className="text-sm font-bold text-slate-900">{formatDate(selectedConsent.updatedAt)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Info Box */}
                                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex gap-3">
                                    <div className="mt-0.5">
                                        <RotateCcw className="w-4 h-4 text-indigo-600" />
                                    </div>
                                    <p className="text-xs text-indigo-700 leading-relaxed font-medium">
                                        Withdrawing consent will invalidate future data processing for this purpose.
                                        Past processing activities remain recorded in the audit trail.
                                    </p>
                                </div>
                            </div>
                        );
                    })()}

                    <div className="p-6 bg-slate-50 border-t border-slate-100">
                        {selectedConsent.currentStatus === 'granted' ? (
                            <button
                                onClick={handleWithdraw}
                                disabled={isWithdrawing}
                                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-slate-200 flex items-center justify-center"
                            >
                                {isWithdrawing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Withdrawing...
                                    </>
                                ) : (
                                    'Withdraw Consent'
                                )}
                            </button>
                        ) : (
                            <div className="w-full py-3 bg-slate-100 text-slate-400 font-bold rounded-xl text-center cursor-not-allowed border border-slate-200">
                                Already Withdrawn
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Record New Consent Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 min-h-screen">
                    <div 
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                        onClick={() => !isCreating && (setShowCreateModal(false), resetCreateForm())}
                    />
                    
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden relative animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="px-8 pt-8 pb-6 flex items-center justify-between relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                            <div className="relative">
                                <h3 className="text-2xl font-black text-slate-900 leading-tight">Record Consent</h3>
                                <div className="flex items-center mt-1.5 space-x-2">
                                    <div className="h-1 w-8 bg-indigo-600 rounded-full" />
                                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Manual Override Flow</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => { setShowCreateModal(false); resetCreateForm(); }}
                                disabled={isCreating}
                                className="relative p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-2xl transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={isOtpStep ? handleVerifyManualOtp : handleRecordConsent} className="px-8 pb-8 space-y-6 relative">
                            {!isOtpStep ? (
                                <>
                                    {/* Identity Fields */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                                            <div className="relative group">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                                    <FileText className="w-4 h-4" />
                                                </div>
                                                <input
                                                    type="email"
                                                    placeholder="user@example.com"
                                                    className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold placeholder:text-slate-400 text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-mono"
                                                    value={newConsentEmail}
                                                    onChange={(e) => setNewConsentEmail(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                                            <div className="relative group">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="+1234567890"
                                                    className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold placeholder:text-slate-400 text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-mono"
                                                    value={newConsentPhone}
                                                    onChange={(e) => setNewConsentPhone(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Identity Hash Preview */}
                                    {identityHash && (
                                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1">Pseudonymized Identity Hash</label>
                                            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex items-center gap-3 overflow-hidden">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                                                    <ShieldCheck className="w-4 h-4" />
                                                </div>
                                                <code className="text-[10px] font-bold text-indigo-300 break-all font-mono">
                                                    {identityHash}
                                                </code>
                                            </div>
                                            <p className="text-[9px] font-bold text-slate-400 ml-1 italic">
                                                * This SHA-256 hash is a preview. The server will derive the final immutable identity.
                                            </p>
                                        </div>
                                    )}

                                    {/* Purpose Selection */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Consent Purpose</label>
                                        <select
                                            required
                                            className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                                            value={newConsentPurposeId}
                                            onChange={(e) => setNewConsentPurposeId(e.target.value)}
                                        >
                                            <option value="" disabled>Select a Purpose</option>
                                            {purposes.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Policy Version Selection */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Compliance Policy</label>
                                        <select
                                            required
                                            className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                                            value={newConsentPolicyId}
                                            onChange={(e) => setNewConsentPolicyId(e.target.value)}
                                        >
                                            <option value="" disabled>Select Policy Version</option>
                                            {policies.map(v => (
                                                <option key={v.id} value={v.id}>{v.version}</option>
                                            ))}
                                        </select>
                                        {policies.length === 0 && (
                                            <p className="text-[10px] font-bold text-amber-600 mt-1 flex items-center">
                                                <ShieldAlert className="w-3 h-3 mr-1" />
                                                No active policy versions found. Please create one first.
                                            </p>
                                        )}
                                    </div>

                                    {/* Info Banner */}
                                    <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 flex gap-3">
                                        <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
                                        <p className="text-[10px] font-bold text-indigo-700 leading-relaxed uppercase tracking-wider">
                                            Requesting OTP will send a 6-digit code to verify the user identity.
                                        </p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => { setShowCreateModal(false); resetCreateForm(); }}
                                            disabled={isCreating}
                                            className="flex-1 px-6 py-4 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-black uppercase tracking-widest rounded-2xl transition-all active:scale-[0.98] border border-slate-200"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isCreating || policies.length === 0}
                                            className="flex-[2] px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-indigo-100 active:scale-[0.98] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isCreating ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Processing...
                                                </>
                                            ) : (
                                                'Send OTP'
                                            )}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                    <div className="text-center space-y-2">
                                        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <ShieldCheck className="w-8 h-8" />
                                        </div>
                                        <h4 className="text-lg font-bold text-slate-900">Verify Identity</h4>
                                        <p className="text-sm text-slate-500 font-medium">
                                            An OTP has been sent to your <b>{otpSentTo}</b>.
                                            {devOtp && <span className="block text-indigo-500 font-bold mt-1">Dev Mode OTP: {devOtp}</span>}
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-center block">Enter 6-Digit Code</label>
                                        <input
                                            type="text"
                                            placeholder="· · · · · ·"
                                            maxLength={6}
                                            required
                                            autoFocus
                                            className="w-full text-center px-4 py-6 bg-slate-50 border border-slate-200 rounded-3xl text-3xl font-black tracking-[0.5em] text-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-200"
                                            value={otpCode}
                                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                        />
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setIsOtpStep(false)}
                                            disabled={isCreating}
                                            className="flex-1 px-6 py-4 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-black uppercase tracking-widest rounded-2xl transition-all active:scale-[0.98] border border-slate-200"
                                        >
                                            Back
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isCreating || otpCode.length < 6}
                                            className="flex-[2] px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-emerald-100 active:scale-[0.98] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isCreating ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Verifying...
                                                </>
                                            ) : (
                                                'Verify & Record'
                                            )}
                                        </button>
                                    </div>

                                    <p className="text-[10px] text-center text-slate-400 font-medium">
                                        Didn't receive the code? 
                                        <button 
                                            type="button"
                                            onClick={handleRecordConsent}
                                            className="text-indigo-600 font-bold ml-1 hover:underline underline-offset-2"
                                        >
                                            Resend
                                        </button>
                                    </p>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            )}

            {/* Backdrop */}
            {(selectedConsent || showCreateModal) && (
                <div
                    className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] z-40 transition-opacity"
                    onClick={() => {
                        setSelectedConsent(null);
                        if (!isCreating) setShowCreateModal(false);
                    }}
                ></div>
            )}
        </div>
    );
};

export default Consents;
