import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCampaigns } from '../../../redux/marketing/campaignSlice';
import CampaignFilters from './CampaignFilters';
import CampaignsList from './CampaignsList';
import MetricsOverview from './MetricsOverview';

const CampaignsDashboard = () => {
  const dispatch = useDispatch();
  const { campaigns, loading, error } = useSelector((state) => state.marketing.campaigns);

  useEffect(() => {
    dispatch(fetchCampaigns());
  }, [dispatch]);

  return (
    <div>
      <h1>Campaigns Dashboard</h1>
      <CampaignFilters />
      <MetricsOverview campaigns={campaigns} />
      {loading && <div>Loading campaigns...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <CampaignsList campaigns={campaigns} />
    </div>
  );
};

export default CampaignsDashboard;
