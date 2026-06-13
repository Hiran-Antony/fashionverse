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
    { label: 'TOPWEAR', value: 'TOPWEAR' },
    { label: 'BOTTOMWEAR', value: 'BOTTOMWEAR' },
    { label: 'FOOTWEAR', value: 'FOOTWEAR' },
    { label: 'ETHNIC & FESTIVE', value: 'ETHNIC & FESTIVE' },
    { label: 'ACCESSORIES', value: 'ACCESSORIES' },
  ],
  women: [
    { label: 'TOPWEAR', value: 'TOPWEAR' },
    { label: 'BOTTOMWEAR', value: 'BOTTOMWEAR' },
    { label: 'ETHNIC WEAR', value: 'ETHNIC WEAR' },
    { label: 'FOOTWEAR', value: 'FOOTWEAR' },
    { label: 'ACCESSORIES', value: 'ACCESSORIES' },
  ],
  kids: [
    { label: 'BOYS', value: 'BOYS' },
    { label: 'GIRLS', value: 'GIRLS' },
    { label: 'FOOTWEAR', value: 'FOOTWEAR' },
    { label: 'ACCESSORIES', value: 'ACCESSORIES' },
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

/* Grouped sidebar navigation per category */
export const GROUPED_CATEGORIES: Record<string, { heading: string; items: { label: string; value: string }[] }[]> = {
  men: [
    {
      heading: 'TOPWEAR',
      items: [
        { label: 'T-Shirts', value: 'T-Shirts' },
        { label: 'Casual Shirts', value: 'Casual Shirts' },
        { label: 'Formal Shirts', value: 'Formal Shirts' },
        { label: 'Sweatshirts', value: 'Sweatshirts' },
        { label: 'Jackets', value: 'Jackets' },
        { label: 'Blazers & Suits', value: 'Blazers & Suits' },
      ],
    },
    {
      heading: 'BOTTOMWEAR',
      items: [
        { label: 'Jeans', value: 'Jeans' },
        { label: 'Trousers', value: 'Trousers' },
        { label: 'Cargo', value: 'Cargo' },
        { label: 'Shorts', value: 'Shorts' },
        { label: 'Track Pants', value: 'Track Pants' },
      ],
    },
    {
      heading: 'FOOTWEAR',
      items: [
        { label: 'Casual Shoes', value: 'Casual Shoes' },
        { label: 'Formal Shoes', value: 'Formal Shoes' },
        { label: 'Sneakers', value: 'Sneakers' },
        { label: 'Sandals', value: 'Sandals' },
        { label: 'Sports Shoes', value: 'Sports Shoes' },
      ],
    },
    {
      heading: 'ETHNIC & FESTIVE',
      items: [
        { label: 'Kurtas', value: 'Kurtas' },
        { label: 'Sherwanis', value: 'Sherwanis' },
        { label: 'Nehru Jackets', value: 'Nehru Jackets' },
        { label: 'Dhotis', value: 'Dhotis' },
      ],
    },
    {
      heading: 'ACCESSORIES',
      items: [
        { label: 'Watches', value: 'Watches' },
        { label: 'Wallets', value: 'Wallets' },
        { label: 'Belts', value: 'Belts' },
        { label: 'Caps & Hats', value: 'Caps & Hats' },
        { label: 'Sunglasses', value: 'Sunglasses' },
      ],
    },
  ],
  women: [
    {
      heading: 'TOPWEAR',
      items: [
        { label: 'Tops & Tees', value: 'Tops & Tees' },
        { label: 'Shirts', value: 'Shirts' },
        { label: 'Blouses', value: 'Blouses' },
        { label: 'Sweaters', value: 'Sweaters' },
        { label: 'Jackets', value: 'Jackets' },
      ],
    },
    {
      heading: 'BOTTOMWEAR',
      items: [
        { label: 'Jeans', value: 'Jeans' },
        { label: 'Trousers', value: 'Trousers' },
        { label: 'Skirts', value: 'Skirts' },
        { label: 'Shorts', value: 'Shorts' },
        { label: 'Leggings', value: 'Leggings' },
      ],
    },
    {
      heading: 'ETHNIC WEAR',
      items: [
        { label: 'Sarees', value: 'Sarees' },
        { label: 'Kurtis', value: 'Kurtis' },
        { label: 'Salwar Suits', value: 'Salwar Suits' },
        { label: 'Lehenga', value: 'Lehenga' },
      ],
    },
    {
      heading: 'FOOTWEAR',
      items: [
        { label: 'Heels', value: 'Heels' },
        { label: 'Flats', value: 'Flats' },
        { label: 'Sneakers', value: 'Sneakers' },
        { label: 'Sandals', value: 'Sandals' },
      ],
    },
    {
      heading: 'ACCESSORIES',
      items: [
        { label: 'Handbags', value: 'Handbags' },
        { label: 'Jewellery', value: 'Jewellery' },
        { label: 'Watches', value: 'Watches' },
        { label: 'Sunglasses', value: 'Sunglasses' },
        { label: 'Scarves', value: 'Scarves' },
      ],
    },
  ],
  kids: [
    {
      heading: 'BOYS',
      items: [
        { label: 'T-Shirts', value: 'T-Shirts' },
        { label: 'Shirts', value: 'Shirts' },
        { label: 'Jeans', value: 'Jeans' },
        { label: 'Shorts', value: 'Shorts' },
        { label: 'Track Pants', value: 'Track Pants' },
      ],
    },
    {
      heading: 'GIRLS',
      items: [
        { label: 'Tops', value: 'Tops' },
        { label: 'Dresses', value: 'Dresses' },
        { label: 'Skirts', value: 'Skirts' },
        { label: 'Leggings', value: 'Leggings' },
        { label: 'Ethnic Wear', value: 'Ethnic Wear' },
      ],
    },
    {
      heading: 'FOOTWEAR',
      items: [
        { label: 'Boys Shoes', value: 'Boys Shoes' },
        { label: 'Girls Shoes', value: 'Girls Shoes' },
        { label: 'Sandals', value: 'Sandals' },
        { label: 'Sports Shoes', value: 'Sports Shoes' },
      ],
    },
    {
      heading: 'ACCESSORIES',
      items: [
        { label: 'Caps', value: 'Caps' },
        { label: 'Belts', value: 'Belts' },
        { label: 'Socks', value: 'Socks' },
        { label: 'Watches', value: 'Watches' },
      ],
    },
  ],
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
  { value: 'out_for_delivery', label: 'Out for Delivery', color: '#8B5CF6' },
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
