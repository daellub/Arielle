# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Arielle is a multi-modal AI assistant built with Electron, featuring:
- **ASR (Automatic Speech Recognition)** with multiple model support (Whisper OpenVino, Azure)
- **Translation** capabilities 
- **LLM (Large Language Model)** integration for conversational AI
- **TTS (Text-to-Speech)** functionality
- **VRM (Virtual Reality Model)** avatar with 3D animation and expression system
- **Real-time WebSocket communication** between frontend and backend services

## Architecture

The project follows a multi-tier architecture:

### Frontend (Electron + Next.js)
- **Electron main process** (`main/main.js`) - Window management, IPC handlers, waits for Next.js dev server
- **Next.js renderer** (`renderer/`) - React-based UI with TypeScript, Tailwind CSS, Zustand state management
- **VRM viewer** (`vrm/`) - Separate Three.js application for 3D avatar rendering

### Backend (FastAPI + Python)
- **FastAPI application** (`backend/main.py`) - REST API and WebSocket server
- **Modular services**: ASR, Translation, LLM, each with their own routers and database integration
- **Socket.IO integration** for real-time communication
- **SQLite database** for model management, logs, and interaction history

### Key Data Flow
1. Audio input → ASR service → transcription → Translation (optional) → LLM processing → TTS → VRM expression/animation
2. Real-time communication via WebSockets between all components
3. State management through Zustand stores in frontend, database persistence in backend

## Development Commands

### Full Application Development
```pwsh
# Start both renderer and electron processes concurrently
npm run dev

# Start individual components
npm run dev:renderer    # Next.js development server (port 3000)
npm run dev:electron     # Electron main process (waits for Next.js)
npm run dev:vrm          # VRM standalone viewer (port 5173)
```

### Frontend Development
```pwsh
# Navigate to renderer and start Next.js
cd renderer
npm run dev              # Development server
npm run build           # Production build  
npm run start           # Start production build
npm run lint            # ESLint checking
```

### Backend Development
```pwsh
# Backend server must be started manually - no script provided
cd backend
python main.py          # Assuming uvicorn configuration in main.py
```

### VRM Development
```pwsh
# Standalone VRM viewer development
cd vrm
# Development server starts on port 5173 via vite
```

## Project Structure

### Critical Frontend Components
- **AppContainer.tsx** - Main application shell with tab-based navigation and animated transitions
- **Tab Management** - HomePage, ASRPage, TranslatePage, LLMPage, TTSPage, VRMPage
- **State Management** - Zustand stores for tabs, notifications, recording status
- **UI Components** - Custom components using Radix UI primitives and Tailwind

### Backend Service Architecture
- **ASR Service** - Model registration, loading/unloading, WebSocket inference, result persistence
- **LLM Service** - Chat completions, emotion analysis, math evaluation, tool integration
- **Translation Service** - Language detection and translation with result caching
- **Database Layer** - SQLite with connection management for models, logs, interactions

### VRM Integration
- **Three.js Scene** - Camera controls, lighting setup, model positioning
- **Animation System** - VRMA animation clips with mixer, expression blending
- **Real-time Updates** - Expression changes based on LLM emotional analysis

## Development Notes

### Electron Configuration
- Main process waits for Next.js dev server (localhost:3000) using `wait-on`
- Preload script enables secure IPC communication
- Dev tools automatically open in detached mode during development

### State Management Patterns
- Frontend uses Zustand for reactive state management
- Backend maintains WebSocket connections for real-time updates
- Database persistence for all user interactions and model states

### Model Management
- ASR models support both local (OpenVino) and cloud (Azure) inference
- Dynamic model loading/unloading with memory management
- WebSocket-based real-time transcription pipeline

### VRM System
- Models expect specific blendShape naming conventions
- Animation tracks filtered to prevent position conflicts
- Expression presets stored as JSON configurations (F1-F4 hotkeys for testing)

### WebSocket Architecture
- Multiple WebSocket endpoints for different services (ASR, LLM, VRM)
- Socket.IO for general communication, native WebSockets for model inference
- Real-time coordination between audio processing and visual feedback

## Technology Stack

**Frontend**: Electron, Next.js 15, React 19, TypeScript, Tailwind CSS, Framer Motion, Zustand
**Backend**: FastAPI, Socket.IO, SQLite, OpenVino, Azure Cognitive Services  
**3D/VRM**: Three.js, @pixiv/three-vrm, VRM Animation support
**Audio Processing**: Web Audio API, Voice Activity Detection, Real-time streaming

## Database Schema
The application uses SQLite with tables for:
- Model registration and status tracking
- ASR transcription results and logs  
- LLM conversation history and feedback
- Translation cache and language pairs
