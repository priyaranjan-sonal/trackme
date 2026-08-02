# TrackMe

TrackMe is a lightweight Next.js app to discover movies and TV shows, build watchlists, and track what you watch.

## Quick start

- Install dependencies

```bash
npm install
```

- Run development server

```bash
npm run dev
```

- Build for production

```bash
npm run build
npm run start
```

## Environment

Copy `.env.example` or create a `.env` with the following values:

- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - JSON Web Token secret (updated to reference TrackMe)
- `JWT_EXPIRY` - token expiry (e.g. `1d`)
- `MOVIE_API_KEY` - TMDB API key

## Notes

This repository was renamed from "movietrack" to TrackMe. Package metadata and environment secret references were updated accordingly.