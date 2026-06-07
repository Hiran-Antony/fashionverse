import type { ProductCategory } from '../types';

export const APP_NAME = 'FashionVerse';
export const APP_TAGLINE = 'Where Style Meets Intelligence';

export const CATEGORIES: { value: ProductCategory; label: string }[] = [
  { value: 'men', label: 'Men' },
  { value: 'women', label: 'Women' },
  { value: 'kids', label: 'Kids' },
  { value: 'footwear', label: 'Footwear' },
  { value: 'accessories', label: 'Accessories' },
];

export const SUB_CATEGORIES: Record<string, {label: string, value: string}[]> = {
  men: [
    { label: 'Suits & Blazers', value: 'Suits & Blazers' },
    { label: 'Dress Shirts', value: 'Dress Shirts' },
    { label: 'T-Shirts', value: 'T-Shirts' },
    { label: 'Pants & Trousers', value: 'Pants & Trousers' },
    { label: 'Jeans', value: 'Jeans' },
    { label: 'Jackets & Coats', value: 'Jackets & Coats' },
    { label: 'Ethnic Wear', value: 'Ethnic Wear' },
    { label: 'Accessories', value: 'Accessories' },
  ],
  women: [
    { label: 'Dresses & Gowns', value: 'Dresses & Gowns' },
    { label: 'Tops & Blouses', value: 'Tops & Blouses' },
    { label: 'Sarees & Lehengas', value: 'Sarees & Lehengas' },
    { label: 'Pants & Palazzos', value: 'Pants & Palazzos' },
    { label: 'Jackets', value: 'Jackets' },
    { label: 'Ethnic Wear', value: 'Ethnic Wear' },
    { label: 'Accessories', value: 'Accessories' },
  ],
  kids: [
    { label: 'Boys', value: 'Boys' },
    { label: 'Girls', value: 'Girls' },
    { label: 'School Uniforms', value: 'School Uniforms' },
    { label: 'Ethnic Wear', value: 'Ethnic Wear' },
    { label: 'Footwear', value: 'Footwear' },
    { label: 'Accessories', value: 'Accessories' },
  ],
  footwear: [
    { label: 'Sneakers', value: 'Sneakers' },
    { label: 'Formal Shoes', value: 'Formal Shoes' },
    { label: 'Sandals', value: 'Sandals' },
    { label: 'Heels', value: 'Heels' },
  ],
  accessories: [
    { label: 'Bags', value: 'Bags' },
    { label: 'Watches', value: 'Watches' },
    { label: 'Belts', value: 'Belts' },
    { label: 'Jewellery', value: 'Jewellery' },
  ]
};

export const SIZES = ['S', 'M', 'L', 'XL', 'XXL'] as const;

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'popular', label: 'Most Popular' },
] as const;

export const ORDER_STATUSES = [
  { value: 'pending', label: 'Order Placed', color: '#F59E0B' },
  { value: 'packed', label: 'Packed', color: '#C9973A' },
  { value: 'shipped', label: 'Shipped', color: '#E8B84B' },
  { value: 'delivered', label: 'Delivered', color: '#10B981' },
  { value: 'cancelled', label: 'Cancelled', color: '#EF4444' },
] as const;

export const PRODUCTS_PER_PAGE = 20;

export const PRICE_RANGES = [
  { min: 0, max: 500, label: 'Under ₹500' },
  { min: 500, max: 1000, label: '₹500 – ₹1,000' },
  { min: 1000, max: 2000, label: '₹1,000 – ₹2,000' },
  { min: 2000, max: 5000, label: '₹2,000 – ₹5,000' },
  { min: 5000, max: Infinity, label: 'Above ₹5,000' },
];
