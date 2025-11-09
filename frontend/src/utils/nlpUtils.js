/**
 * Frontend utilities for working with NLP analyzed documents.
 * This complements the backend NLP analysis functionality.
 */

/**
 * Format document type from raw API response to display format
 * @param {string} documentType - Raw document type from API
 * @returns {string} - Formatted document type
 */
export const formatDocumentType = (documentType) => {
  if (!documentType) return 'Unknown';

  // Capitalize first letter of each word
  return documentType
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Format suggested tags for display
 * @param {Array} tags - Array of tags from API
 * @returns {Array} - Formatted tags
 */
export const formatSuggestedTags = (tags) => {
  // Check if tags is undefined, null, or not an array
  if (!tags || !Array.isArray(tags)) {
    return [];
  }

  // Filter out empty tags and format them
  return tags
    .filter((tag) => tag && typeof tag === 'string' && tag.trim() !== '')
    .map((tag) => {
      // Capitalize first letter of each word
      return tag.trim().replace(/\b\w/g, (l) => l.toUpperCase());
    });
};

/**
 * Check if tag array is empty or undefined
 * @param {Array} tags - Tag array to check
 * @returns {boolean} - True if empty or not valid
 */
export const isEmptyTags = (tags) => {
  return (
    !tags ||
    !Array.isArray(tags) ||
    tags.length === 0 ||
    (tags.length === 1 && (!tags[0] || tags[0].trim() === ''))
  );
};

/**
 * Helper function to determine if a document type is supported for AI analysis
 * @param {string} fileType - File extension or type
 * @returns {boolean} - Whether the file type is analyzable
 */
export const isAnalyzableDocument = (fileType) => {
  if (!fileType) return false;

  const analyzableTypes = ['pdf', 'doc', 'docx', 'txt', 'csv', 'json', 'md', 'html'];
  return analyzableTypes.includes(fileType.toLowerCase());
};

/**
 * Helper function to prepare documents for batch analysis
 * @param {Array} documents - Raw documents from API
 * @returns {Array} - Prepared documents with consistent properties
 */
export const prepareDocumentsForAnalysis = (documents) => {
  if (!documents || !Array.isArray(documents)) return [];

  return documents.map((doc) => ({
    id: doc._id || doc.id || doc.key,
    title: doc.title || 'Untitled Document',
    documentType: doc.documentType || 'Unknown',
    tags: doc.tags || [],
    fileType: doc.fileType || (doc.fileName && doc.fileName.split('.').pop()) || 'unknown',
    // Add other properties as needed
  }));
};
