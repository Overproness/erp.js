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
  SCHEDULE_CAMPAIGN,
  OPTIMIZE_CAMPAIGN,
  BULK_UPDATE_CAMPAIGNS,
  GENERATE_CAMPAIGN_REPORT,
  GET_CAMPAIGN_AB_TEST_RESULTS,
  UPDATE_CAMPAIGN_AB_TEST_METRICS,
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
  scheduleCampaign: (id, schedule) =>
    apolloClient.mutate({ mutation: SCHEDULE_CAMPAIGN, variables: { id, input: schedule } }).then(({ data: d }) => d.campaignSchedule),
  optimizeCampaign: (id) =>
    apolloClient.mutate({ mutation: OPTIMIZE_CAMPAIGN, variables: { id } }).then(({ data: d }) => d.campaignOptimize),
  duplicateCampaign: ({ id }) =>
    apolloClient.mutate({ mutation: DUPLICATE_CAMPAIGN, variables: { id } }).then(({ data: d }) => d.campaignDuplicate),
  bulkUpdateCampaigns: (bulkData) =>
    apolloClient.mutate({ mutation: BULK_UPDATE_CAMPAIGNS, variables: { ids: bulkData.ids, input: bulkData.update } }).then(({ data: d }) => d.campaignBulkUpdate),
  getCampaignAnalytics: (id) =>
    apolloClient.query({ query: CAMPAIGN_ANALYTICS, variables: { id } }).then(({ data }) => data.campaignAnalytics),
  generateCampaignReport: (id) =>
    apolloClient.mutate({ mutation: GENERATE_CAMPAIGN_REPORT, variables: { id } }).then(({ data: d }) => d.campaignGenerateReport),
  createABTest: (id, abTestData) =>
    apolloClient.mutate({ mutation: SEND_TEST_CAMPAIGN, variables: { id, email: abTestData.email } }).then(({ data: d }) => d.campaignSendTest),
  getABTestResults: (id) =>
    apolloClient.query({ query: GET_CAMPAIGN_AB_TEST_RESULTS, variables: { id } }).then(({ data }) => data.campaignAbTestResults),
  updateABTestMetrics: (id, metrics) =>
    apolloClient.mutate({ mutation: UPDATE_CAMPAIGN_AB_TEST_METRICS, variables: { id, input: metrics } }).then(({ data: d }) => d.campaignUpdateAbTestMetrics),
};

export default campaignApi;
