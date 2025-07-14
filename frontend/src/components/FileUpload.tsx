'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { 
  CloudArrowUpIcon, 
  DocumentTextIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  errorMessage?: string;
  result?: unknown;
}

interface FileUploadProps {
  onFileUpload: (file: File) => Promise<void>;
  acceptedTypes?: string[];
  maxSize?: number; // in bytes
  className?: string;
  disabled?: boolean;
}

export default function FileUpload({ 
  onFileUpload, 
  acceptedTypes = ['.pdf', '.txt', '.doc', '.docx'], 
  maxSize = 10 * 1024 * 1024, // 10MB
  className,
  disabled = false
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelection = useCallback(async (file: File) => {
    // Validate file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedTypes.includes(fileExtension)) {
      alert(`File type ${fileExtension} is not supported. Please upload: ${acceptedTypes.join(', ')}`);
      return;
    }

    // Validate file size
    if (file.size > maxSize) {
      alert(`File size too large. Maximum size is ${Math.round(maxSize / (1024 * 1024))}MB`);
      return;
    }

    // Create uploaded file entry
    const uploadedFile: UploadedFile = {
      id: Date.now().toString(),
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading',
      progress: 0
    };

    setUploadedFiles(prev => [...prev, uploadedFile]);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadedFiles(prev => prev.map(f => 
          f.id === uploadedFile.id 
            ? { ...f, progress: Math.min(f.progress + 10, 90) }
            : f
        ));
      }, 200);

      // Call the upload handler
      await onFileUpload(file);

      clearInterval(progressInterval);
      
      // Mark as processing
      setUploadedFiles(prev => prev.map(f => 
        f.id === uploadedFile.id 
          ? { ...f, status: 'processing', progress: 100 }
          : f
      ));

    } catch (error) {
      setUploadedFiles(prev => prev.map(f => 
        f.id === uploadedFile.id 
          ? { 
              ...f, 
              status: 'error', 
              progress: 0,
              errorMessage: error instanceof Error ? error.message : 'Upload failed'
            }
          : f
      ));
    }
  }, [acceptedTypes, maxSize, onFileUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => handleFileSelection(file));
  }, [disabled, handleFileSelection]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(handleFileSelection);
  }, [handleFileSelection]);

  const removeFile = useCallback((fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);



  return (
    <div className={clsx('w-full', className)}>
      {/* Upload Area */}
      <motion.div
        className={clsx(
          'relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200',
          isDragging 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        whileHover={!disabled ? { scale: 1.01 } : {}}
        whileTap={!disabled ? { scale: 0.99 } : {}}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />

        <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-gray-900">
            {isDragging ? 'Drop your files here' : 'Upload medical documents'}
          </h3>
          <p className="text-sm text-gray-600">
            Drag and drop your files here, or{' '}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-600 hover:text-blue-500 font-medium"
              disabled={disabled}
            >
              browse
            </button>
          </p>
          <p className="text-xs text-gray-500">
            Supported formats: {acceptedTypes.join(', ')} • Max size: {Math.round(maxSize / (1024 * 1024))}MB
          </p>
        </div>

        {/* Drag overlay */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-blue-50 bg-opacity-90 rounded-lg flex items-center justify-center"
            >
              <div className="text-blue-600 font-medium">Drop files here</div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Uploaded Files */}
      <AnimatePresence>
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6"
          >
            <h4 className="text-sm font-medium text-gray-900 mb-3">Uploaded Files</h4>
            <div className="space-y-3">
              {uploadedFiles.map((file) => (
                <FileCard key={file.id} file={file} onRemove={removeFile} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface FileCardProps {
  file: UploadedFile;
  onRemove: (fileId: string) => void;
}

function FileCard({ file, onRemove }: FileCardProps) {
  const statusConfig = {
    uploading: {
      icon: CloudArrowUpIcon,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    processing: {
      icon: DocumentTextIcon,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    },
    completed: {
      icon: CheckCircleIcon,
      color: 'text-eligible-500',
      bgColor: 'bg-eligible-50',
      borderColor: 'border-eligible-200'
    },
    error: {
      icon: ExclamationTriangleIcon,
      color: 'text-ineligible-500',
      bgColor: 'bg-ineligible-50',
      borderColor: 'border-ineligible-200'
    }
  };

  const config = statusConfig[file.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={clsx(
        'flex items-center gap-3 p-4 rounded-lg border',
        config.bgColor,
        config.borderColor
      )}
    >
      <config.icon className={clsx('w-5 h-5 flex-shrink-0', config.color)} />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
          <button
            onClick={() => onRemove(file.id)}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>{formatFileSize(file.size)}</span>
          <span className="capitalize">{file.status}</span>
        </div>

        {/* Progress Bar */}
        {(file.status === 'uploading' || file.status === 'processing') && (
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <motion.div
                className={clsx(
                  'h-1.5 rounded-full',
                  file.status === 'uploading' ? 'bg-blue-500' : 'bg-yellow-500'
                )}
                initial={{ width: 0 }}
                animate={{ width: `${file.progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

        {/* Error Message */}
        {file.status === 'error' && file.errorMessage && (
          <p className="mt-1 text-xs text-ineligible-600">{file.errorMessage}</p>
        )}
      </div>
    </motion.div>
  );
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 