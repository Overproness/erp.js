/**
 * antd-upload-impl.tsx
 * Upload & Upload.Dragger built with react-dropzone.
 * Mimics antd Upload's fileList / onChange / beforeUpload / action API.
 */
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, Loader2, Upload as UploadIcon, X } from 'lucide-react';
import * as React from 'react';
import { useDropzone } from 'react-dropzone';

// ── File type ─────────────────────────────────────────────────────────────────
export interface UploadFile {
  uid: string;
  name: string;
  status?: 'uploading' | 'done' | 'error' | 'removed';
  percent?: number;
  size?: number;
  type?: string;
  url?: string;
  thumbUrl?: string;
  response?: any;
  error?: any;
  originFileObj?: File;
}

export interface UploadChangeInfo {
  file: UploadFile;
  fileList: UploadFile[];
  event?: { percent: number };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
let uidCounter = 0;
function genUid() {
  return `rc-upload-${Date.now()}-${++uidCounter}`;
}

function fileToUploadFile(file: File): UploadFile {
  return {
    uid: genUid(),
    name: file.name,
    size: file.size,
    type: file.type,
    status: 'uploading',
    percent: 0,
    originFileObj: file,
  };
}

async function doUpload(
  uf: UploadFile,
  action: string,
  headers: Record<string, string>,
  name: string,
  data: Record<string, any> | ((file: UploadFile) => Record<string, any>),
  onProgress: (percent: number) => void
): Promise<any> {
  const formData = new FormData();
  const extraData = typeof data === 'function' ? data(uf) : data;
  Object.entries(extraData ?? {}).forEach(([k, v]) => formData.append(k, v));
  formData.append(name, uf.originFileObj as File);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', action);
    Object.entries(headers ?? {}).forEach(([k, v]) => xhr.setRequestHeader(k, v));
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          resolve(xhr.responseText);
        }
      } else {
        reject(new Error(xhr.statusText));
      }
    };
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.send(formData);
  });
}

// ── Upload props ──────────────────────────────────────────────────────────────
export interface UploadProps {
  action?: string | ((file: UploadFile) => string | Promise<string>);
  method?: string;
  headers?: Record<string, string>;
  name?: string;
  data?: Record<string, any> | ((file: UploadFile) => Record<string, any>);
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  fileList?: UploadFile[];
  defaultFileList?: UploadFile[];
  maxCount?: number;
  listType?: 'text' | 'picture' | 'picture-card' | 'picture-circle';
  showUploadList?: boolean | { showPreviewIcon?: boolean; showRemoveIcon?: boolean };
  beforeUpload?: (
    file: File,
    fileList: File[]
  ) => boolean | Promise<boolean | File | Blob> | 'LIST_IGNORE';
  onChange?: (info: UploadChangeInfo) => void;
  onRemove?: (file: UploadFile) => boolean | void | Promise<boolean | void>;
  onPreview?: (file: UploadFile) => void;
  onDownload?: (file: UploadFile) => void;
  customRequest?: (options: any) => void;
  withCredentials?: boolean;
  openFileDialogOnClick?: boolean;
  progress?: { strokeWidth?: number; showInfo?: boolean };
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  // form compat
  valuePropName?: string; // "fileList"
}

const UploadBase: React.FC<UploadProps> = ({
  action,
  headers = {},
  name: fieldName = 'file',
  data = {},
  accept,
  multiple,
  disabled,
  fileList: fileListProp,
  defaultFileList = [],
  maxCount,
  listType = 'text',
  showUploadList = true,
  beforeUpload,
  onChange,
  onRemove,
  onPreview,
  customRequest,
  children,
  className,
  style,
}) => {
  const isControlled = fileListProp !== undefined;
  const [internal, setInternal] = React.useState<UploadFile[]>(defaultFileList);
  const files = isControlled ? fileListProp! : internal;

  const updateFiles = (next: UploadFile[]) => {
    if (!isControlled) setInternal(next);
  };

  const processFile = async (file: File, allFiles: File[]) => {
    // beforeUpload check
    if (beforeUpload) {
      let result: any = beforeUpload(file, allFiles);
      if (result instanceof Promise) result = await result;
      if (result === false || result === 'LIST_IGNORE') return;
    }

    const uf = fileToUploadFile(file);
    const next = maxCount ? [...files.slice(-(maxCount - 1)), uf] : [...files, uf];
    updateFiles(next);
    onChange?.({ file: uf, fileList: next });

    if (!action) return;

    const resolvedAction = typeof action === 'function' ? await action(uf) : action;

    if (customRequest) {
      customRequest({
        action: resolvedAction,
        file,
        headers,
        data,
        onProgress: ({ percent }: { percent: number }) => {
          const updated = files.map((f) => (f.uid === uf.uid ? { ...f, percent } : f));
          updateFiles(updated);
        },
        onSuccess: (response: any) => {
          const updated = files.map((f) =>
            f.uid === uf.uid ? { ...f, status: 'done' as const, response, percent: 100 } : f
          );
          const done = { ...uf, status: 'done' as const, response, percent: 100 };
          updateFiles(updated);
          onChange?.({ file: done, fileList: updated });
        },
        onError: (err: Error) => {
          const updated = files.map((f) =>
            f.uid === uf.uid ? { ...f, status: 'error' as const, error: err } : f
          );
          const errFile = { ...uf, status: 'error' as const, error: err };
          updateFiles(updated);
          onChange?.({ file: errFile, fileList: updated });
        },
      });
      return;
    }

    try {
      const response = await doUpload(uf, resolvedAction, headers, fieldName, data, (percent) => {
        const updated = files.map((f) => (f.uid === uf.uid ? { ...f, percent } : f));
        updateFiles(updated);
      });
      const done = { ...uf, status: 'done' as const, response, percent: 100 };
      const updated = files.map((f) => (f.uid === uf.uid ? done : f));
      updateFiles(updated);
      onChange?.({ file: done, fileList: updated });
    } catch (err) {
      const errFile = { ...uf, status: 'error' as const, error: err, percent: 0 };
      const updated = files.map((f) => (f.uid === uf.uid ? errFile : f));
      updateFiles(updated);
      onChange?.({ file: errFile, fileList: updated });
    }
  };

  const { getRootProps, getInputProps, open } = useDropzone({
    accept: accept ? { [accept.includes('/') ? accept : `application/${accept}`]: [] } : undefined,
    multiple: multiple ?? false,
    disabled,
    noClick: true,
    noKeyboard: true,
    onDrop: (acceptedFiles) => {
      acceptedFiles.forEach((f) => processFile(f, acceptedFiles));
    },
  });

  const handleRemove = async (uf: UploadFile) => {
    if (onRemove) {
      const allow = await onRemove(uf);
      if (allow === false) return;
    }
    const removed = { ...uf, status: 'removed' as const };
    const next = files.filter((f) => f.uid !== uf.uid);
    updateFiles(next);
    onChange?.({ file: removed, fileList: next });
  };

  const showList =
    showUploadList === true || (typeof showUploadList === 'object' && showUploadList !== false);

  return (
    <div {...getRootProps()} className={cn('inline-block', className)} style={style}>
      <input {...getInputProps()} />
      <div onClick={open} className="cursor-pointer">
        {children}
      </div>
      {showList && files.length > 0 && (
        <ul className="mt-2 space-y-1">
          {files
            .filter((f) => f.status !== 'removed')
            .map((f) => (
              <li
                key={f.uid}
                className="flex items-center gap-2 text-sm px-2 py-1 rounded border border-border bg-muted/30"
              >
                {f.status === 'uploading' && (
                  <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                )}
                {f.status === 'done' && <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />}
                {f.status === 'error' && (
                  <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                )}
                <span
                  className={cn(
                    'flex-1 truncate',
                    f.status === 'error' && 'text-destructive',
                    f.url && 'text-primary cursor-pointer hover:underline'
                  )}
                  onClick={() => f.url && onPreview?.(f)}
                >
                  {f.name}
                </span>
                {f.status === 'uploading' && f.percent !== undefined && (
                  <span className="text-xs text-muted-foreground shrink-0">{f.percent}%</span>
                )}
                {(typeof showUploadList !== 'object' ||
                  showUploadList.showRemoveIcon !== false) && (
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(f);
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </li>
            ))}
        </ul>
      )}
    </div>
  );
};

// ── Upload.Dragger ────────────────────────────────────────────────────────────
const Dragger: React.FC<UploadProps & { height?: number }> = ({
  action,
  headers = {},
  name: fieldName = 'file',
  data = {},
  accept,
  multiple,
  disabled,
  fileList: fileListProp,
  defaultFileList = [],
  maxCount,
  showUploadList = true,
  beforeUpload,
  onChange,
  onRemove,
  customRequest,
  children,
  className,
  style,
  height = 160,
}) => {
  const isControlled = fileListProp !== undefined;
  const [internal, setInternal] = React.useState<UploadFile[]>(defaultFileList);
  const files = isControlled ? fileListProp! : internal;

  const updateFiles = (next: UploadFile[]) => {
    if (!isControlled) setInternal(next);
  };

  const processFile = async (file: File, allFiles: File[]) => {
    if (beforeUpload) {
      let result: any = beforeUpload(file, allFiles);
      if (result instanceof Promise) result = await result;
      if (result === false || result === 'LIST_IGNORE') return;
    }

    const uf = fileToUploadFile(file);
    const next = maxCount ? [...files.slice(-(maxCount - 1)), uf] : [...files, uf];
    updateFiles(next);
    onChange?.({ file: uf, fileList: next });

    if (!action) return;
    const resolvedAction = typeof action === 'function' ? await action(uf) : action;

    if (customRequest) {
      customRequest({
        action: resolvedAction,
        file,
        headers,
        data,
        onSuccess: (response: any) => {
          const done = { ...uf, status: 'done' as const, response, percent: 100 };
          const updated = files.map((f) => (f.uid === uf.uid ? done : f));
          updateFiles(updated);
          onChange?.({ file: done, fileList: updated });
        },
        onError: (err: Error) => {
          const errFile = { ...uf, status: 'error' as const, error: err };
          const updated = files.map((f) => (f.uid === uf.uid ? errFile : f));
          updateFiles(updated);
          onChange?.({ file: errFile, fileList: updated });
        },
      });
      return;
    }

    try {
      const response = await doUpload(uf, resolvedAction, headers, fieldName, data, () => {});
      const done = { ...uf, status: 'done' as const, response, percent: 100 };
      const updated = files.map((f) => (f.uid === uf.uid ? done : f));
      updateFiles(updated);
      onChange?.({ file: done, fileList: updated });
    } catch (err) {
      const errFile = { ...uf, status: 'error' as const, error: err };
      const updated = files.map((f) => (f.uid === uf.uid ? errFile : f));
      updateFiles(updated);
      onChange?.({ file: errFile, fileList: updated });
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: accept ? { [accept.includes('/') ? accept : `application/${accept}`]: [] } : undefined,
    multiple: multiple ?? true,
    disabled,
    onDrop: (acceptedFiles) => {
      acceptedFiles.forEach((f) => processFile(f, acceptedFiles));
    },
  });

  return (
    <div className={className} style={style}>
      <div
        {...getRootProps()}
        className={cn(
          'flex flex-col items-center justify-center rounded-[var(--radius)] border-2 border-dashed',
          'border-border bg-muted/20 cursor-pointer transition-colors',
          'hover:border-primary hover:bg-primary/5',
          isDragActive && 'border-primary bg-primary/10',
          disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
        )}
        style={{ height }}
      >
        <input {...getInputProps()} />
        {children ?? (
          <div className="flex flex-col items-center gap-2 p-4 text-center">
            <UploadIcon className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {isDragActive ? 'Drop files here…' : 'Click or drag files to upload'}
            </p>
          </div>
        )}
      </div>
      {showUploadList && files.length > 0 && (
        <ul className="mt-2 space-y-1">
          {files
            .filter((f) => f.status !== 'removed')
            .map((f) => (
              <li
                key={f.uid}
                className="flex items-center gap-2 text-sm px-2 py-1 rounded border border-border bg-muted/30"
              >
                {f.status === 'uploading' && (
                  <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                )}
                {f.status === 'done' && <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />}
                {f.status === 'error' && (
                  <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                )}
                <span className="flex-1 truncate">{f.name}</span>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-destructive shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onRemove) {
                      void onRemove(f);
                    }
                    const next = files.filter((x) => x.uid !== f.uid);
                    updateFiles(next);
                    onChange?.({ file: { ...f, status: 'removed' }, fileList: next });
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
};

export const Upload = Object.assign(UploadBase, { Dragger });
