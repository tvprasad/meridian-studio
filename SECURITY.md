# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | ✅        |

## Reporting a Vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Instead, report them privately via GitHub's [Security Advisory](https://github.com/tvprasad/meridian-studio/security/advisories/new) feature, or email directly through the profile contact.

Include:
- A description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested mitigations

You will receive a response within **72 hours**. Once confirmed, a patch will be released and the advisory published.

## Scope

Meridian Studio is a frontend operator interface that communicates with a local or self-hosted backend. Key areas of concern:

- **API key exposure** — environment variables and `.env` files must never be committed
- **XSS** — user-supplied content rendered in the UI
- **Dependency vulnerabilities** — run `npm audit` regularly

## Out of Scope

- The Meridian backend API (report to [tvprasad/meridian](https://github.com/tvprasad/meridian))
- Vulnerabilities requiring physical access to the host machine
