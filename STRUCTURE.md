# Project Structure Guide

This document outlines the folder structure and organization of the CLALI project to help the team collaborate effectively.

## `src/` Directory Structure

| Directory | Purpose |
| :--- | :--- |
| **`assets/`** | Static assets like images, fonts, and global icons. |
| **`components/`** | Reusable UI components (Buttons, Cards, Inputs). Keep them generic if possible. |
| **`context/`** | React Context definitions and providers for global state (Auth, Theme). |
| **`hooks/`** | Custom React hooks for reusable logic (`useFetch`, `useAuth`). |
| **`layout/`** | Structural components that wrap pages (Headers, Footers, Sidebars). |
| **`logic/`** | (Existing) Core business logic separate from UI. |
| **`pages/`** | Top-level components representing full views/routes (`Home`, `Profile`). |
| **`services/`** | (Existing) API integration and external service interactions. |
| **`types/`** | Shared TypeScript interfaces and type definitions. |
| **`utils/`** | Helper functions, formatters, and constants. |
| **`workers/`** | (Existing) Web Workers for heavy background processing. |

## Best Practices

1.  **Colocation**: If a component needs a specific utility or style that isn't used elsewhere, keep it close to the component.
2.  **Explicit Imports**: Avoid circular dependencies.
3.  **Naming**: Use PascalCase for components (`MyComponent.tsx`) and camelCase for functions/hooks (`useHook.ts`).

## Adding New Features

- **New Page**: Create `src/pages/NewPage.tsx`.
- **New UI Element**: Create `src/components/NewElement.tsx`.
- **New Global State**: Add a context in `src/context/`.
