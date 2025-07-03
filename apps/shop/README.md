This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app), and [`shadcn-ui`](https://ui.shadcn.com/) and [tailwindcss](https://tailwindcss.com/)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmiguelalcalde%2Fnextjs-with-shadcn)

## Navigation Options

This template includes two navigation options:

### 1. Navbar (Default)

A simple top navigation using shadcn/ui's navigation-menu component:

- Great for simple applications with few navigation items
- Takes up less space on smaller screens
- Easier to remove if not needed

### 2. Sidebar

A collapsible sidebar with more advanced features:

- Better for applications with many navigation items or complex hierarchy
- Provides more space for navigation and branding
- Can be collapsed to save space

### Switching Between Navigation Options

You can easily switch between the two navigation options by editing `app/layout.tsx`:

1. For Navbar: Use the default implementation
2. For Sidebar: Comment out the Navbar section and uncomment the Sidebar section

### Removing Sidebar Completely

If you don't need the sidebar at all and want to reduce bundle size:

1. Delete the following files:

   - `components/app-sidebar.tsx`
   - `components/ui/sidebar.tsx`

2. Remove the sidebar imports from `app/layout.tsx`:

   ```tsx
   import {
     Sidebar,
     SidebarProvider,
     SidebarTrigger,
   } from "@/components/ui/sidebar";
   import { AppSidebar } from "@/components/app-sidebar";
   ```

3. Make sure you're using the Navbar implementation in `app/layout.tsx`
