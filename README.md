# DAAM Showcase

An interactive document review workspace with fictional business records, source-linked facts, exception resolution, human approval, and printable document packets.

[View the public showcase](https://daam-showcase-sable.vercel.app)

## Run locally

Use Node.js 20.9 or newer and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. For a production build:

```sh
npm run build
npm start
```

## Demo boundaries

Records and source extracts are fictional. The showcase does not run live OCR or AI, send documents, or collect signatures. Changes persist in browser storage when available. The reviewer identity is Guest User, including restored records. Use Restore starting records to reset the sample workspace.

The main showcase needs no environment variables or backend. Separate legacy login/onboarding routes are included to preserve the source app; their Supabase functionality requires your own configuration. Never commit credentials. An optional `.env.example` lists placeholders for those routes.

Dependencies are pinned by package-lock.json. Generated output, local environment files, dependencies, and deployment metadata are excluded from Git. This repository is independent of the personal website and has no Vercel Git connection configured.
