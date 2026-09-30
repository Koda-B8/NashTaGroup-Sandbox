# Frontend

POS dashboard and cashier app built with React 19, React Router, Redux Toolkit, Tailwind CSS 4 and Vite.

## Setup

All environment variables live in the repo root `.env` (copy from `/.env.example`).

```sh
cp ../../.env.example ../../.env
npm run dev
```

The dev server proxies `/api` to the backend, so start the backend first or run `npm run dev` from the repo root to start both.

## Environment

| Variable           | Description                                     |
| ------------------ | ----------------------------------------------- |
| `API_PROXY_TARGET` | Backend URL used by the dev server `/api` proxy |

## Scripts

| Script            | Description                       |
| ----------------- | --------------------------------- |
| `npm run dev`     | Start the dev server              |
| `npm run build`   | Build for production into `dist/` |
| `npm run preview` | Serve the production build        |
| `npm run lint`    | Lint with oxlint                  |
| `npm run fmt`     | Format with oxfmt                 |
