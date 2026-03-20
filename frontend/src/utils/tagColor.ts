import { statusTagColorList, tagColor } from './statusTagColor';

// Category-specific tag colors
const documentTagColors = [
  { value: 'invoice', label: 'Invoice', color: 'purple', icon: '📄' },
  { value: 'contract', label: 'Contract', color: 'blue', icon: '📝' },
  { value: 'report', label: 'Report', color: 'cyan', icon: '📊' },
  { value: 'legal', label: 'Legal', color: 'red', icon: '⚖️' },
  { value: 'financial', label: 'Financial', color: 'green', icon: '💰' },
  { value: 'receipt', label: 'Receipt', color: 'gold', icon: '🧾' },
  { value: 'proposal', label: 'Proposal', color: 'geekblue', icon: '📑' },
  { value: 'agreement', label: 'Agreement', color: 'volcano', icon: '🤝' },
];

/**
 * Get color for a document tag
 * @param {string} tag - Tag to get color for
 * @returns {object} Tag with color information
 */
export const getDocumentTagColor = (tag) => {
  // First check document-specific tags
  const tagColorMap = {
    // Status tags
    Draft: 'orange',
    Final: 'green',
    Archived: 'gray',
    Confidential: 'red',
    Important: 'volcano',
    Urgent: 'magenta',

    // Document type tags
    Contract: 'blue',
    Invoice: 'purple',
    Report: 'cyan',
    Receipt: 'lime',
    Legal: 'gold',
    Financial: 'geekblue',
    Technical: 'teal',
    HR: 'pink',
    Sales: 'green',

    // Common tags
    Signed: 'green',
    Pending: 'orange',
    Review: 'purple',
    Approved: 'green',
    Rejected: 'red',
    Expired: 'red',
  };

  // Return the mapped color or a default one using hash function for consistency
  return tagColorMap[tag] || getDefaultTagColor(tag);
};

// Get a deterministic color based on string hash
const getDefaultTagColor = (tag) => {
  const colors = [
    'magenta',
    'red',
    'volcano',
    'orange',
    'gold',
    'lime',
    'green',
    'cyan',
    'blue',
    'geekblue',
    'purple',
  ];

  // Simple string hash function
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = (hash << 5) - hash + tag.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }

  // Use absolute value and modulo to get index
  const colorIndex = Math.abs(hash) % colors.length;
  return colors[colorIndex];
};

/**
 * Get colors for multiple document tags
 * @param {Array<string>} tags - Array of tags
 * @returns {Array<object>} Tags with color information
 */
export const getDocumentTagColors = (tags = []) => {
  if (!Array.isArray(tags) || tags.length === 0) return [];

  // Process each tag individually using our document-specific logic first
  return tags.map((tag) => {
    // First check document-specific tags
    const docTag = documentTagColors.find((item) => item.value.toLowerCase() === tag.toLowerCase());

    if (docTag) return docTag;

    // If not a document-specific tag, use the general tagColor function
    return tagColor(tag);
  });
};

export default {
  getDocumentTagColor,
  getDocumentTagColors,
};
