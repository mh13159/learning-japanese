# Security Policy

## API Key Management

### ✅ DO
- Store API keys in `.env.local` (git-ignored)
- Use environment variables for all secrets
- Rotate keys regularly
- Use provider-specific API key scoping
- Log API usage for audits

### ❌ DON'T
- Commit `.env.local` to git
- Log API keys or responses
- Share API keys in chat/email
- Use same key across environments
- Hardcode secrets in code

## Secrets Location

```
.env.local              # Local development (git-ignored)
.AI-Agents/.credentials # Per-provider credentials (git-ignored)
CI/CD Secrets          # GitHub Actions / Vercel (platform secrets)
```

## Provider Security

| Provider | Min Requirements |
|----------|-----------------|
| Claude | Rotate quarterly |
| NVIDIA | Free tier - monitor usage |
| OpenAI | Set spending limits |
| Gemini | Enable 2FA on account |

## Scanning

Run security audits:
```bash
npm audit
npm audit fix
```

## Reporting

Found a vulnerability? Contact the maintainers privately.
