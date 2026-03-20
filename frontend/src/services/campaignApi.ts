import apolloClient from '@/graphql/client';
import {
  GET_CAMPAIGNS,
  GET_CAMPAIGN,
  CREATE_CAMPAIGN,
  UPDATE_CAMPAIGN,
  DELETE_CAMPAIGN,
  LAUNCH_CAMPAIGN,
  PAUSE_CAMPAIGN,
  DUPLICATE_CAMPAIGN,
  CAMPAIGN_ANALYTICS,
  SEND_TEST_CAMPAIGN,
  AI_GENERATE_CAMPAIGN,
} from '@/graphql/operations/campaign';

const campaignApi = {
  getCampaigns: (params) =>
    apolloClient.query({ query: GET_CAMPAIGNS, variables: params }).then(({ data }) => data.campaignList),
  getCampaignById: (id) =>
    apolloClient.query({ query: GET_CAMPAIGN, variables: { id } }).then(({ data }) => data.campaignRead),
  createCampaign: (data) =>
    apolloClient.mutate({ mutation: CREATE_CAMPAIGN, variables: { input: data } }).then(({ data: d }) => d.campaignCreate),
  updateCampaign: (id, data) =>
    apolloClient.mutate({ mutation: UPDATE_CAMPAIGN, variables: { id, input: data } }).then(({ data: d }) => d.campaignUpdate),
  deleteCampaign: (id) =>
    apolloClient.mutate({ mutation: DELETE_CAMPAIGN, variables: { id } }).then(({ data: d }) => d.campaignDelete),
  startCampaign: (id) =>
    apolloClient.mutate({ mutation: LAUNCH_CAMPAIGN, variables: { id } }).then(({ data: d }) => d.campaignLaunch),
  pauseCampaign: (id) =>
    apolloClient.mutate({ mutation: PAUSE_CAMPAIGN, variables: { id } }).then(({ data: d }) => d.campaignPause),
  // scheduleCampaign — no direct GraphQL mutation, keep REST fallback
  scheduleCampaign: async (id, schedule) => {
    const { request } = await import('@/request');
    return request.post(`marketing/campaigns/${id}/schedule`, schedule);
  },
  // optimizeCampaign — no direct GraphQL mutation, keep REST fallback
  optimizeCampaign: async (id) => {
    const { request } = await import('@/request');
    return request.post(`marketing/campaigns/${id}/optimize`);
  },
  duplicateCampaign: ({ id }) =>
    apolloClient.mutate({ mutation: DUPLICATE_CAMPAIGN, variables: { id } }).then(({ data: d }) => d.campaignDuplicate),
  // bulkUpdateCampaigns — no bulk update mutation
  bulkUpdateCampaigns: async (bulkData) => {
    const { request } = await import('@/request');
    return request.post('marketing/campaigns/bulk', bulkData);
  },
  getCampaignAnalytics: (id) =>
    apolloClient.query({ query: CAMPAIGN_ANALYTICS, variables: { id } }).then(({ data }) => data.campaignAnalytics),
  // generateCampaignReport — file/report generation, keep REST
  generateCampaignReport: async (id, reportData) => {
    const { request } = await import('@/request');
    return request.post(`marketing/campaigns/${id}/report`, reportData);
  },
  createABTest: (id, abTestData) =>
    apolloClient.mutate({ mutation: SEND_TEST_CAMPAIGN, variables: { id, email: abTestData.email } }).then(({ data: d }) => d.campaignSendTest),
  // getABTestResults — no direct query, keep REST
  getABTestResults: async (id) => {
    const { request } = await import('@/request');
    return request.get(`marketing/campaigns/${id}/ab-test/results`);
  },
  // updateABTestMetrics — keep REST
  updateABTestMetrics: async (id, metrics) => {
    const { request } = await import('@/request');
    return request.post(`marketing/campaigns/${id}/ab-test/metrics`, metrics);
  },
};

export default campaignApi;
