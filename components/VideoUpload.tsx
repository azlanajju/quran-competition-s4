'use client';

import { useState, useRef, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

interface VideoUploadProps {
  onVideoSelect: (file: File) => void;
  onCompressionStateChange?: (isCompressing: boolean) => void;
  maxSize?: number; // in bytes
  acceptedFormats?: string[];
}

export default function VideoUpload({ 
  onVideoSelect,
  onCompressionStateChange,
  maxSize = 100 * 1024 * 1024, // Default 100MB
  acceptedFormats = ['video/mp4', 'video/webm', 'video/quicktime']
}: VideoUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [error, setError] = useState<string>('');
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);

  // Load FFmpeg.wasm
  useEffect(() => {
    const loadFFmpeg = async () => {
      try {
        const ffmpeg = new FFmpeg();
        ffmpegRef.current = ffmpeg;

        ffmpeg.on('log', ({ message }) => {
          console.log('FFmpeg:', message);
        });

        ffmpeg.on('progress', ({ progress }) => {
          setCompressionProgress(Math.round(progress * 100));
        });

        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });

        setFfmpegLoaded(true);
      } catch (err) {
        console.error('Failed to load FFmpeg:', err);
        setError('Failed to initialize video processor. Please refresh the page.');
      }
    };

    loadFFmpeg();
  }, []);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');

    // Validate file type
    if (!acceptedFormats.includes(file.type)) {
      setError(`Invalid file type. Please upload: ${acceptedFormats.join(', ')}`);
      return;
    }

    // Validate file size
    if (file.size > maxSize) {
      setError(`File size exceeds ${(maxSize / (1024 * 1024)).toFixed(0)}MB limit`);
      return;
    }

    setSelectedFile(file);

    // Create preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Compress video
    if (ffmpegLoaded && ffmpegRef.current) {
      await compressVideo(file);
    } else {
      // If FFmpeg not loaded yet, use original file
      onVideoSelect(file);
    }
  };

  const compressVideo = async (file: File) => {
    if (!ffmpegRef.current) {
      onVideoSelect(file);
      return;
    }

    setIsCompressing(true);
    setCompressionProgress(0);
    onCompressionStateChange?.(true);

    try {
      const ffmpeg = ffmpegRef.current;
      const inputFileName = 'input.mp4';
      const outputFileName = 'output.mp4';

      // Write input file to FFmpeg virtual file system
      await ffmpeg.writeFile(inputFileName, await fetchFile(file));

      // Compress video with optimized settings
      // Using H.264 codec with CRF 28 for good quality/size balance
      await ffmpeg.exec([
        '-i', inputFileName,
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '28',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart',
        '-vf', 'scale=1280:-2', // Scale to max width 1280px, maintain aspect ratio
        outputFileName,
      ]);

      // Read compressed file
      const data = await ffmpeg.readFile(outputFileName);
      const compressedBlob = new Blob([data], { type: 'video/mp4' });
      
      // Create compressed File object
      const compressedFile = new File(
        [compressedBlob],
        file.name.replace(/\.[^/.]+$/, '') + '_compressed.mp4',
        { type: 'video/mp4' }
      );

      // Clean up
      await ffmpeg.deleteFile(inputFileName);
      await ffmpeg.deleteFile(outputFileName);

      setSelectedFile(compressedFile);
      onVideoSelect(compressedFile);
      
      // Update preview with compressed video
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      const newPreviewUrl = URL.createObjectURL(compressedBlob);
      setPreviewUrl(newPreviewUrl);

      setError('');
    } catch (err) {
      console.error('Compression error:', err);
      setError('Failed to compress video. Using original file.');
      onVideoSelect(file);
    } finally {
      setIsCompressing(false);
      setCompressionProgress(0);
      onCompressionStateChange?.(false);
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
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center w-full">
        <label
          htmlFor="video-upload"
          className="flex flex-col items-center justify-center w-full h-64 border-2 border-[#C9A24D] border-dashed rounded-lg cursor-pointer bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors gold-border"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <svg
              className="w-12 h-12 mb-3 text-[#D4AF37]"
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
              {acceptedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')} (MAX. {(maxSize / (1024 * 1024)).toFixed(0)}MB)
            </p>
          </div>
          <input
            ref={fileInputRef}
            id="video-upload"
            type="file"
            className="hidden"
            accept={acceptedFormats.join(',')}
            onChange={handleFileSelect}
            disabled={isCompressing}
          />
        </label>
      </div>

      {isCompressing && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-[#FFFFFF]">
            <span>Compressing video...</span>
            <span className="text-[#D4AF37] font-semibold">{compressionProgress}%</span>
          </div>
          <div className="w-full bg-white/20 backdrop-blur-sm rounded-full h-3">
            <div
              className="bg-gradient-to-r from-[#D4AF37] to-[#F2D27A] h-3 rounded-full transition-all duration-300 shadow-lg"
              style={{ width: `${compressionProgress}%` }}
            />
          </div>
        </div>
      )}

      {previewUrl && selectedFile && !isCompressing && (
        <div className="space-y-2">
          <div className="relative">
            <video
              src={previewUrl}
              controls
              className="w-full rounded-lg"
              style={{ maxHeight: '400px' }}
            />
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
              aria-label="Remove video"
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

      {error && (
        <div className="p-3 bg-red-500/20 backdrop-blur-sm border-2 border-red-400 rounded-lg">
          <p className="text-sm text-red-100">{error}</p>
        </div>
      )}
    </div>
  );
}

