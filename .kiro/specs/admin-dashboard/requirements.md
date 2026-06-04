# Requirements Document

## Introduction

Phase 3 of FashionVerse introduces a full-featured Admin Dashboard & Inventory Management system. It is accessible at `/admin-dashboard` and is exclusively available to users with the `admin` role. The dashboard provides a dedicated, full-screen app-like interface (no Navbar/Footer) with a sidebar for navigating between four sections: Overview, Products, Orders, and Customers. It enables admins to manage the product catalog (including Cloudinary image uploads and per-variant stock control), process and update orders, view customer summaries, and benefits from automatic stock deduction on each successful customer checkout. All data is protected at both the React routing layer and Supabase Row Level Security layer.

---

## Glossary

- **Admin_Dashboard**: The full-screen application rendered at `/admin-dashboard/*`, exclusively accessible to users whose `profiles.role` is `'admin'`.
- **Route_Guard**: A React component that checks the authenticated user's role and redirects non-admin users to the Home page (`/`).
- **Sidebar**: The persistent left-navigation panel inside the Admin_Dashboard containing links to all four tabs.
- **Overview_Tab**: The dashboard home screen showing aggregate metrics (revenue, orders, customers, active products) and recent orders.
- **Products_Tab**: The section for viewing, creating, editing, and deleting products and their color/size variants.
- **Orders_Tab**: The section for viewing all customer orders, expanding order details, and updating order status.
- **Customers_Tab**: The section listing registered users with their order counts.
- **Product_Form**: The modal/panel form used to create or edit a product, including its color variants, sizes, and stock quantities.
- **Cloudinary_Uploader**: The client-side service in `src/lib/cloudinary.ts` that performs unsigned HTTP POST uploads to Cloudinary and returns a secure URL.
- **Stock_Deduction_Service**: The logic that decrements `product_sizes.stock` for each ordered item on successful checkout.
- **TanStack_Query**: The data-fetching and caching library (`@tanstack/react-query`) used for all Supabase queries in the dashboard.
- **RLS**: Supabase Row Level Security policies that enforce admin-only data access at the database level.
- **Order_Status**: One of five values — `pending`, `packed`, `shipped`, `delivered`, `cancelled`.

---

## Requirements

### Requirement 1: Route Guard & Access Control

**User Story:** As a site owner, I want non-admin users to be automatically redirected away from the admin area, so that customer data and management tools are never exposed to regular users.

#### Acceptance Criteria

1. WHEN a user navigates to any `/admin-dashboard/*` path and their `profiles.role` is not `'admin'`, THE Route_Guard SHALL redirect the user to the Home page (`/`).
2. WHEN a user navigates to any `/admin-dashboard/*` path while unauthenticated (no active session), THE Route_Guard SHALL redirect the user to the Home page (`/`).
3. WHILE the Route_Guard is resolving the authenticated user's profile, THE Admin_Dashboard SHALL display a loading indicator and withhold the dashboard content.
4. THE Admin_Dashboard SHALL render without the global Navbar and Footer components, replacing them with its own Sidebar layout.
5. THE Admin_Dashboard route SHALL be mounted outside the shared `Layout` component so that the Navbar and Footer are never rendered for any `/admin-dashboard/*` path.
6. THE RLS policies in Supabase SHALL restrict `INSERT`, `UPDATE`, and `DELETE` operations on `products`, `product_colors`, `product_sizes`, and `orders` tables to authenticated users whose `profiles.role` is `'admin'`.

---

### Requirement 2: Dashboard Layout & Sidebar Navigation

**User Story:** As an admin, I want a persistent sidebar with clear navigation links, so that I can move between dashboard sections instantly without full page reloads.

#### Acceptance Criteria

1. THE Sidebar SHALL display navigation items for Dashboard (Overview), Products, Orders, and Customers.
2. WHEN an admin clicks a Sidebar navigation item, THE Admin_Dashboard SHALL render the corresponding tab content in the main area without a full-page reload.
3. THE Sidebar SHALL visually highlight the currently active navigation item.
4. THE Admin_Dashboard SHALL be responsive: on screens narrower than 768 px, THE Sidebar SHALL collapse into an icon-only or hidden state accessible via a toggle button.
5. THE Admin_Dashboard layout SHALL fill the full viewport height and width with no overflow caused by the Navbar or Footer.

---

### Requirement 3: Overview Tab — Aggregate Metrics

**User Story:** As an admin, I want to see key business metrics at a glance on the dashboard home screen, so that I can quickly assess the store's performance.

#### Acceptance Criteria

1. WHEN the Overview_Tab is active and the Supabase connection is available, THE Overview_Tab SHALL display Total Revenue (sum of `orders.total_amount` for non-cancelled orders), Total Orders count, Total Customers count (distinct users in `profiles`), and Active Products count (`products.is_active = true`), fetched via TanStack_Query.
2. IF the Supabase queries return no rows or an error, THEN THE Overview_Tab SHALL display pre-defined mock stats so the UI never shows empty or broken metric cards.
3. THE Overview_Tab SHALL display the five most recent orders (by `created_at` descending) in a summary table showing order ID, customer name, total amount, status, and date.
4. WHEN TanStack_Query is fetching Overview_Tab data, THE Overview_Tab SHALL show skeleton loading placeholders in place of the metric cards and recent orders table.

---

### Requirement 4: Products Tab — Product Table

**User Story:** As an admin, I want to view all products in a paginated table with key details, so that I can quickly scan inventory and take action on individual items.

#### Acceptance Criteria

1. WHEN the Products_Tab is active, THE Products_Tab SHALL fetch and display all products via TanStack_Query in a table with columns: Thumbnail Image, Name, Brand, Price, Category, and Total Stock.
2. THE Products_Tab SHALL calculate Total Stock for each product as the sum of `product_sizes.stock` across all size variants of that product.
3. WHEN TanStack_Query is fetching product data, THE Products_Tab SHALL display a skeleton table.
4. IF a product has zero total stock, THEN THE Products_Tab SHALL display an "Out of Stock" badge on that product's row.
5. THE Products_Tab table SHALL support client-side filtering by Category and client-side search by product name.

---

### Requirement 5: Products Tab — Add / Edit Product

**User Story:** As an admin, I want to create and edit products through a structured form, so that I can maintain an accurate and up-to-date product catalog.

#### Acceptance Criteria

1. WHEN an admin clicks "Add Product", THE Product_Form SHALL open as a modal dialog with empty fields.
2. WHEN an admin clicks the edit action on a product row, THE Product_Form SHALL open pre-populated with that product's existing data.
3. THE Product_Form SHALL include fields for: Name (required), Description, Price (required, positive number), MRP / Original Price, Brand Name, Category (required, one of the five valid values), Tags (comma-separated), `is_featured` toggle, and `is_trending` toggle.
4. THE Product_Form SHALL include a Color Variants section where the admin can add one or more color entries, each with: Color Name (required), Hex Code, and an image upload control.
5. WHEN an admin selects an image file in the Color Variant image upload control, THE Cloudinary_Uploader SHALL upload the file to the `fashionverse/products` folder via unsigned POST and THE Product_Form SHALL store the returned secure URL.
6. IF the Cloudinary upload fails, THEN THE Product_Form SHALL display an error message below the image upload control and SHALL NOT proceed with saving the product.
7. THE Product_Form SHALL include a Sizes & Stock section where the admin can add one or more size entries, each with: Size label (required) and Stock Quantity (required, non-negative integer).
8. WHEN an admin submits THE Product_Form with valid data, THE Admin_Dashboard SHALL insert or update records in `products`, `product_colors`, and `product_sizes` via Supabase and then invalidate the TanStack_Query products cache.
9. IF the Supabase insert or update operation returns an error, THEN THE Admin_Dashboard SHALL display a toast notification with the error message and SHALL NOT close the Product_Form.
10. WHEN a product is successfully saved, THE Admin_Dashboard SHALL display a success toast and close the Product_Form.
11. THE Product_Form SHALL validate all required fields before submission and SHALL display inline validation error messages for any missing or invalid values.

---

### Requirement 6: Products Tab — Delete Product

**User Story:** As an admin, I want to delete products I no longer carry, so that the catalog stays clean and customers don't see discontinued items.

#### Acceptance Criteria

1. WHEN an admin clicks the delete action on a product row, THE Admin_Dashboard SHALL display a confirmation dialog before deleting.
2. WHEN the admin confirms deletion, THE Admin_Dashboard SHALL delete the product record from Supabase (cascade deletes `product_colors` and `product_sizes`), invalidate the TanStack_Query products cache, and display a success toast.
3. IF the Supabase delete operation returns an error, THEN THE Admin_Dashboard SHALL display a toast with the error message and SHALL NOT remove the product from the table.
4. WHEN the admin cancels the confirmation dialog, THE Admin_Dashboard SHALL take no action and close the dialog.

---

### Requirement 7: Orders Tab — Order List & Detail

**User Story:** As an admin, I want to see all customer orders and inspect their line items, so that I can fulfill and manage orders accurately.

#### Acceptance Criteria

1. WHEN the Orders_Tab is active, THE Orders_Tab SHALL fetch all orders via TanStack_Query and display them in a table with columns: Order ID (truncated), Customer Name, Total Amount, Payment Method, Status badge, and Order Date.
2. THE Orders_Tab table SHALL support client-side filtering by Order_Status.
3. WHEN an admin clicks on an order row or its expand control, THE Orders_Tab SHALL display an inline or modal detail view showing: delivery address, each order item's product name, color, size, quantity, and unit price.
4. WHEN TanStack_Query is fetching orders data, THE Orders_Tab SHALL display a skeleton table.

---

### Requirement 8: Orders Tab — Order Status Management

**User Story:** As an admin, I want to update the status of any order, so that customers see accurate shipping and delivery progress on their My Orders page.

#### Acceptance Criteria

1. WHEN an admin changes the Order_Status dropdown in the order row or detail view, THE Admin_Dashboard SHALL immediately call Supabase to update `orders.status` to the newly selected value.
2. WHEN the status update succeeds, THE Admin_Dashboard SHALL invalidate the TanStack_Query orders cache so the table reflects the new status without a manual page refresh.
3. IF the Supabase status update returns an error, THEN THE Admin_Dashboard SHALL display an error toast and SHALL revert the dropdown to the previous status value.
4. WHEN the order status is updated by the admin, THE updated status SHALL be immediately visible on the customer's My Orders page upon their next data fetch.

---

### Requirement 9: Automatic Stock Deduction on Checkout

**User Story:** As a store owner, I want stock to be automatically decremented when a customer places an order, so that overselling is prevented and inventory counts stay accurate.

#### Acceptance Criteria

1. WHEN a customer successfully places an order (order record and all order items inserted without error), THE Stock_Deduction_Service SHALL decrement `product_sizes.stock` by the ordered quantity for each order item, matched by `product_id` and `size`.
2. THE Stock_Deduction_Service SHALL process stock deductions for all items in a single order before confirming success to the customer.
3. IF any stock deduction update returns an error, THEN THE Stock_Deduction_Service SHALL log the error to the browser console and THE checkout flow SHALL still complete (non-blocking, eventual consistency model).
4. WHEN `product_sizes.stock` reaches 0 after deduction, THE Admin_Dashboard Products_Tab SHALL reflect a total stock of 0 and display the "Out of Stock" badge for the affected product on the next data fetch.
5. WHEN `product_sizes.stock` is 0 for a given size, THE product detail page SHALL display that size as "Out of Stock" and prevent the customer from adding it to the cart.

---

### Requirement 10: Customers Tab

**User Story:** As an admin, I want to see a list of registered customers with basic activity stats, so that I can understand my user base at a glance.

#### Acceptance Criteria

1. WHEN the Customers_Tab is active, THE Customers_Tab SHALL fetch all rows from `profiles` via TanStack_Query and display them in a table with columns: Avatar, Name, Email (from `auth.users` if accessible, otherwise omitted), Role, Join Date, and Order Count.
2. THE Customers_Tab SHALL calculate Order Count for each customer as the number of rows in `orders` where `user_id` matches the customer's profile ID.
3. WHEN TanStack_Query is fetching customer data, THE Customers_Tab SHALL display a skeleton table.
4. THE Customers_Tab table SHALL support client-side search by customer name.

---

### Requirement 11: Image Upload via Cloudinary

**User Story:** As an admin, I want to upload product images directly from the form without leaving the admin panel, so that product images are stored reliably and served via CDN.

#### Acceptance Criteria

1. THE Cloudinary_Uploader SHALL perform a direct unsigned HTTP POST to `https://api.cloudinary.com/v1_1/{CLOUD_NAME}/image/upload` using the `VITE_CLOUDINARY_UPLOAD_PRESET` environment variable.
2. WHEN an image file is selected in the Product_Form, THE Admin_Dashboard SHALL display an upload progress indicator until the Cloudinary_Uploader resolves.
3. WHEN the upload completes successfully, THE Product_Form SHALL display a thumbnail preview of the uploaded image using the returned secure URL.
4. THE Cloudinary_Uploader SHALL accept only files with MIME type `image/jpeg`, `image/png`, `image/webp`, or `image/gif`; IF a disallowed file type is selected, THEN THE Product_Form SHALL display an inline error and SHALL NOT attempt the upload.
5. IF `VITE_CLOUDINARY_CLOUD_NAME` is not set in the environment, THEN THE Cloudinary_Uploader SHALL throw a descriptive error and THE Product_Form SHALL surface it as an inline error message.
