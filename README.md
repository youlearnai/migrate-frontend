# YouLearn Frontend 

Next.js 15 application with TypeScript and Bun package manager.

## Setup

```bash
git clone https://github.com/youlearnai/frontend.git
cd frontend
bun install
```

## Development

```bash
bun run dev     # Start dev server with TurboPack
bun run build   # Production build
bun run start   # Start production
bun run lint    # ESLint
bun run pretty  # Prettier formatting
```

## Core Technologies

- Next.js 15 + TypeScript + TurboPack
- Bun for package management
- Tailwind CSS + Shadcn UI + Radix UI

## Key Patterns & Functions

### State Management
- Global state: `zustand` stores in `/hooks`
- Create endpoints in `/endpoints`
- Server state: React Query hooks in `/query-hooks`
- Forms: React Hook Form + Zod validation

### Internationalization
- i18next integration
- Language files in `/locales`
- Use `useTranslation` hook for text

### Authentication
- Firebase Auth
- Protected routes in `/auth`
- `useAuth` hook for auth state

### Components
- Reusable UI in `/components`
- PDF viewer with highlight support
- Rich text editor (BlockNote)
- DnD components using `@dnd-kit`

### Adding New Features
1. Components: Add to `/components`
2. Pages: Add to `/app/[locale]`
3. API Routes: Add to `/app/api`
4. Hooks: Add to `/hooks` or use them from `@usehooks-ts`
5. Types: Add to relevant feature directory
