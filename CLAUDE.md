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
- **Four editing modes**: Retouch (localized edits), Crop, Adjust (global), Filters
- **AI service layer** (`services/geminiService.ts`) handles multi-provider AI requests with automatic fallback

### Key Components Structure

- `App.tsx` - Main application logic with image history management
- `services/geminiService.ts` - Multi-provider AI image generation service (Replicate + OpenRouter)
- `components/` - UI components for different editing panels and tools
- `types.ts` - TypeScript type definitions (currently minimal)

### Data Flow

1. User uploads image → added to history array at index 0
2. User makes edits → new File objects added to history 
3. Undo/redo navigates through history indices without mutating array
4. AI operations convert File → base64 → try Replicate → fallback to OpenRouter → receive result → convert to File

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