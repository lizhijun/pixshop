# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm install` - Install dependencies
- `npm run dev` - Start development server (Vite)
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## Environment Setup

Set API keys in `.env.local` for AI image generation functionality:
- `REPLICATE_API_TOKEN` - Primary provider via Replicate
- `OPENROUTER_API_KEY` - Fallback provider via OpenRouter proxy
- `GEMINI_API_KEY` - Legacy support (backwards compatibility)

## Architecture Overview

**Pixshop** is a React + TypeScript AI-powered photo editor built with Vite. The app uses multiple AI providers with automatic fallback: Replicate (primary) and OpenRouter (fallback) for reliable image generation.

### Core Architecture

- **Single-page React app** (`App.tsx`) managing all state and UI
- **History-based editing** - maintains undo/redo stack of File objects
- **Five editing modes**: Retouch (localized edits), Crop, Adjust (global), Filters, Chat (image generation)
- **AI service layer** (`services/geminiService.ts`) handles multi-provider AI requests with automatic fallback

### Key Components Structure

- `App.tsx` - Main application logic with image history management
- `services/geminiService.ts` - Multi-provider AI image generation service (Replicate + OpenRouter)
- `components/` - UI components for different editing panels and tools
  - `StartScreen.tsx` - Initial upload interface with prompt templates
  - `ChatMode.tsx` - Conversational image generation interface
  - `*Panel.tsx` files - Tool-specific editing interfaces (Filter, Adjustment, Crop)
  - `Header.tsx`, `Spinner.tsx`, `icons.tsx` - Shared UI components
- `types.ts` - TypeScript type definitions for chat functionality

### Data Flow

1. User uploads image → added to history array at index 0
2. User makes edits → new File objects added to history 
3. Undo/redo navigates through history indices without mutating array
4. AI operations convert File → base64 → try Replicate → fallback to OpenRouter → receive result → convert to File
5. Chat mode supports multi-image input and conversational generation

### Key Technical Details

- Uses `react-image-crop` for crop functionality
- Image state managed via object URLs with proper cleanup
- Hotspot-based editing for localized AI modifications (retouch mode)
- TypeScript path aliases configured (`@/*` maps to project root)
- Vite proxy configuration for Replicate API to avoid CORS issues
- Multi-provider architecture with graceful fallback handling
- Chat interface supports multiple reference images and conversational workflow

### AI Safety Implementation

The codebase includes comprehensive safety policies in AI prompts:
- Skin tone adjustments are allowed as standard photo enhancements
- Race/ethnicity changes are explicitly prohibited
- Safe-for-work content enforcement in chat mode
- Privacy protection against replicating identifiable people

## File Organization

- Root: Main app files (App.tsx, types.ts, configs)
- `components/` - All React components
- `services/` - External API integrations (Gemini)