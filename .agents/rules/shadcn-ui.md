# shadcn/ui Component & UI/UX Guidelines

Whenever generating or modifying any UI/UX elements, components, cards, forms, dialogs, or pages for this Next.js project, ALWAYS strictly follow the official [shadcn/ui Next.js guidelines](https://ui.shadcn.com/docs/installation/next):

## Core Principles
1. **Use Reusable UI Components**: All UI primitives MUST be built using or imported from `@/components/ui/` (e.g., `Card`, `Button`, `Dialog`, `Input`, `Table`, `Badge`, `DropdownMenu`, etc.).
2. **Never Create Ad-Hoc Raw Unstyled UI**: Do not write custom raw HTML containers with inline styles or arbitrary CSS classes when a standard shadcn component exists.
3. **Tailwind CSS Utility Functions**: Use `cn(...)` from `@/lib/utils` for merging custom class names with shadcn component variants.
4. **Icons**: Use `lucide-react` for all UI icons.
5. **Component Installation**: If a required shadcn component (e.g., `card`, `dialog`, `badge`, `sheet`) is missing in `src/components/ui/`, install it using `npx shadcn@latest add <component>` or create the canonical shadcn component file.

## Standard Component Usage Example
```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ExampleCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Title</CardTitle>
        <CardDescription>Description</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Content goes here...</p>
      </CardContent>
      <CardFooter>
        <Button>Action</Button>
      </CardFooter>
    </Card>
  );
}
```
