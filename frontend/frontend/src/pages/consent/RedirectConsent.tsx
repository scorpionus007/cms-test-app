import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { purposeApi, Purpose } from '../../api/purposeApi';
import { policyApi, PolicyVersion } from '../../api/policyApi';
import { appsApi, AppConfig } from '../../api/appsApi';
import { toast } from 'react-hot-toast';

export default function RedirectConsent() {
  const [searchParams] = useSearchParams();
  const paramAppId = searchParams.get('appId') || '';

  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [purposeId, setPurposeId] = useState('');
  const [policyVersionId, setPolicyVersionId] = useState('');
  const [appId, setAppId] = useState(paramAppId);
  const [apiKey, setApiKey] = useState('');

  const [purposes, setPurposes] = useState<Purpose[]>([]);
  const [policies, setPolicies] = useState<PolicyVersion[]>([]);
  const [apps, setApps] = useState<AppConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [purposesData, appsDataRes] = await Promise.all([
          purposeApi.getPurposes(),
          appsApi.listApps(),
          apiClient.get('/tenant/api-keys')
        ]);
        setPurposes(purposesData);
        setApps(appsDataRes.apps);
        // API key list endpoint returns masked keys only (no plain key).
        // Keep API key as manual input so user can paste a valid active key.
        
        if (purposesData.length > 0) setPurposeId(purposesData[0].id);
        if (appsDataRes.apps && appsDataRes.apps.length > 0 && !appId) setAppId(appsDataRes.apps[0].id);

      } catch (error) {
        console.error('Failed to load form data', error);
        toast.error('Failed to load necessary configurations. Are you logged in?');
      } finally {
        setFetchingData(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (appId) {
      policyApi.getPolicyVersions(appId)
        .then(policiesData => {
          setPolicies(policiesData);
          if (policiesData.length > 0) setPolicyVersionId(policiesData[0].id);
          else setPolicyVersionId('');
        })
        .catch(err => {
          console.error(err);
          setPolicies([]);
          setPolicyVersionId('');
          toast.error('Failed to load policies for selected app.');
        });
    } else {
      setPolicies([]);
      setPolicyVersionId('');
    }
  }, [appId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email && !phoneNumber) {
      toast.error('At least one of Email or Phone Number is required.');
      return;
    }
    if (!appId) {
      toast.error('Please select an App.');
      return;
    }
    if (!apiKey) {
      toast.error('Please provide an API Key.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/public/apps/${appId}/consent/redirect/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey
        },
        body: JSON.stringify({
          email: email || undefined,
          phone_number: phoneNumber || undefined,
          purposeId,
          policyVersionId
        })
      });

      const data = await res.json();

      if (res.ok && data.redirect_url) {
        window.location.href = data.redirect_url;
      } else {
        toast.error(data.error || 'Failed to generate redirect URL');
      }
    } catch (error) {
      console.error(error);
      toast.error('Network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="flex justify-center flex-col items-center h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-gray-500">Loading form configurations...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex justify-center items-center">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-2">
            Consent Request Form
          </h2>
          <p className="text-center text-sm text-gray-500 mb-6">
            Initiate a redirect-based consent session.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          
          {/* Internal fields: APP and API KEY */}
          <div className="space-y-4 bg-gray-50 p-4 rounded-md border border-gray-200">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Connection Settings</h3>
            <div>
              <label htmlFor="appId" className="block text-sm font-medium text-gray-700">App</label>
              <select
                id="appId"
                className="mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 text-base focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                required
              >
                <option value="">Select App</option>
                {apps.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">API Key</label>
              <input
                id="apiKey"
                type="text"
                placeholder="Enter valid API Key"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">User Identity</h3>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email (Optional)</label>
              <input
                id="email"
                type="email"
                placeholder="user@example.com"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number (Optional)</label>
              <input
                id="phone"
                type="tel"
                placeholder="+919876543210"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Consent Details</h3>
            <div>
              <label htmlFor="purpose" className="block text-sm font-medium text-gray-700">Purpose</label>
              <select
                id="purpose"
                className="mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 text-base focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                value={purposeId}
                onChange={(e) => setPurposeId(e.target.value)}
                required
              >
                {purposes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="policy" className="block text-sm font-medium text-gray-700">Policy Version</label>
              <select
                id="policy"
                className="mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 text-base focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                value={policyVersionId}
                onChange={(e) => setPolicyVersionId(e.target.value)}
                required
              >
                {policies.map(p => <option key={p.id} value={p.id}>v{p.version} - {new Date(p.createdAt || '').toLocaleDateString()}</option>)}
              </select>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || (!email && !phoneNumber)}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                ${loading || (!email && !phoneNumber) ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'}
                transition-colors duration-200`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Initiating...
                </>
              ) : 'Submit → Redirect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
