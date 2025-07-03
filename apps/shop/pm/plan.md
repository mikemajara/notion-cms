# Shop Storefront Requirements Plan

## Current State Analysis

✅ **What we have:**

- Next.js 15 app with TypeScript
- Notion CMS integration with auto-generated types for "Art Gallery Inventory" database
- shadcn/ui component library
- Product data structure includes: Artist, Price, Medium, Dimensions, Status, Description, Artwork Title, Image, Date Acquired, Date Sold, Commission Rate
- S3/MinIO setup for image handling
- Basic UI components (cards, buttons, badges, etc.)

❌ **What's missing:**

- Actual storefront interface (currently shows template collection)
- Product catalog components
- Shopping cart functionality
- Product filtering and search
- Checkout process
- Image optimization and display

## Requirements & Component Architecture

### 1. Core Store Components

#### 1.1 Product Catalog Components

- **ProductGrid** - Main grid layout for displaying products
- **ProductCard** - Individual product card with image, title, artist, price
- **ProductDetail** - Full product page with detailed information
- **ProductImage** - Optimized image component with fallbacks
- **ProductBadge** - Status indicators (Available, Sold, etc.)

#### 1.2 Navigation & Layout

- **StoreHeader** - Navigation with cart, search, categories
- **StoreSidebar** - Filter controls and categories
- **CategoryNav** - Medium-based navigation (Oil Paint, Acrylic, etc.)
- **Breadcrumbs** - Navigation breadcrumbs for product pages

#### 1.3 Shopping Cart & Checkout

- **CartProvider** - Context for cart state management
- **CartDrawer** - Slide-out cart component
- **CartItem** - Individual cart item with quantity controls
- **CheckoutForm** - Customer information and payment details
- **OrderSummary** - Order review component

#### 1.4 Search & Filtering

- **SearchBar** - Global product search
- **FilterSidebar** - Advanced filtering options
- **FilterBadges** - Active filter display
- **SortDropdown** - Sorting options (price, date, artist)

#### 1.5 Utility Components

- **PriceDisplay** - Formatted price with currency
- **ArtistLink** - Clickable artist name with bio
- **StatusIndicator** - Visual status representation
- **LoadingStates** - Skeleton loaders for products
- **EmptyStates** - No products found, empty cart, etc.

### 2. Page Structure

#### 2.1 Main Storefront (`/` - page.tsx)

```
StoreHeader
  ├── CategoryNav
  └── SearchBar
StoreMain
  ├── FilterSidebar
  └── ProductGrid
    └── ProductCard[]
```

#### 2.2 Product Detail (`/product/[id]`)

```
StoreHeader
ProductDetail
  ├── ProductImage
  ├── ProductInfo
  ├── AddToCartSection
  └── RelatedProducts
```

#### 2.3 Cart Page (`/cart`)

```
StoreHeader
CartPage
  ├── CartItems[]
  ├── OrderSummary
  └── CheckoutButton
```

### 3. Data Integration Tasks

#### 3.1 Notion CMS Integration

- **ProductService** - Service layer for fetching products
- **ImageService** - Handle Notion image URLs and S3 integration
- **FilterService** - Build dynamic filters from Notion data
- **SearchService** - Implement search across product fields

#### 3.2 State Management

- **CartContext** - Global cart state
- **ProductsContext** - Product data and filtering state
- **UIContext** - Loading states, modals, etc.

### 4. Business Logic Requirements

#### 4.1 Product Availability

- Only show products with "Available" status
- Hide sold items or mark as "Sold Out"
- Handle commission rate calculations

#### 4.2 Pricing & Cart

- Display prices with proper formatting
- Calculate totals including any fees
- Handle quantity (typically 1 for artwork)
- Validate cart items before checkout

#### 4.3 Search & Filtering

- Search by: Artist, Title, Description, Medium
- Filter by: Medium, Price Range, Dimensions, Date Acquired
- Sort by: Price (low/high), Date Added, Artist Name

### 5. Technical Implementation Tasks

#### Phase 1: Core Store Setup (Week 1)

- [ ] **Task 1.1**: Replace homepage with main storefront layout
- [ ] **Task 1.2**: Create ProductGrid and ProductCard components
- [ ] **Task 1.3**: Integrate notion-cms to fetch and display products
- [ ] **Task 1.4**: Implement basic responsive design
- [ ] **Task 1.5**: Add StoreHeader with basic navigation

#### Phase 2: Product Details & Images (Week 1-2)

- [ ] **Task 2.1**: Create ProductDetail page with routing
- [ ] **Task 2.2**: Implement ProductImage component with optimization
- [ ] **Task 2.3**: Integrate S3/MinIO for image serving
- [ ] **Task 2.4**: Add image fallbacks and loading states
- [ ] **Task 2.5**: Create responsive product detail layout

#### Phase 3: Shopping Cart (Week 2)

- [ ] **Task 3.1**: Implement CartProvider with local storage persistence
- [ ] **Task 3.2**: Create CartDrawer component
- [ ] **Task 3.3**: Add to cart functionality on product cards/details
- [ ] **Task 3.4**: Create cart page with item management
- [ ] **Task 3.5**: Add cart icon with item count in header

#### Phase 4: Search & Filtering (Week 2-3)

- [ ] **Task 4.1**: Implement SearchBar with real-time search
- [ ] **Task 4.2**: Create FilterSidebar with medium/price filters
- [ ] **Task 4.3**: Add sort functionality (price, date, artist)
- [ ] **Task 4.4**: Implement filter state management
- [ ] **Task 4.5**: Add CategoryNav for quick medium filtering

#### Phase 5: Checkout & Polish (Week 3)

- [ ] **Task 5.1**: Create CheckoutForm with validation
- [ ] **Task 5.2**: Implement order summary and confirmation
- [ ] **Task 5.3**: Add loading states and error handling
- [ ] **Task 5.4**: Implement empty states (no products, empty cart)
- [ ] **Task 5.5**: Add mobile optimization and testing

### 6. UI/UX Considerations

#### 6.1 Design System

- Use existing shadcn/ui components for consistency
- Implement art gallery aesthetic (clean, minimal, sophisticated)
- Ensure accessibility (proper contrast, keyboard navigation)
- Mobile-first responsive design

#### 6.2 Performance

- Implement image lazy loading
- Add skeleton loading states
- Optimize Notion API calls with caching
- Progressive loading for large product catalogs

#### 6.3 User Experience

- Quick add to cart from product cards
- Clear product availability indicators
- Intuitive filter and search interface
- Smooth cart interactions with animations

### 7. File Structure

```
apps/shop/
├── app/
│   ├── page.tsx (main storefront)
│   ├── product/
│   │   └── [id]/
│   │       └── page.tsx
│   └── cart/
│       └── page.tsx
├── components/
│   ├── store/
│   │   ├── ProductGrid.tsx
│   │   ├── ProductCard.tsx
│   │   ├── ProductDetail.tsx
│   │   ├── ProductImage.tsx
│   │   └── StoreHeader.tsx
│   ├── cart/
│   │   ├── CartProvider.tsx
│   │   ├── CartDrawer.tsx
│   │   └── CartItem.tsx
│   ├── filters/
│   │   ├── SearchBar.tsx
│   │   ├── FilterSidebar.tsx
│   │   └── CategoryNav.tsx
│   └── ui/ (existing shadcn components)
├── lib/
│   ├── services/
│   │   ├── products.ts
│   │   ├── images.ts
│   │   └── cart.ts
│   └── types/
│       └── store.ts
└── hooks/
    ├── use-cart.ts
    ├── use-products.ts
    └── use-filters.ts
```

## Next Steps

1. **Confirm Requirements**: Do you want to proceed with this plan, or are there specific features you'd like to modify?

2. **Environment Setup**: Should we configure the S3/MinIO integration for image handling first?

3. **Design Direction**: Any specific aesthetic preferences for the art gallery store?

4. **Payment Integration**: Do you want to include actual payment processing (Stripe, etc.) or just cart functionality for now?
