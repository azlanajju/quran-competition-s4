'use client';

import { useState, useRef, useEffect } from 'react';

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  maxSize?: number; // in bytes
  acceptedFormats?: string[];
  label?: string;
  acceptLabel?: string;
  value?: File | null; // Controlled value
}

export default function FileUpload({ 
  onFileSelect,
  maxSize = 5 * 1024 * 1024, // Default 5MB
  acceptedFormats = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
  label = "ID Card Proof",
  acceptLabel,
  value
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset when value prop changes to null (controlled component)
  useEffect(() => {
    if (value === null) {
      // Clear internal state when parent resets
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setSelectedFile(null);
      setPreviewUrl(null);
      setError('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else if (value && value !== selectedFile) {
      // Sync with external value
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setSelectedFile(value);
      if (value.type.startsWith('image/')) {
        const url = URL.createObjectURL(value);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');

    // Validate file type
    if (!acceptedFormats.includes(file.type)) {
      setError(`Invalid file type. Please upload: ${acceptedFormats.map(f => {
        if (f.startsWith('image/')) return f.split('/')[1].toUpperCase();
        if (f === 'application/pdf') return 'PDF';
        return f;
      }).join(', ')}`);
      return;
    }

    // Validate file size
    if (file.size > maxSize) {
      setError(`File size exceeds ${(maxSize / (1024 * 1024)).toFixed(0)}MB limit`);
      return;
    }

    setSelectedFile(file);
    onFileSelect(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleRemove = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onFileSelect(null);
  };

  const formatLabel = acceptLabel || acceptedFormats.map(f => {
    if (f.startsWith('image/')) return f.split('/')[1].toUpperCase();
    if (f === 'application/pdf') return 'PDF';
    return f;
  }).join(', ');

  return (
    <div className="space-y-4">
      {/* Only show upload area if no file is selected */}
      {!selectedFile && (
        <div className="flex items-center justify-center w-full">
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center w-full h-48 border-2 border-[#C9A24D] border-dashed rounded-lg cursor-pointer bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors gold-border"
          >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <svg
              className="w-10 h-10 mb-3 text-[#D4AF37]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="mb-2 text-sm text-[#FFFFFF]">
              <span className="font-semibold text-[#D4AF37]">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-[#C7D1E0]">
              {formatLabel} (MAX. {(maxSize / (1024 * 1024)).toFixed(0)}MB)
            </p>
          </div>
          <input
            ref={fileInputRef}
            id="file-upload"
            type="file"
            className="hidden"
            accept={acceptedFormats.join(',')}
            onChange={handleFileSelect}
          />
        </label>
        </div>
      )}

      {previewUrl && selectedFile && (
        <div className="space-y-2">
          <div className="relative">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full rounded-lg max-h-64 object-contain bg-white/5"
            />
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
              aria-label="Remove file"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="text-sm text-[#FFFFFF]">
            <p className="font-medium">File: <span className="text-[#D4AF37]">{selectedFile.name}</span></p>
            <p>Size: <span className="text-[#D4AF37]">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span></p>
          </div>
        </div>
      )}

      {selectedFile && !previewUrl && (
        <div className="space-y-2">
          <div className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm border border-[#C9A24D] rounded-lg">
            <div className="flex items-center gap-3">
              <svg
                className="w-8 h-8 text-[#D4AF37]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              <div>
                <p className="font-medium text-[#FFFFFF]">{selectedFile.name}</p>
                <p className="text-xs text-[#C7D1E0]">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            </div>
            <button
              onClick={handleRemove}
              className="text-red-400 hover:text-red-300 transition-colors"
              aria-label="Remove file"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-500/20 backdrop-blur-sm border-2 border-red-400 rounded-lg">
          <p className="text-sm text-red-100">{error}</p>
        </div>
      )}
    </div>
  );
}

