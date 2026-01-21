---
description: Run lint, format, and build to validate code changes
---

// turbo-all
// this comment allows the agent to auto-run the following commands without prompting the user

After making code changes, run these validation steps:

1. Run ESLint to fix linting issues:
```bash
npm run lint
```

2. Run Prettier to format code:
```bash
npm run format
```

3. Build the project to verify TypeScript and bundling:
```bash
npm run build
```