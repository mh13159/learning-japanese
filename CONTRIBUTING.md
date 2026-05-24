# Contributing Guide

## Project Structure

This project uses a multi-provider AI orchestration framework. See `CHANGELOG.md` for all recent changes.

### Adding a New Provider

1. Create folder under `.AI-Agents/<provider>/`
2. Add setup guide: `.AI-Agents/<provider>/<PROVIDER>_SETUP.md`
3. Add orchestrator: `.AI-Agents/<provider>/orchestrator.md`
4. Update `.AI-Agents/README.md` provider comparison table
5. Add environment variable to `.env.local.example`

### Security

- Never commit API keys or secrets
- Always add secrets to `.gitignore`
- Use `.env.local` for development
- See `SECURITY.md` for full guidelines

### Documentation

- All `.md` files belong in `.AI-Agents/` hierarchy
- Update `CHANGELOG.md` for user-facing changes
- Keep provider docs in their respective folders
