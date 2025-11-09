const fileFilterMiddleware = ({ type = 'default', mimetype, filename = '' }) => {
  // Dangerous file extensions that should always be blocked
  const dangerousExtensions = [
    '.exe',
    '.bat',
    '.cmd',
    '.scr',
    '.pif',
    '.com',
    '.jar',
    '.vbs',
    '.js',
    '.jse',
    '.ws',
    '.wsf',
    '.wsc',
    '.wsh',
    '.ps1',
    '.ps1xml',
    '.ps2',
    '.ps2xml',
    '.psc1',
    '.psc2',
    '.msh',
    '.msh1',
    '.msh2',
    '.mshxml',
    '.msh1xml',
    '.msh2xml',
    '.scf',
    '.lnk',
    '.inf',
    '.reg',
    '.doc',
    '.xls',
    '.ppt',
    '.docm',
    '.xlsm',
    '.pptm',
    '.php',
    '.asp',
    '.aspx',
    '.jsp',
    '.pl',
    '.py',
    '.rb',
    '.sh',
  ];

  // Dangerous MIME types that should be blocked
  const dangerousMimeTypes = [
    'application/octet-stream',
    'application/x-executable',
    'application/x-msdownload',
    'application/x-msdos-program',
    'application/x-bat',
    'application/x-sh',
    'application/javascript',
    'text/javascript',
    'application/x-javascript',
    'application/x-php',
    'application/php',
    'text/x-php',
    'application/vnd.ms-excel.sheet.macroEnabled.12',
    'application/vnd.ms-word.document.macroEnabled.12',
    'application/vnd.ms-powerpoint.presentation.macroEnabled.12',
  ];

  // Check for dangerous file extensions
  const fileExtension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  if (dangerousExtensions.includes(fileExtension)) {
    return false;
  }

  // Check for dangerous MIME types
  if (dangerousMimeTypes.includes(mimetype.toLowerCase())) {
    return false;
  }

  // Check for path traversal attempts in filename
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return false;
  }

  // array containing all the possible file types
  const _fileType = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    // Remove SVG as it can contain scripts
    // 'image/svg+xml',
    'application/msword',
    'text/plain',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/pdf',
    'application/zip',
    'application/vnd.rar',
    'video/mp4',
    'video/x-msvideo',
    'audio/mpeg',
    'video/webm',
  ];

  if (type === 'default') {
    // For default, still check if it's in allowed types and not dangerous
    return _fileType.includes(mimetype);
  } else {
    let _flag = _fileType.includes(mimetype);

    if (type === 'image') {
      if (!mimetype.startsWith('image/') || mimetype === 'image/svg+xml') {
        _flag = false;
      }
    } else if (type === 'pdf') {
      if (!mimetype.startsWith('application/pdf')) {
        _flag = false;
      }
    } else if (type === 'video') {
      if (!mimetype.startsWith('video/')) {
        _flag = false;
      }
    } else if (type === 'audio') {
      if (!mimetype.startsWith('audio/')) {
        _flag = false;
      }
    } else if (type === 'text') {
      if (
        !mimetype.startsWith('text/') &&
        !mimetype.startsWith('application/vnd.ms-excel') &&
        !mimetype.startsWith('application/msword') &&
        !mimetype.startsWith(
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
      ) {
        _flag = false;
      }
    } else if (type === 'excel') {
      if (
        !mimetype.startsWith('application/vnd.ms-excel') &&
        !mimetype.startsWith('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      ) {
        _flag = false;
      }
    } else if (type === 'compressed') {
      if (
        !mimetype.startsWith('application/zip') &&
        !mimetype.startsWith('application/x-zip-compressed') &&
        !mimetype.startsWith('application/vnd.rar')
      ) {
        _flag = false;
      }
    }

    return _flag;
  }
};

// Content scanning function for malicious patterns
const scanFileContent = (buffer) => {
  const content = buffer.toString('utf8', 0, Math.min(buffer.length, 10000)); // Scan first 10KB

  const maliciousPatterns = [
    /<\?php/i,
    /<script/i,
    /javascript:/i,
    /vbscript:/i,
    /onload=/i,
    /onerror=/i,
    /eval\(/i,
    /system\(/i,
    /exec\(/i,
    /shell_exec/i,
    /passthru/i,
    /<?xml/i, // Potentially dangerous XML
  ];

  return maliciousPatterns.some((pattern) => pattern.test(content));
};

module.exports = { fileFilterMiddleware, scanFileContent };
