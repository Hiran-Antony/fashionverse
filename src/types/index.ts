// ============================================================
// FASHIONVERSE — Core Type Definitions
// ============================================================

// ─── User & Auth ─────────────────────────────────────────────

export interface SavedAddress {
  id: string;
  label: string;        // e.g. "Home", "Work"
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  is_default?: boolean;
}

export interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  phone: string | null;
  role: 'customer' | 'admin';
  loyalty_points: number;
  addresses?: SavedAddress[];
  created_at: string;
}

// ─── Products ────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  original_price: number | null;
  category: ProductCategory;
  brand: string | null;
  rating: number;
  review_count: number;
  is_featured: boolean;
  is_trending: boolean;
  is_new?: boolean;
  is_active: boolean;
  tags: string[] | null;
  created_at: string;
  // Supabase join alias
  product_colors?: ProductColor[];
  product_sizes?: ProductSize[];
  // Convenience alias used in components (maps to product_colors)
  colors?: ProductColorWithSizes[];
}

export type ProductCategory =
  | 'men'
  | 'women'
  | 'kids'
  | 'footwear'
  | 'accessories';

export interface ProductColor {
  id: string;
  product_id: string;
  color_name: string;
  hex_code: string | null;
  image_url: string;
}

export interface ProductColorWithSizes extends ProductColor {
  sizes?: ProductSize[];
  product_sizes?: ProductSize[];
}

export interface ProductSize {
  id: string;
  product_id: string;
  size: string;
  stock: number;
  is_out_of_stock: boolean;
}

// ─── Cart ────────────────────────────────────────────────────

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  color_name: string;
  size: string;
  quantity: number;
  product?: Product;
}

// ─── Wishlist ────────────────────────────────────────────────

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  product?: Product;
}

// ─── Orders ──────────────────────────────────────────────────

export type OrderStatus =
  | 'pending'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface Order {
  id: string;
  user_id: string;
  status: OrderStatus;
  total_amount: number;
  address: OrderAddress;
  payment_method: string;
  coupon_code: string | null;
  discount_amount: number;
  created_at: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  color_name: string;
  size: string;
  quantity: number;
  price: number;
  product?: Product;
}

export interface OrderAddress {
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

// ─── Reviews ─────────────────────────────────────────────────

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  images: string[] | null;
  created_at: string;
  profile?: Pick<Profile, 'name' | 'avatar_url'>;
}

// ─── Coupons ─────────────────────────────────────────────────

export interface Coupon {
  id: string;
  code: string;
  discount_percent: number | null;
  discount_amount: number | null;
  min_order: number | null;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
}

// ─── Admin Dashboard ─────────────────────────────────────────

export interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalCustomers: number;
  totalRevenue: number;
  recentOrders: Order[];
}

// ─── Product Form (Admin) ────────────────────────────────────

export interface ProductFormData {
  name: string;
  description: string;
  price: number;
  original_price: number | null;
  category: ProductCategory;
  brand: string;
  tags: string[];
  is_featured: boolean;
  is_trending: boolean;
  colors: ColorVariantInput[];
  sizes: SizeStockInput[];
}

export interface ColorVariantInput {
  color_name: string;
  hex_code: string;
  image_file: File | null;
  image_url?: string; // existing URL when editing
}

export interface SizeStockInput {
  size: string;
  stock: number;
  is_out_of_stock: boolean;
}

// ─── Theme ───────────────────────────────────────────────────

export type Theme = 'light' | 'dark';

// ─── Search & Filters ────────────────────────────────────────

export interface ProductFilters {
  category?: ProductCategory;
  brand?: string;
  priceRange?: [number, number];
  colors?: string[];
  sizes?: string[];
  rating?: number;
  search?: string;
  sortBy?: 'newest' | 'price_low' | 'price_high' | 'rating' | 'popular';
}
