/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { UploadIcon, MagicWandIcon, PaletteIcon, SunIcon } from './icons';

interface StartScreenProps {
  onFileSelect: (files: FileList | null) => void;
  onPromptSelect?: (prompt: string, mode: 'retouch' | 'filter' | 'adjust') => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onFileSelect, onPromptSelect }) => {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedMode, setSelectedMode] = useState<'retouch' | 'filter' | 'adjust'>('retouch');

  // Recommended prompts organized by category
  const promptCategories = {
    retouch: [
      { name: '美白肌肤', prompt: '美白皮肤，让肌肤看起来更加光滑白皙' },
      { name: '去除痘痘', prompt: '去除脸部的痘痘和瑕疵，让皮肤更加干净' },
      { name: '美化妆容', prompt: '增强妆容效果，让眼妆和唇妆更加精致' },
      { name: '修饰身材', prompt: '适度优化身材线条，让身形更加协调' }
    ],
    filter: [
      { name: '复古胶片', prompt: '应用复古胶片滤镜，带有颗粒感和温暖色调' },
      { name: '赛博朋克', prompt: '应用赛博朋克风格滤镜，带有霓虹灯效果和未来感' },
      { name: '水彩画风', prompt: '将图像转换为水彩画风格，带有柔和的笔触效果' },
      { name: '素描效果', prompt: '将图像转换为素描风格，保留主要线条和阴影' }
    ],
    adjust: [
      { name: '背景虚化', prompt: '应用景深效果，让背景模糊突出主体' },
      { name: '工作室打光', prompt: '添加专业的工作室灯光效果' },
      { name: '暖色调', prompt: '调整图像为温暖的金色调，营造温馨氛围' },
      { name: '黑白艺术', prompt: '转换为高对比度的黑白艺术效果' }
    ]
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Pass selected prompt to parent if available
    const activePrompt = selectedPreset || customPrompt;
    if (activePrompt && onPromptSelect) {
      onPromptSelect(activePrompt, selectedMode);
    }
    onFileSelect(e.target.files);
  };

  const handleFileSelectWithPrompt = (files: FileList | null) => {
    // Pass selected prompt to parent if available
    const activePrompt = selectedPreset || customPrompt;
    if (activePrompt && onPromptSelect) {
      onPromptSelect(activePrompt, selectedMode);
    }
    onFileSelect(files);
  };

  const handlePresetClick = (prompt: string) => {
    setSelectedPreset(prompt);
    setCustomPrompt('');
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomPrompt(e.target.value);
    setSelectedPreset(null);
  };

  const activePrompt = selectedPreset || customPrompt;

  return (
    <div 
      className={`w-full max-w-5xl mx-auto text-center p-8 transition-all duration-300 rounded-2xl border-2 ${isDraggingOver ? 'bg-blue-500/10 border-dashed border-blue-400' : 'border-transparent'}`}
      onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDraggingOver(false);
        handleFileSelectWithPrompt(e.dataTransfer.files);
      }}
    >
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-100 sm:text-6xl md:text-7xl">
          AI-Powered Photo Editing, <span className="text-blue-400">Simplified</span>.
        </h1>
        <p className="max-w-2xl text-lg text-gray-400 md:text-xl">
          Retouch photos, apply creative filters, or make professional adjustments using simple text prompts. No complex tools needed.
        </p>

        <div className="mt-6 flex flex-col items-center gap-4">
            <label htmlFor="image-upload-start" className="relative inline-flex items-center justify-center px-10 py-5 text-xl font-bold text-white bg-blue-600 rounded-full cursor-pointer group hover:bg-blue-500 transition-colors">
                <UploadIcon className="w-6 h-6 mr-3 transition-transform duration-500 ease-in-out group-hover:rotate-[360deg] group-hover:scale-110" />
                Upload an Image
            </label>
            <input id="image-upload-start" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            <p className="text-sm text-gray-500">or drag and drop a file</p>
        </div>

        {/* Prompt Selection Section */}
        <div className="mt-12 w-full max-w-4xl">
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 backdrop-blur-sm">
            <h3 className="text-2xl font-bold text-gray-100 mb-6">选择你的编辑目标</h3>
            
            {/* Mode Selection */}
            <div className="flex justify-center gap-2 mb-6">
              {(['retouch', 'filter', 'adjust'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    setSelectedMode(mode);
                    setSelectedPreset(null);
                    setCustomPrompt('');
                  }}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                    selectedMode === mode
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                  }`}
                >
                  {mode === 'retouch' && '精修'}
                  {mode === 'filter' && '滤镜'}
                  {mode === 'adjust' && '调整'}
                </button>
              ))}
            </div>

            {/* Preset Prompts */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {promptCategories[selectedMode].map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handlePresetClick(preset.prompt)}
                  className={`text-center bg-white/10 border border-transparent text-gray-200 font-semibold py-3 px-4 rounded-lg transition-all duration-200 ease-in-out hover:bg-white/20 hover:border-white/20 active:scale-95 text-sm ${
                    selectedPreset === preset.prompt 
                      ? 'ring-2 ring-blue-500 bg-blue-500/20' 
                      : ''
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>

            {/* Custom Prompt Input */}
            <div className="flex flex-col gap-4">
              <input
                type="text"
                value={customPrompt}
                onChange={handleCustomChange}
                placeholder="或者输入自定义描述..."
                className="w-full bg-gray-800 border border-gray-600 text-gray-200 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-base"
              />
              
              {activePrompt && (
                <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4 animate-fade-in">
                  <p className="text-blue-200 text-sm">
                    <span className="font-semibold">已选择:</span> {selectedPreset ? '推荐提示词' : '自定义提示词'}
                  </p>
                  <p className="text-blue-100 text-base mt-2 italic">"{activePrompt}"</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-16 w-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-black/20 p-6 rounded-lg border border-gray-700/50 flex flex-col items-center text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-gray-700 rounded-full mb-4">
                       <MagicWandIcon className="w-6 h-6 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-100">Precise Retouching</h3>
                    <p className="mt-2 text-gray-400">Click any point on your image to remove blemishes, change colors, or add elements with pinpoint accuracy.</p>
                </div>
                <div className="bg-black/20 p-6 rounded-lg border border-gray-700/50 flex flex-col items-center text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-gray-700 rounded-full mb-4">
                       <PaletteIcon className="w-6 h-6 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-100">Creative Filters</h3>
                    <p className="mt-2 text-gray-400">Transform photos with artistic styles. From vintage looks to futuristic glows, find or create the perfect filter.</p>
                </div>
                <div className="bg-black/20 p-6 rounded-lg border border-gray-700/50 flex flex-col items-center text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-gray-700 rounded-full mb-4">
                       <SunIcon className="w-6 h-6 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-100">Pro Adjustments</h3>
                    <p className="mt-2 text-gray-400">Enhance lighting, blur backgrounds, or change the mood. Get studio-quality results without complex tools.</p>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default StartScreen;
