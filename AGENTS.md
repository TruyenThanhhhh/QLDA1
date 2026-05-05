# AGENTS.md

## Repo Structure

```
D:\QLDA
├── prod/docs/           # Requirements, planning, quality standards (Vietnamese)
├── source/
│   ├── backend/         # Node.js/Express API (port 5000)
│   └── frontend/        # React/Vite app (port 5173)
```

## Commands

**Backend** (`source/backend/`):
- `npm run dev` - Watch mode with hot reload
- `npm start` - Production start
- `npm test` - Jest tests (in `src/tests/`)
- `npm run seed` - Seed demo data

**Frontend** (`source/frontend/`):
- `npm run dev` - Dev server with Vite
- `npm run build` - Production build
- `npm run preview` - Preview production build

## Architecture

- **Stack**: MERN + GIS (MongoDB, Express, React, Node.js + Leaflet)
- **Backend entry**: `src/server.js` → `src/app.js`
- **Frontend entry**: `src/main.jsx` → `src/App.jsx`
- **API proxy**: Vite proxies `/api` → `http://localhost:5000`
- **Auth**: JWT with roles `admin | technician | user`

## Key Documents (read before implementation)

| Document | Purpose |
|----------|---------|
| `prod/docs/09-mvp-chot.md` | MVP scope definition |
| `prod/docs/10-data-schema-draft.md` | Mongoose schemas |
| `prod/docs/11-api-contract-draft.md` | API endpoints |
| `prod/docs/12-workflow-lam-viec.md` | Standard workflow |
| `prod/docs/07-luat-chat-luong-code.md` | 12 code quality rules |
| `prod/docs/08-checklist-definition-of-done.md` | Pre-merge checklist |

## Required Environment

**Backend** (`source/backend/.env`):
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/qlda
JWT_SECRET=<secret>
JWT_EXPIRES_IN=7d
```

## Conventions

- **No hard delete**: Use `isDeleted` flag, never remove records
- **Soft references**: Role-based access in `src/middleware/rbac.js`
- **GeoJSON**: All spatial data as GeoJSON with `geometryType` validation
- **No console.log/debug**: Remove before marking done
- **Update docs**: If changing schema/API/flow, update `prod/docs/` files

## Quality Gate

Before marking done, verify:
1. Build passes (`npm run build` for frontend)
2. Tests pass (`npm test` for backend)
3. No `console.log`, dead code, or unused imports
4. Schema/API changes reflected in `prod/docs/`
5. Definition of Done checklist complete
