/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { UploadIcon } from './icons';

interface ReferenceImageUploadProps {
  images: File[];
  onChange: (images: File[]) => void;
  disabled?: boolean;
  maxImages?: number;
}

const ReferenceImageUpload: React.FC<ReferenceImageUploadProps> = ({ 
  images, 
  onChange, 
  disabled = false, 
  maxImages = 3 
}) => {
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Create object URLs for preview
  useEffect(() => {
    const urls = images.map(file => URL.createObjectURL(file));
    setImageUrls(urls);
    
    // Cleanup function to revoke URLs
    return () => {
      urls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [images]);

  const handleFileSelect = (files: FileList | null) => {
    if (!files || disabled) return;

    const newFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/')
    );

    if (newFiles.length === 0) return;

    const updatedImages = [...images, ...newFiles].slice(0, maxImages);
    onChange(updatedImages);
  };

  const handleRemoveImage = (index: number) => {
    if (disabled) return;
    
    const updatedImages = images.filter((_, i) => i !== index);
    onChange(updatedImages);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (!disabled) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-medium text-gray-300">参考图片</h3>
        <span className="text-xs text-gray-500">({images.length}/{maxImages})</span>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        {imageUrls.map((url, index) => (
          <div key={index} className="relative group">
            <div className="aspect-square bg-gray-800 rounded-lg overflow-hidden border border-gray-600">
              <img
                src={url}
                alt={`Reference ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {!disabled && (
                <button
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove image"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Upload slots */}
        {images.length < maxImages && (
          <div
            className={`aspect-square border-2 border-dashed rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
              isDragging
                ? 'border-blue-400 bg-blue-500/10'
                : disabled
                ? 'border-gray-600 bg-gray-800/50 cursor-not-allowed'
                : 'border-gray-600 bg-gray-800/30 hover:border-gray-500 hover:bg-gray-800/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => {
              if (!disabled) {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.multiple = true;
                input.onchange = (e) => {
                  const target = e.target as HTMLInputElement;
                  handleFileSelect(target.files);
                };
                input.click();
              }
            }}
          >
            <div className="text-center">
              <UploadIcon className={`w-6 h-6 mx-auto mb-2 ${disabled ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`text-xs ${disabled ? 'text-gray-600' : 'text-gray-400'}`}>
                {isDragging ? '释放上传' : '点击或拖拽'}
              </p>
            </div>
          </div>
        )}
      </div>

      {images.length === 0 && (
        <p className="text-xs text-gray-500 text-center">
          添加参考图片可以帮助AI更好地理解您的需求（可选）
        </p>
      )}
    </div>
  );
};

export default ReferenceImageUpload;