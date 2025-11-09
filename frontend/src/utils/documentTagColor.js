const documentStatusColors = [
  { value: 'draft', label: 'Draft', color: 'default', icon: '📝' },
  { value: 'pending', label: 'Pending Review', color: 'processing', icon: '⏳' },
  { value: 'approved', label: 'Approved', color: 'success', icon: '✅' },
  { value: 'rejected', label: 'Rejected', color: 'error', icon: '❌' },
  { value: 'expired', label: 'Expired', color: 'warning', icon: '⏰' },
  { value: 'archived', label: 'Archived', color: 'default', icon: '📦' },

  // Document types with appropriate colors
  { value: 'Invoice', label: 'Invoice', color: 'green', icon: '💵' },
  { value: 'Contract', label: 'Contract', color: 'blue', icon: '📄' },
  { value: 'Report', label: 'Report', color: 'cyan', icon: '📊' },
  { value: 'Receipt', label: 'Receipt', color: 'purple', icon: '🧾' },
  { value: 'Agreement', label: 'Agreement', color: 'geekblue', icon: '🤝' },
  { value: 'Certificate', label: 'Certificate', color: 'gold', icon: '🏆' },
  { value: 'Legal', label: 'Legal', color: 'volcano', icon: '⚖️' },
  { value: 'Financial', label: 'Financial', color: 'orange', icon: '💰' },
  { value: 'Technical', label: 'Technical', color: 'magenta', icon: '🔧' },
  { value: 'Other', label: 'Other', color: 'default', icon: '📎' },
];

/**
 * Get document status color and icon
 * @param {string} status - The document status value
 * @returns {object} Color and icon information for the status
 */
const getDocumentStatusColor = (status) => {
  const element = documentStatusColors.find(
    (obj) => obj?.value?.toLowerCase() === status?.toLowerCase()
  );
  return element || { value: status, label: status, color: 'default', icon: '📎' };
};

/**
 * Get multiple document status colors
 * @param {Array} statuses - Array of status values
 * @returns {Array} Array of color and icon information
 */
const getDocumentStatusColors = (statuses = []) => {
  return statuses.map((status) => getDocumentStatusColor(status));
};

export { documentStatusColors, getDocumentStatusColor, getDocumentStatusColors };
