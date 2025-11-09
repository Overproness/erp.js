import { request } from '@/request';

const API_BASE = 'marketing';

const campaignApi = {
  getCampaigns: (params) => request.get(`${API_BASE}/campaigns/list`, { params }),
  getCampaignById: (id) => request.get(`${API_BASE}/campaigns/${id}`),
  createCampaign: (data) => request.post(`${API_BASE}/campaigns`, data),
  updateCampaign: (id, data) => request.patch(`${API_BASE}/campaigns/${id}`, data),
  deleteCampaign: (id) => request.delete(`${API_BASE}/campaigns/${id}`),
  startCampaign: (id) => request.post(`${API_BASE}/campaigns/${id}/start`),
  pauseCampaign: (id) => request.post(`${API_BASE}/campaigns/${id}/pause`),
  scheduleCampaign: (id, schedule) =>
    request.post(`${API_BASE}/campaigns/${id}/schedule`, schedule),
  optimizeCampaign: (id) => request.post(`${API_BASE}/campaigns/${id}/optimize`),
  duplicateCampaign: ({ id, name, modifications }) =>
    request.post(`${API_BASE}/campaigns/duplicate`, { campaignId: id, name, modifications }),
  bulkUpdateCampaigns: (bulkData) => request.post(`${API_BASE}/campaigns/bulk`, bulkData),
  getCampaignAnalytics: (id, params) =>
    request.get(`${API_BASE}/campaigns/${id}/analytics`, { params }),
  generateCampaignReport: (id, reportData) =>
    request.post(`${API_BASE}/campaigns/${id}/report`, reportData),
  createABTest: (id, abTestData) => request.post(`${API_BASE}/campaigns/${id}/ab-test`, abTestData),
  getABTestResults: (id) => request.get(`${API_BASE}/campaigns/${id}/ab-test/results`),
  updateABTestMetrics: (id, metrics) =>
    request.post(`${API_BASE}/campaigns/${id}/ab-test/metrics`, metrics),
};

export default campaignApi;
