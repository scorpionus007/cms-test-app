import apiClient from "./apiClient";

export interface PolicyVersion {
  id: string;
  version: string;
  policy_text: string;
  effective_from?: string;
  createdAt?: string;
  isActive: boolean;
}

export const policyApi = {

  getPolicyVersions: async (appId: string): Promise<PolicyVersion[]> => {
    const response = await apiClient.get(`/tenant/apps/${appId}/policy-versions`);
    // The backend returns { policyVersions: [...] }
    const versions = response.data.policyVersions || [];
    return versions.map((v: any) => ({
      id: v.id,
      version: v.version_label, // Map version_label to version
      policy_text: v.policy_text,
      effective_from: v.effective_from,
      createdAt: v.created_at, // Map created_at to createdAt
      isActive: v.is_active // Map is_active to isActive
    }));
  },

  getActivePolicyVersions: async (appId: string): Promise<PolicyVersion | null> => {
    const response = await apiClient.get(`/tenant/apps/${appId}/policy-versions/active`);
    // The backend returns { policyVersion: ... }
    const v = response.data.policyVersion;
    if (!v) return null;
    return {
      id: v.id,
      version: v.version_label,
      policy_text: v.policy_text,
      effective_from: v.effective_from,
      createdAt: v.created_at,
      isActive: v.is_active
    };
  },

  createPolicyVersion: async (appId: string, data: {
    version: string;
    policy_text: string;
  }) => {

    const payload = {
      version: data.version,
      policy_text: data.policy_text,
      effective_from: new Date().toISOString().split("T")[0]
    };

    const response = await apiClient.post(`/tenant/apps/${appId}/policy-versions`, payload);
    // Backend returns { policyVersion: ... }
    return response.data.policyVersion;
  }

};