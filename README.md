# Japanese Translator

A modern AI-powered Japanese to English translation application built with Next.js and multi-provider AI orchestration.

## 🎯 Overview

This project demonstrates an **agentic AI framework** that intelligently routes translation and language processing tasks across multiple AI providers:

- **Claude (Anthropic)** - Advanced reasoning and complex translations
- **NVIDIA Build** - Fast, free-tier inference
- **OpenAI (GPT)** - General-purpose translation and NLP
- **Google Gemini** - Multimodal translation with image support

The global orchestrator automatically selects the optimal provider based on task requirements, cost, and performance.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- API keys from at least one AI provider

### 1. Setup Environment

```bash
# Clone and navigate
cd e:\Learning Japanese - v2\japanese-translator

# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local
```

### 2. Add API Keys

Edit `.env.local`:
```
CLAUDE_API_KEY=your_claude_key
NVIDIA_API_KEY=your_nvidia_key
OPENAI_API_KEY=your_openai_key
GOOGLE_GEMINI_API_KEY=your_gemini_key
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

- **`.AI-Agents/`** - AI agent skills and orchestration
  - **`.claude/`** - Anthropic Claude AI agent
  - **`.nvidia/`** - NVIDIA Build AI models
  - **`.openai/`** - OpenAI models
  - **`.gemini/`** - Google Gemini AI
  - See [.AI-Agents documentation](./.AI-Agents/README.md) for consolidated provider overview

- **`app/`** - Next.js application
- **`components/`** - React components
- **`lib/`** - Utility functions
- **`public/`** - Static assets

## 💡 How It Works

1. **User Input** - Submit Japanese text for translation
2. **Global Orchestrator** - Analyzes task requirements
3. **Provider Selection** - Routes to optimal AI provider
4. **Processing** - AI provider generates translation
5. **Result Aggregation** - Consolidates and validates output
6. **Display** - Shows translation with metadata

## 🔧 Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## 📚 Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## 📋 Changelog

### Post-Clone Setup & Changes

#### AI Agents Framework
- ✅ Created `.AI-Agents/` directory structure
- ✅ Added provider folders: `.claude/`, `.nvidia/`, `.openai/`, `.gemini/`
- ✅ Implemented global orchestrator (`orchestrator.md`)
- ✅ Added provider-specific orchestrators for each AI service
- ✅ Created base dev lifecycle skills documentation
- ✅ Added agentic workflow orchestrator skill
- ✅ Organized all `.md` files into `.AI-Agents/` hierarchy

#### Security Enhancements
- ✅ Enhanced `.gitignore` with comprehensive security patterns
- ✅ Added `.env.local` and `.credentials/` to git exclusions
- ✅ Created `SECURITY.md` with best practices
- ✅ Created `.env.local.example` template with warnings
- ✅ Documented API key management strategies
- ✅ Added environment-specific secret handling

#### Documentation
- ✅ Moved all `.md` files from root to `.AI-Agents/.claude/`
- ✅ Created provider setup guides:
  - `NVIDIA_BUILD_SETUP.md`
  - `OPENAI_SETUP.md`
  - `GEMINI_SETUP.md`
  - `CLAUDE.md`
- ✅ Created consolidated provider overview in `.AI-Agents/README.md`
- ✅ Added skills registry and configuration files

#### Configuration Files
- ✅ Created `config.json` for Claude agent settings
- ✅ Added provider-specific configuration templates
- ✅ Documented orchestration routing logic

#### Project Structure Updates
```
.AI-Agents/
├── README.md (consolidated overview)
├── orchestrator.md (global orchestrator)
├── .claude/
│   ├── orchestrator.md
│   ├── CLAUDE.md
│   ├── base_dev_lifecycle_skills.md
│   ├── agentic_workflow_orchestrator.md
│   ├── skills_registry.md
│   ├── config.json
│   └── AGENTS.md
├── .nvidia/
│   ├── orchestrator.md
│   └── NVIDIA_BUILD_SETUP.md
├── .openai/
│   ├── orchestrator.md
│   └── OPENAI_SETUP.md
└── .gemini/
    ├── orchestrator.md
    └── GEMINI_SETUP.md
```

## 🔐 API Key Setup

### Secure API Key Storage

1. **Create `.env.local` file** in project root (git-ignored)
   ```bash
   cp .env.local.example .env.local
   ```

2. **Add your API keys** to `.env.local`:
   ```
   CLAUDE_API_KEY=your_key
   NVIDIA_API_KEY=your_key
   OPENAI_API_KEY=your_key
   GOOGLE_GEMINI_API_KEY=your_key
   ```

3. **Never commit** `.env.local` - it's in `.gitignore`

4. **Alternative secure storage**:
   - Use `.AI-Agents/.credentials` directory (git-ignored)
   - Use OS keychain/credential manager
   - Use CI/CD secrets (for deployments)

See [.AI-Agents documentation](./.AI-Agents/README.md) for provider-specific setup.

## 📖 Documentation Structure

All documentation is now organized in `.AI-Agents/`:
- **Global Orchestrator**: `.AI-Agents/orchestrator.md`
- **Provider Docs**: `.AI-Agents/<provider>/`
- **Skills**: `.AI-Agents/.claude/base_dev_lifecycle_skills.md`
- **Security**: `SECURITY.md` (root)
- **Environment**: `.env.local.example` (root)

## 🚀 Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
