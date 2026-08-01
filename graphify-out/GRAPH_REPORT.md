# Graph Report - .  (2026-08-01)

## Corpus Check
- Corpus is ~24,565 words - fits in a single context window. You may not need a graph.

## Summary
- 638 nodes · 948 edges · 78 communities (29 shown, 49 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.55)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- UI Component Library
- Dev Tooling & Config
- Layout Components
- Navigation & Menus
- Dialog & Overlay
- Carousel & Media
- Router & Routes
- TypeScript Config
- Auth & Error Handling
- Form Controls
- Buttons & Calendar
- Supabase Server Auth
- Project Config
- Command Palette
- Menubar Components
- Dashboard Features
- Simulator Features
- Event Analytics
- UI Primitives
- Styling System
- Tooltip & Popover
- Table & Data
- Select & Input
- Progress & Slider
- Tabs & Toggle
- Checkbox & Radio
- Scroll & Resize
- Label & Switch
- Context Menu
- Aspect Ratio
- Alert & Breadcrumb
- Sheet & Drawer
- Navigation Menu
- Collapsible
- Input OTP
- Form Components
- Sonner Toast
- Calendar Picker
- Resizable Panels
- Auth Flow
- Landing Page
- Dashboard Layout
- Root Layout
- App Shell
- Auth State
- Supabase Client
- Route Guards
- Realtime Events
- Event Ingestion
- Metadata Builder
- Analytics Engine
- Chart Components
- KPI Cards
- Events Table
- Simulator UI
- Preset Events
- Auth Page
- Landing Hero
- Sidebar Nav
- Header Layout
- Footer Section
- Theme System
- Animation Utils
- CSS Utilities
- Tailwind Config
- Component Exports
- Hook Exports
- Lib Exports
- Integration Exports
- Type Exports
- Config Exports
- Route Exports
- Feature Exports
- UI Exports

## God Nodes (most connected - your core abstractions)
1. `cn()` - 69 edges
2. `compilerOptions` - 17 edges
3. `Button` - 9 edges
4. `supabase` - 9 edges
5. `react` - 8 edges
6. `useAuthUser()` - 8 edges
7. `Simulator()` - 8 edges
8. `scripts` - 7 edges
9. `FileRoutesByPath` - 7 edges
10. `Dashboard()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `CalendarDayButton()` --references--> `react`  [EXTRACTED]
  src/components/ui/calendar.tsx → package.json
- `useCarousel()` --references--> `react`  [EXTRACTED]
  src/components/ui/carousel.tsx → package.json
- `useChart()` --references--> `react`  [EXTRACTED]
  src/components/ui/chart.tsx → package.json
- `useFormField()` --references--> `react`  [EXTRACTED]
  src/components/ui/form.tsx → package.json
- `useSidebar()` --references--> `react`  [EXTRACTED]
  src/components/ui/sidebar.tsx → package.json

## Import Cycles
- None detected.

## Communities (78 total, 49 thin omitted)

### Community 0 - "UI Component Library"
Cohesion: 0.06
Nodes (52): Badge(), BadgeProps, badgeVariants, Card, CardContent, CardDescription, CardFooter, CardHeader (+44 more)

### Community 1 - "Dev Tooling & Config"
Cohesion: 0.04
Nodes (46): eslint, eslint-config-prettier, @eslint/js, eslint-plugin-prettier, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, @lovable.dev/vite-tanstack-config (+38 more)

### Community 2 - "Layout Components"
Cohesion: 0.06
Nodes (37): Separator, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle (+29 more)

### Community 3 - "Navigation & Menus"
Cohesion: 0.07
Nodes (29): Avatar, AvatarFallback, AvatarImage, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem (+21 more)

### Community 4 - "Dialog & Overlay"
Cohesion: 0.09
Nodes (32): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle (+24 more)

### Community 5 - "Carousel & Media"
Cohesion: 0.07
Nodes (25): react, react, Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem (+17 more)

### Community 6 - "Router & Routes"
Cohesion: 0.10
Nodes (25): getRouter(), Route, Route, Route, Route, Route, Route, AuthenticatedDashboardRoute (+17 more)

### Community 7 - "TypeScript Config"
Cohesion: 0.07
Nodes (26): DOM, DOM.Iterable, ES2022, eslint.config.js, src/**/*.ts, src/**/*.tsx, vite/client, vite.config.ts (+18 more)

### Community 8 - "Auth & Error Handling"
Cohesion: 0.15
Nodes (14): attachSupabaseAuth, consumeLastCapturedError(), describeError(), describeStatus(), originalConsoleError, safeStringify(), renderErrorPage(), fetch() (+6 more)

### Community 9 - "Form Controls"
Cohesion: 0.10
Nodes (11): AccordionContent, AccordionItem, AccordionTrigger, Checkbox, HoverCardContent, PopoverContent, Progress, RadioGroup (+3 more)

### Community 10 - "Buttons & Calendar"
Cohesion: 0.19
Nodes (16): Button, ButtonProps, buttonVariants, Calendar(), CalendarDayButton(), Pagination(), PaginationContent, PaginationEllipsis() (+8 more)

### Community 11 - "Supabase Server Auth"
Cohesion: 0.13
Nodes (17): createSupabaseFetch(), isNewSupabaseApiKey(), requireSupabaseAuth, createSupabaseAdminClient(), createSupabaseFetch(), isNewSupabaseApiKey(), supabaseAdmin, CompositeTypes (+9 more)

### Community 12 - "Project Config"
Cohesion: 0.11
Nodes (18): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+10 more)

### Community 13 - "Command Palette"
Cohesion: 0.12
Nodes (14): Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut() (+6 more)

### Community 14 - "Menubar Components"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 15 - "Dashboard Features"
Cohesion: 0.15
Nodes (11): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+3 more)

### Community 16 - "Simulator Features"
Cohesion: 0.15
Nodes (13): cmdk, embla-carousel-react, @hookform/resolvers, dependencies, cmdk, embla-carousel-react, @hookform/resolvers, @radix-ui/react-avatar (+5 more)

### Community 17 - "Event Analytics"
Cohesion: 0.20
Nodes (9): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut(), ContextMenuSubContent (+1 more)

### Community 18 - "UI Primitives"
Cohesion: 0.25
Nodes (7): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator()

### Community 19 - "Styling System"
Cohesion: 0.25
Nodes (6): DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

### Community 20 - "Tooltip & Popover"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 21 - "Table & Data"
Cohesion: 0.33
Nodes (5): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants

### Community 22 - "Select & Input"
Cohesion: 0.40
Nodes (4): Alert, AlertDescription, AlertTitle, alertVariants

### Community 23 - "Progress & Slider"
Cohesion: 0.40
Nodes (4): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot

### Community 24 - "Tabs & Toggle"
Cohesion: 0.50
Nodes (3): TabsContent, TabsList, TabsTrigger

## Knowledge Gaps
- **317 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `css` (+312 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **49 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Simulator Features` to `Dev Tooling & Config`, `Carousel & Media`, `Scroll & Resize`, `Label & Switch`, `Context Menu`, `Aspect Ratio`, `Alert & Breadcrumb`, `Sheet & Drawer`, `Navigation Menu`, `Collapsible`, `Input OTP`, `Form Components`, `Sonner Toast`, `Calendar Picker`, `Resizable Panels`, `Auth Flow`, `Landing Page`, `Dashboard Layout`, `Root Layout`, `App Shell`, `Auth State`, `Supabase Client`, `Route Guards`, `Realtime Events`, `Event Ingestion`, `Metadata Builder`, `Analytics Engine`, `Chart Components`, `KPI Cards`, `Events Table`, `Simulator UI`, `Preset Events`, `Auth Page`, `Landing Hero`, `Sidebar Nav`, `Header Layout`, `Footer Section`, `Theme System`, `Animation Utils`, `CSS Utilities`, `Tailwind Config`, `Component Exports`, `Hook Exports`, `Lib Exports`, `Integration Exports`, `Type Exports`, `Config Exports`, `Route Exports`, `Feature Exports`, `UI Exports`?**
  _High betweenness centrality (0.384) - this node is a cross-community bridge._
- **Why does `cn()` connect `Buttons & Calendar` to `UI Component Library`, `Layout Components`, `Navigation & Menus`, `Dialog & Overlay`, `Carousel & Media`, `Form Controls`, `Command Palette`, `Menubar Components`, `Dashboard Features`, `Event Analytics`, `UI Primitives`, `Styling System`, `Tooltip & Popover`, `Table & Data`, `Select & Input`, `Progress & Slider`, `Tabs & Toggle`, `Checkbox & Radio`?**
  _High betweenness centrality (0.358) - this node is a cross-community bridge._
- **Why does `react` connect `Carousel & Media` to `Simulator Features`, `Buttons & Calendar`, `Layout Components`?**
  _High betweenness centrality (0.335) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _317 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI Component Library` be split into smaller, more focused modules?**
  _Cohesion score 0.06151062867480778 - nodes in this community are weakly interconnected._
- **Should `Dev Tooling & Config` be split into smaller, more focused modules?**
  _Cohesion score 0.0425531914893617 - nodes in this community are weakly interconnected._
- **Should `Layout Components` be split into smaller, more focused modules?**
  _Cohesion score 0.05574912891986063 - nodes in this community are weakly interconnected._