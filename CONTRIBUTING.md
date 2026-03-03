# Contributing to Meridian Studio

Thank you for your interest in contributing!

## Development Setup

```bash
git clone https://github.com/tvprasad/meridian-studio.git
cd meridian-studio
npm install
cp .env.example .env   # configure API URLs
npm run dev
```

You will also need the [Meridian API](https://github.com/tvprasad/meridian) running locally.

## Workflow

1. Fork the repository and create a branch from `main`:
   ```bash
   git checkout -b feat/your-feature
   ```
2. Make your changes.
3. Ensure checks pass:
   ```bash
   npm run lint
   npm run build
   ```
4. Commit with a clear message (see below).
5. Open a Pull Request — the PR template will guide you.

## Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add confidence threshold slider to Settings
fix: correct provider label for chroma on Dashboard
chore: update dependencies
docs: expand README setup section
```

## Code Style

- TypeScript strict mode is enforced — no `any`, no unused locals.
- Tailwind CSS utility classes only; avoid inline styles unless dynamic values are required.
- Keep components focused — one responsibility per file.

## Reporting Issues

Use the GitHub issue templates:
- **Bug report** — for broken behaviour
- **Feature request** — for new ideas

## Questions

Open a [Discussion](https://github.com/tvprasad/meridian-studio/discussions) for general questions.
