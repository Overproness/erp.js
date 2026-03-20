const CampaignsList = ({ campaigns }) => {
  if (!campaigns || campaigns.length === 0) return <div>No campaigns found.</div>;
  return (
    <ul>
      {campaigns.map((campaign) => (
        <li key={campaign._id}>
          <strong>{campaign.name}</strong> - {campaign.status}
        </li>
      ))}
    </ul>
  );
};

export default CampaignsList;
