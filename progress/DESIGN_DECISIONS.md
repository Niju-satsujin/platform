# Design Decisions

## Color Palette (Boot.dev Exact)
- **Background**: `#0B0B13` (deep space black)
- **Card Surface**: `#13131D` (elevated surface)
- **Card Hover**: `#1A1A2E` (subtle lift)
- **Primary Purple**: `#8B5CF6` (Boot.dev signature)
- **Primary Pink**: `#EC4899` (accent gradient endpoint)
- **Success Green**: `#10B981`
- **Gold/XP**: `#F59E0B`
- **Danger Red**: `#EF4444`
- **Border**: `#1E1E2E` (subtle separation)

## Typography
- **Sans**: Inter (primary body text)
- **Mono**: JetBrains Mono (code, editor)
- Fallback to Geist Sans/Mono

## Component Patterns
- **Cards**: Glassmorphism with subtle border glow on hover
- **Buttons**: Purple-to-pink gradient with glow effect
- **Progress**: SVG ring components + gradient bars
- **Badges**: Pill-shaped with translucent backgrounds
- **Animations**: Framer Motion for page transitions, hover states

## Architecture
- Server components by default, client components only where needed
- Monaco Editor loaded dynamically (no SSR) for lesson code editing
- Prisma + SQLite for all data (gamification + content)
- Content loaded from filesystem, synced to DB via script
