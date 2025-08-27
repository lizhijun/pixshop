/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { ChatMessage } from '../types';

interface ChatMessageComponentProps {
  message: ChatMessage;
}

const ChatMessageComponent: React.FC<ChatMessageComponentProps> = ({ message }) => {
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);

  // Create object URLs for reference images
  useEffect(() => {
    if (message.images && message.images.length > 0) {
      const urls = message.images.map(file => URL.createObjectURL(file));
      setImageUrls(urls);
      
      // Cleanup function to revoke URLs
      return () => {
        urls.forEach(url => URL.revokeObjectURL(url));
      };
    }
  }, [message.images]);

  // Handle result image URL
  useEffect(() => {
    if (message.resultImage) {
      setResultImageUrl(message.resultImage);
    }
  }, [message.resultImage]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const isUser = message.type === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      <div className={`max-w-[70%] ${isUser ? 'order-2' : 'order-1'}`}>
        {/* Message bubble */}
        <div
          className={`rounded-lg p-4 ${
            isUser
              ? 'bg-blue-600 text-white ml-auto'
              : 'bg-gray-700/50 text-gray-200'
          }`}
        >
          {/* Reference images (for user messages) */}
          {imageUrls.length > 0 && (
            <div className="mb-3">
              <div className="grid grid-cols-2 gap-2 mb-2">
                {imageUrls.map((url, index) => (
                  <div key={index} className="relative">
                    <img
                      src={url}
                      alt={`Reference ${index + 1}`}
                      className="w-full h-20 object-cover rounded-lg border border-gray-600"
                    />
                  </div>
                ))}
              </div>
              <div className="text-xs opacity-75 mb-2">
                参考图片 ({imageUrls.length} 张)
              </div>
            </div>
          )}

          {/* Message content */}
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {message.content}
          </div>

          {/* Result image (for AI messages) */}
          {resultImageUrl && (
            <div className="mt-3">
              <div className="relative bg-gray-800 rounded-lg overflow-hidden">
                <img
                  src={resultImageUrl}
                  alt="Generated result"
                  className="w-full max-w-sm rounded-lg"
                  onLoad={() => {
                    // Scroll to show the new image
                    setTimeout(() => {
                      const element = document.getElementById(`message-${message.id}`);
                      element?.scrollIntoView({ behavior: 'smooth', block: 'end' });
                    }, 100);
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {formatTime(message.timestamp)}
        </div>
      </div>

      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
        isUser 
          ? 'bg-blue-600 text-white order-1 mr-3' 
          : 'bg-gray-600 text-gray-200 order-2 ml-3'
      }`}>
        {isUser ? '我' : 'AI'}
      </div>
    </div>
  );
};

export default ChatMessageComponent;