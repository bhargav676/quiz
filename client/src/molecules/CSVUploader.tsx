import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import styles from './CSVUploader.module.scss';

interface CSVUploaderProps {
  onUpload: (file: File) => Promise<any>;
  acceptInfo?: string;
  templateLink?: string;
  templateLabel?: string;
}

export const CSVUploader: React.FC<CSVUploaderProps> = ({
  onUpload,
  acceptInfo = 'Only CSV files are supported',
  templateLink,
  templateLabel = 'Download CSV Template',
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setSuccessMsg('');
    setErrorMsg('');
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  const handleRemoveFile = () => {
    setFile(null);
    setSuccessMsg('');
    setErrorMsg('');
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await onUpload(file);
      if (res?.success) {
        setSuccessMsg(res.message || 'File uploaded and parsed successfully!');
        setFile(null);
      } else {
        setErrorMsg(res?.message || 'Failed to process CSV file.');
      }
    } catch (err: any) {
      setErrorMsg(
        err?.data?.message || err?.message || 'Error occurred while uploading the file.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={styles.uploaderContainer}>
      {successMsg && (
        <div className={`${styles.alert} ${styles.success}`}>
          <span>✅</span>
          <div>{successMsg}</div>
        </div>
      )}

      {errorMsg && (
        <div className={`${styles.alert} ${styles.error}`}>
          <span>⚠️</span>
          <div>{errorMsg}</div>
        </div>
      )}

      {!file ? (
        <div
          {...getRootProps()}
          className={`${styles.dropzone} ${isDragActive ? styles.active : ''}`}
        >
          <input {...getInputProps()} />
          <div className={styles.icon}>📤</div>
          <p className={styles.promptText}>
            {isDragActive ? 'Drop the CSV file here...' : 'Drag & drop a CSV file here, or click to browse'}
          </p>
          <p className={styles.subText}>{acceptInfo}</p>
          {templateLink && (
            <a
              href={templateLink}
              download
              onClick={(e) => e.stopPropagation()}
              style={{
                fontSize: '11px',
                color: 'var(--brand-primary)',
                textDecoration: 'underline',
                marginTop: '8px',
              }}
            >
              {templateLabel}
            </a>
          )}
        </div>
      ) : (
        <div className={styles.fileInfoCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
            <span>📄</span>
            <span className={styles.fileName}>
              {file.name}
              <span className={styles.fileSize}>({formatBytes(file.size)})</span>
            </span>
          </div>
          <button className={styles.removeBtn} onClick={handleRemoveFile} disabled={isUploading}>
            Remove
          </button>
        </div>
      )}

      {file && (
        <div className={styles.actionRow}>
          <button
            className={styles.uploadBtn}
            onClick={handleUpload}
            disabled={isUploading}
          >
            {isUploading ? 'Processing CSV...' : 'Process File'}
          </button>
        </div>
      )}
    </div>
  );
};
