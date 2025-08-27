/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, ChatState } from '../types';
import ChatMessageComponent from './ChatMessage';
import ChatInput from './ChatInput';
import ReferenceImageUpload from './ReferenceImageUpload';

interface ChatModeProps {
  onGenerateImage: (prompt: string, referenceImages: File[]) => Promise<string>;
  isLoading: boolean;
}

const ChatMode: React.FC<ChatModeProps> = ({ onGenerateImage, isLoading }) => {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isGenerating: false,
    referenceImages: []
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatState.messages]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    // Create user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content,
      images: chatState.referenceImages.length > 0 ? [...chatState.referenceImages] : undefined,
      timestamp: new Date()
    };

    // Add user message to chat
    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isGenerating: true
    }));

    try {
      // Generate AI response
      const resultImageUrl = await onGenerateImage(content, chatState.referenceImages);
      
      // Create AI response message
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: '已为您生成图像',
        resultImage: resultImageUrl,
        timestamp: new Date()
      };

      // Add AI message to chat
      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, aiMessage],
        isGenerating: false
      }));

    } catch (error) {
      // Add error message
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `生成失败: ${error instanceof Error ? error.message : '未知错误'}`,
        timestamp: new Date()
      };

      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage],
        isGenerating: false
      }));
    }
  };

  const handleReferenceImagesChange = (images: File[]) => {
    setChatState(prev => ({
      ...prev,
      referenceImages: images
    }));
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col h-[70vh] animate-fade-in">
      {/* Reference Images Upload */}
      <div className="mb-4">
        <ReferenceImageUpload
          images={chatState.referenceImages}
          onChange={handleReferenceImagesChange}
          disabled={isLoading || chatState.isGenerating}
        />
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 overflow-y-auto bg-gray-800/30 border border-gray-700 rounded-lg p-4 space-y-4 mb-4">
        {chatState.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-lg">开始对话式图像生成</p>
              <p className="text-sm mt-2">上传参考图片，描述您想要的效果</p>
            </div>
          </div>
        ) : (
          <>
            {chatState.messages.map((message) => (
              <ChatMessageComponent
                key={message.id}
                message={message}
              />
            ))}
            {chatState.isGenerating && (
              <div className="flex justify-start">
                <div className="bg-gray-700/50 rounded-lg p-4 max-w-xs">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                    <span className="text-gray-300 text-sm">AI正在生成图像...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Chat Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        disabled={isLoading || chatState.isGenerating}
        placeholder="描述您想要生成的图像..."
      />
    </div>
  );
};

export default ChatMode;