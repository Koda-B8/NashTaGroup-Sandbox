# Backend

POS REST API built with Express 5, Sequelize (PostgreSQL), Redis, Socket.IO and Cloudinary.

## Setup

All environment variables live in the repo root `.env` (copy from `/.env.example`).

```sh
cp ../../.env.example ../../.env
docker compose --env-file ../../.env up -d
npm run db:setup
npm run dev
```

The API is served at `http://localhost:$BACKEND_PORT/api/v1`, with docs at `/api/docs` and a health check at `/health`.

## Environment

| Variable                                                  | Description                                          |
| --------------------------------------------------------- | ---------------------------------------------------- |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | PostgreSQL connection                                |
| `DB_SSL`                                                  | `true` to enable SSL in production                   |
| `BACKEND_PORT`                                            | HTTP port                                            |
| `REDIS_URL`, `REDIS_PORT`                                 | Redis connection and compose port                    |
| `CORS_ORIGIN`                                             | Allowed frontend origin                              |
| `CLOUDINARY_URL`, `CLOUDINARY_PRODUCT_IMAGE_FOLDER`       | Product image storage                                |
| `JWT_SECRET`, `JWT_EXPIRES_IN`                            | Auth tokens                                          |
| `NODE_ENV`                                                | `development` or `production`                        |
| `SEED_ADMIN_PASSWORD`, `SEED_CASHIER_PASSWORD`            | Passwords for the seeded `admin` and `cashier` users |

## Scripts

| Script                                   | Description                           |
| ---------------------------------------- | ------------------------------------- |
| `npm run dev`                            | Start with watch mode                 |
| `npm start`                              | Start without loading `.env`          |
| `npm test`                               | Run tests                             |
| `npm run db:setup`                       | Create, migrate and seed the database |
| `npm run db:migrate` / `db:migrate:undo` | Apply or revert migrations            |
| `npm run db:seed` / `db:seed:undo`       | Apply or revert seeders               |

## Docker

The image runs migrations and seeders on start (`RUN_SEEDS=false` to skip) and listens on port `8080`.

```sh
docker build -t nashtagroup-backend .
docker run --env-file ../../.env -p 8080:8080 nashtagroup-backend
```
