const CampaignFilters = ({ filters, onChange }) => {
  return (
    <div className="campaign-filters">
      <input
        type="text"
        placeholder="Search campaigns..."
        value={filters.search || ''}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
      />
      <select
        value={filters.status || ''}
        onChange={(e) => onChange({ ...filters, status: e.target.value })}
      >
        <option value="">All Statuses</option>
        <option value="active">Active</option>
        <option value="paused">Paused</option>
        <option value="scheduled">Scheduled</option>
        <option value="completed">Completed</option>
      </select>
    </div>
  );
};

export default CampaignFilters;
