/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// Chat mode types
export interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  images?: File[];
  resultImage?: string;
  timestamp: Date;
  isGenerating?: boolean;
}

export interface ChatState {
  messages: ChatMessage[];
  isGenerating: boolean;
  referenceImages: File[];
}
