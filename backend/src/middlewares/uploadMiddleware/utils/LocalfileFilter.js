const fileFilter =
  (type = 'default') =>
  (req, file, cb) => {
    // File size limit check (50MB)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes

    // Check if the file size exceeds the limit
    if (file.size && file.size > MAX_FILE_SIZE) {
      return cb(
        new Error(
          `File size exceeds the maximum limit of 50MB. Your file is ${(
            file.size /
            (1024 * 1024)
          ).toFixed(2)}MB.`
        )
      );
    }

    // Security check: prevent path traversal in filename
    if (
      file.originalname.includes('..') ||
      file.originalname.includes('/') ||
      file.originalname.includes('\\')
    ) {
      return cb(new Error('Invalid file name: path traversal detected'));
    }

    // Check for executable file extensions (security risk)
    const dangerousExtensions = [
      '.exe',
      '.bat',
      '.cmd',
      '.scr',
      '.com',
      '.pif',
      '.js',
      '.vbs',
      '.jar',
      '.sh',
      '.ps1',
    ];
    const fileExtension = file.originalname
      .toLowerCase()
      .substring(file.originalname.lastIndexOf('.'));
    if (dangerousExtensions.includes(fileExtension)) {
      return cb(new Error('Executable file types are not allowed for security reasons'));
    }

    // array containing all the possible file types
    const _fileType = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
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
      // Even for default, check if it's in allowed types
      if (!_fileType.includes(file.mimetype)) {
        return cb(new Error(`${file.mimetype} File type not supported!`));
      }
      return cb(null, true);
    } else {
      let _flag = _fileType.includes(file.mimetype);

      if (type === 'image') {
        if (!file.mimetype.startsWith('image/')) {
          _flag = false;
        }
      } else if (type === 'pdf') {
        if (!file.mimetype.startsWith('application/pdf')) {
          _flag = false;
        }
      } else if (type === 'video') {
        if (!file.mimetype.startsWith('video/')) {
          _flag = false;
        }
      } else if (type === 'audio') {
        if (!file.mimetype.startsWith('audio/')) {
          _flag = false;
        }
      } else if (type === 'text') {
        if (
          !file.mimetype.startsWith('text/') &&
          !file.mimetype.startsWith('application/vnd.ms-excel') &&
          !file.mimetype.startsWith('application/msword') &&
          !file.mimetype.startsWith(
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          )
        ) {
          _flag = false;
        }
      } else if (type === 'excel') {
        if (
          !file.mimetype.startsWith('application/vnd.ms-excel') &&
          !file.mimetype.startsWith(
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          )
        ) {
          _flag = false;
        }
      } else if (type === 'compressed') {
        if (
          !file.mimetype.startsWith('application/zip') &&
          !file.mimetype.startsWith('application/x-zip-compressed') &&
          !file.mimetype.startsWith('application/vnd.rar')
        ) {
          _flag = false;
        }
      }

      if (_flag) {
        return cb(null, true);
      } else {
        return cb(new Error(`${file.mimetype} File type not supported!`));
      }
    }
  };

module.exports = fileFilter;
