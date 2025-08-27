# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm install` - Install dependencies
- `npm run dev` - Start development server (Vite)
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## Environment Setup

Set `OPENROUTER_API_KEY` in `.env.local` for AI image generation functionality via OpenRouter proxy. Alternatively, `GEMINI_API_KEY` can still be used for backwards compatibility.

## Architecture Overview

**Pixshop** is a React + TypeScript AI-powered photo editor built with Vite. The app uses Google's Gemini AI via OpenRouter proxy for image generation and editing.

### Core Architecture

- **Single-page React app** (`App.tsx`) managing all state and UI
- **History-based editing** - maintains undo/redo stack of File objects
- **Four editing modes**: Retouch (localized edits), Crop, Adjust (global), Filters
- **AI service layer** (`services/geminiService.ts`) handles all OpenRouter API interactions with Gemini model

### Key Components Structure

- `App.tsx` - Main application logic with image history management
- `services/geminiService.ts` - AI image generation service using OpenRouter API
- `components/` - UI components for different editing panels and tools
- `types.ts` - TypeScript type definitions (currently minimal)

### Data Flow

1. User uploads image → added to history array at index 0
2. User makes edits → new File objects added to history 
3. Undo/redo navigates through history indices without mutating array
4. AI operations convert File → base64 → send to OpenRouter/Gemini → receive base64 → convert to File

### Key Technical Details

- Uses `react-image-crop` for crop functionality
- Image state managed via object URLs with proper cleanup
- Hotspot-based editing for localized AI modifications
- TypeScript path aliases configured (`@/*` maps to project root)
- Gemini model: `gemini-2.5-flash-image-preview`

### AI Safety Implementation

The codebase includes specific safety policies in AI prompts to handle sensitive content appropriately, particularly around skin tone adjustments vs. racial/ethnic changes.

## File Organization

- Root: Main app files (App.tsx, types.ts, configs)
- `components/` - All React components
- `services/` - External API integrations (Gemini)