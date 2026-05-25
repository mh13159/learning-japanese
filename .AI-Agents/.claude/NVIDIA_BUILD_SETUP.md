# NVIDIA Build Setup Guide

## Overview

NVIDIA Build (https://build.nvidia.com/) provides free access to state-of-the-art AI models for inference.

## Getting Started

1. **Sign Up**
   - Visit https://build.nvidia.com/
   - Create account or login
   - Verify email

2. **Get API Key**
   - Navigate to Account Settings
   - Generate new API key
   - Copy and save securely

3. **Install SDK**
   ```bash
   npm install @nvidia-ai/sdk
   ```

4. **Environment Variables**
   Create `.env.local`:
   ```
   NEXT_PUBLIC_NVIDIA_API_KEY=your_api_key_here
   NVIDIA_API_ENDPOINT=https://api.nvcf.nvidia.com/v2
   ```

5. **Available Models**
   - Llama 2, 3
   - Mistral
   - Mixtral
   - And more at build.nvidia.com/models

## Integration Example

See integration guides in related skill files.
