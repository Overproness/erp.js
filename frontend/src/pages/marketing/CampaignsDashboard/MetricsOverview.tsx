const MetricsOverview = ({ analytics }) => {
  if (!analytics) return null;
  return (
    <div className="metrics-overview">
      <h3>Campaign Metrics Overview</h3>
      <ul>
        <li>Total Campaigns: {analytics.totalCampaigns}</li>
        <li>Active Campaigns: {analytics.activeCampaigns}</li>
        <li>Leads Generated: {analytics.leadsGenerated}</li>
        <li>Open Rate: {analytics.openRate}%</li>
        <li>Click Rate: {analytics.clickRate}%</li>
        <li>Conversion Rate: {analytics.conversionRate}%</li>
      </ul>
    </div>
  );
};

export default MetricsOverview;
