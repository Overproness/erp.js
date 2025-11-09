/**
 * Downloads a document from the server
 * @param {Object} options - The download options
 * @param {string} options.entity - The entity type (usually 'document')
 * @param {string} options.id - The document ID
 * @returns {Promise} - Resolves when download completes
 */
const downloadDocument = async ({ entity, id }) => {
  try {
    // Import dynamically to avoid circular dependencies
    const { request } = await import('@/request');

    // Call the downloadDocument method from request
    const response = await request.downloadDocument({ entity, id });

    if (!response || response.status !== 200) {
      throw new Error('Download failed');
    }

    // Get content type from response
    const contentType = response.headers['content-type'];

    // Extract filename from headers if available
    let filename = `${entity}-${id}`;
    let fileExtension = '';

    // Try to get filename from Content-Disposition header
    const contentDisposition = response.headers['content-disposition'];
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+?)"/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1];
      }
    }

    // Try to get file extension from X-File-Extension header (if provided by backend)
    if (response.headers['x-file-extension']) {
      fileExtension = response.headers['x-file-extension'];
      // Only add extension if filename doesn't already have it
      if (!filename.toLowerCase().endsWith(`.${fileExtension.toLowerCase()}`)) {
        filename = `${filename}.${fileExtension}`;
      }
    } else if (!filename.includes('.')) {
      // Try to determine extension from content type if not in filename
      switch (contentType) {
        case 'application/pdf':
          fileExtension = 'pdf';
          break;
        case 'text/plain':
          fileExtension = 'txt';
          break;
        case 'text/csv':
          fileExtension = 'csv';
          break;
        case 'application/json':
          fileExtension = 'json';
          break;
        case 'text/html':
          fileExtension = 'html';
          break;
        case 'application/msword':
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          fileExtension = 'docx';
          break;
        case 'application/vnd.ms-excel':
        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
          fileExtension = 'xlsx';
          break;
        case 'image/jpeg':
          fileExtension = 'jpg';
          break;
        case 'image/png':
          fileExtension = 'png';
          break;
        default:
          fileExtension = 'bin';
      }

      filename = `${filename}.${fileExtension}`;
    }

    // Create download link and trigger download
    const blob = new Blob([response.data], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);

    return { status: 200, success: true };
  } catch (error) {
    console.error('Document download error:', error);
    return { status: 500, success: false, message: error.message };
  }
};

export default downloadDocument;
