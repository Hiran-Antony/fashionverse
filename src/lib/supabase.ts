import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface Product {
  id: string;
  name: string;
  brand?: string;
  price: number;
  images?: string[];
  category?: string;
  sub_category?: string;
  color?: string;
  [key: string]: any;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'your_supabase_project_url' &&
  supabaseAnonKey !== 'your_supabase_anon_key'
);

if (!isConfigured) {
  console.warn(
    '⚠️ Supabase not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.\n' +
    '   The app will run in demo mode without authentication or database features.'
  );
}

// ─── DATABASE INTERCEPTOR & POLISHING LAYER ──────────────────

const MOCK_MENS_PRODUCTS = {
  // Deadpool Print T-shirt
  '36e3aa79-e3f3-4cc4-86ff-db3e9fc6ab0c': {
    id: '36e3aa79-e3f3-4cc4-86ff-db3e9fc6ab0c',
    name: 'URB_N Deadpool Print T-shirt',
    brand: 'URB_N',
    description: 'Unleash your inner anti-hero with this signature streetwear tee. Crafted from heavy-gauge luxury cotton, it features an iconic high-density Deadpool print on the chest, custom fit, and a soft-washed feel for premium comfort.',
    price: 699,
    original_price: 899,
    category: 'men',
    rating: 4.8,
    review_count: 142,
    is_featured: false,
    is_trending: true,
    is_active: true,
    tags: ['T-Shirts', 'Casual', 'Trending', 'Pop Culture'],
    created_at: '2026-06-07T12:00:00.000Z',
    colors: [
      {
        id: 'color-deadpool-blue',
        color_name: 'Blue',
        hex_code: '#4b75a3',
        image_url: 'https://res.cloudinary.com/dlikkemff/image/upload/v1780919745/fashionverse/products/exjtxq9ckogsej7apitg.jpg',
        product_id: '36e3aa79-e3f3-4cc4-86ff-db3e9fc6ab0c'
      }
    ],
    sizes: [
      { id: 'size-deadpool-s', size: 'S', stock: 12, is_out_of_stock: false, product_id: '36e3aa79-e3f3-4cc4-86ff-db3e9fc6ab0c' },
      { id: 'size-deadpool-m', size: 'M', stock: 8, is_out_of_stock: false, product_id: '36e3aa79-e3f3-4cc4-86ff-db3e9fc6ab0c' },
      { id: 'size-deadpool-l', size: 'L', stock: 15, is_out_of_stock: false, product_id: '36e3aa79-e3f3-4cc4-86ff-db3e9fc6ab0c' },
      { id: 'size-deadpool-xl', size: 'XL', stock: 5, is_out_of_stock: false, product_id: '36e3aa79-e3f3-4cc4-86ff-db3e9fc6ab0c' }
    ]
  },
  // Red Bulls Printed T-shirt
  '48e6b33e-0186-453f-94b5-54fa4286ebb7': {
    id: '48e6b33e-0186-453f-94b5-54fa4286ebb7',
    name: 'URB_N Printed T-shirt (Red Bulls)',
    brand: 'URB_N',
    description: 'Make a bold athletic statement. This premium crimson red tee combines modern urban fashion with sport-inspired energy, showcasing a high-quality Red Bulls typographic chest print on breathable structured cotton.',
    price: 899,
    original_price: 1099,
    category: 'men',
    rating: 4.7,
    review_count: 98,
    is_featured: true,
    is_trending: true,
    is_active: true,
    tags: ['T-Shirts', 'Casual', 'Spotlight', 'Sportswear'],
    created_at: '2026-06-07T12:00:00.000Z',
    colors: [
      {
        id: 'color-redbulls-red',
        color_name: 'Red',
        hex_code: '#d32f2f',
        image_url: 'https://res.cloudinary.com/dlikkemff/image/upload/v1780919747/fashionverse/products/j4rhdvclij5hpk7dy7va.jpg',
        product_id: '48e6b33e-0186-453f-94b5-54fa4286ebb7'
      }
    ],
    sizes: [
      { id: 'size-redbulls-s', size: 'S', stock: 10, is_out_of_stock: false, product_id: '48e6b33e-0186-453f-94b5-54fa4286ebb7' },
      { id: 'size-redbulls-m', size: 'M', stock: 14, is_out_of_stock: false, product_id: '48e6b33e-0186-453f-94b5-54fa4286ebb7' },
      { id: 'size-redbulls-l', size: 'L', stock: 9, is_out_of_stock: false, product_id: '48e6b33e-0186-453f-94b5-54fa4286ebb7' },
      { id: 'size-redbulls-xl', size: 'XL', stock: 4, is_out_of_stock: false, product_id: '48e6b33e-0186-453f-94b5-54fa4286ebb7' }
    ]
  },
  // DBZ Printed T-shirt (Goku)
  '73f19a06-ba9e-4264-a4cb-36957275ee77': {
    id: '73f19a06-ba9e-4264-a4cb-36957275ee77',
    name: 'URB_N Dragon Ball Z Printed T-shirt (Goku)',
    brand: 'URB_N',
    description: 'Power up your wardrobe. Part of our exclusive anime capsule, this heather grey tee displays Goku in a dynamic battle stance. Engineered with a premium cotton-poly blend that maintains fit and feels incredibly soft.',
    price: 599,
    original_price: 799,
    category: 'men',
    rating: 4.9,
    review_count: 215,
    is_featured: false,
    is_trending: true,
    is_active: true,
    tags: ['T-Shirts', 'Casual', 'Trending', 'Anime'],
    created_at: '2026-06-07T12:00:00.000Z',
    colors: [
      {
        id: 'color-goku-grey',
        color_name: 'Grey',
        hex_code: '#9e9e9e',
        image_url: 'https://res.cloudinary.com/dlikkemff/image/upload/v1780919749/fashionverse/products/csika3i4pdgzko4hdfv4.jpg',
        product_id: '73f19a06-ba9e-4264-a4cb-36957275ee77'
      }
    ],
    sizes: [
      { id: 'size-goku-s', size: 'S', stock: 6, is_out_of_stock: false, product_id: '73f19a06-ba9e-4264-a4cb-36957275ee77' },
      { id: 'size-goku-m', size: 'M', stock: 11, is_out_of_stock: false, product_id: '73f19a06-ba9e-4264-a4cb-36957275ee77' },
      { id: 'size-goku-l', size: 'L', stock: 12, is_out_of_stock: false, product_id: '73f19a06-ba9e-4264-a4cb-36957275ee77' },
      { id: 'size-goku-xl', size: 'XL', stock: 8, is_out_of_stock: false, product_id: '73f19a06-ba9e-4264-a4cb-36957275ee77' }
    ]
  },
  // Naruto Printed T-shirt (appended)
  '8b1a3c6d-9945-4f3e-a21c-d0b933599142': {
    id: '8b1a3c6d-9945-4f3e-a21c-d0b933599142',
    name: 'URB_N Naruto Printed T-shirt',
    brand: 'URB_N',
    description: 'Represent the Hidden Leaf. This stylish mint green streetwear tee features a premium line-art print of Naruto. Cut in a modern oversized fit from high-quality soft combed cotton, designed for peak comfort.',
    price: 699,
    original_price: 899,
    category: 'men',
    rating: 4.9,
    review_count: 184,
    is_featured: false,
    is_trending: true,
    is_active: true,
    tags: ['T-Shirts', 'Casual', 'Trending', 'Anime'],
    created_at: '2026-06-07T12:00:00.000Z',
    colors: [
      {
        id: 'color-naruto-mint',
        color_name: 'Mint Green',
        hex_code: '#a5d6a7',
        image_url: 'https://res.cloudinary.com/dlikkemff/image/upload/v1780919751/fashionverse/products/mmxe3q1btecwpvtw6bdp.jpg',
        product_id: '8b1a3c6d-9945-4f3e-a21c-d0b933599142'
      }
    ],
    sizes: [
      { id: 'size-naruto-s', size: 'S', stock: 15, is_out_of_stock: false, product_id: '8b1a3c6d-9945-4f3e-a21c-d0b933599142' },
      { id: 'size-naruto-m', size: 'M', stock: 10, is_out_of_stock: false, product_id: '8b1a3c6d-9945-4f3e-a21c-d0b933599142' },
      { id: 'size-naruto-l', size: 'L', stock: 18, is_out_of_stock: false, product_id: '8b1a3c6d-9945-4f3e-a21c-d0b933599142' },
      { id: 'size-naruto-xl', size: 'XL', stock: 7, is_out_of_stock: false, product_id: '8b1a3c6d-9945-4f3e-a21c-d0b933599142' }
    ]
  }
};

const CLEANED_MENS_PRODUCTS_INFO: Record<string, { name: string; brand: string; description: string }> = {
  '6ea3734d-9945-4f3e-a21c-d0b933599142': {
    name: 'Mandarin Collar Cotton Shirt',
    brand: 'US Polo Assn',
    description: 'Elegantly tailored with a classic mandarin collar, this premium cotton-linen shirt offers breathable comfort and a refined, contemporary look.'
  },
  'f6019691-5e39-4c5e-ab95-3b675c0f0e86': {
    name: 'Performance Fit Track Pants',
    brand: 'Technosport',
    description: 'Designed for effortless movement, these sleek track pants are crafted from moisture-wicking stretch fabric, featuring secure pockets and an adjustable waistband.'
  },
  '6be6d1ca-a953-4b2c-8c87-e5b3dcca575f': {
    name: 'Slim Fit Solid Formal Shirt',
    brand: 'Raymond',
    description: 'A quintessential addition to your formal wardrobe. Meticulously cut in a sharp slim fit from double-ply premium cotton, delivering a crisp look all day.'
  },
  '4df9e60d-368a-49d8-a5fa-4a89724693de': {
    name: 'Textured Cotton Casual Shirt',
    brand: 'Urbano',
    description: 'An everyday essential. This regular-fit casual shirt is made from soft, garment-washed cotton, featuring a textured weave and clean button-down front.'
  },
  '3b0ebae8-e20d-481a-8000-12f306572603': {
    name: 'Classic Oxford Casual Shirt',
    brand: 'Max',
    description: 'Versatile and timeless, this slim-fit casual shirt is crafted from durable oxford cotton, offering a relaxed yet polished silhouette.'
  },
  '6678fe85-dd39-40fb-acdc-5c586adb3b9e': {
    name: 'Loose Baggy Heavy Wash Jeans',
    brand: 'Urbano',
    description: 'Inspired by vintage streetwear, these baggy-fit jeans are constructed from heavy-washed premium denim, offering authentic character and a relaxed drape.'
  },
  '02fc92ff-e71d-4c37-8985-b720d327b3a8': {
    name: 'Tailored Linen Casual Trousers',
    brand: 'Smowkly',
    description: 'Lightweight and exceptionally comfortable, these trousers are tailored from premium linen-cotton blend. Ideal for warm weather gatherings and casual style.'
  },
  'ce082c45-ac92-493e-bad6-4cc38d6d162e': {
    name: 'Signature Utility Cargo Pants',
    brand: 'Lymio',
    description: 'Streetwear meets utility. These cargo pants feature robust cotton construction, multiple functional pockets, and a clean regular fit.'
  },
  'df341c0c-cad4-4705-9950-3fe914a12c3b': {
    name: 'Classic Tailored Cotton Shorts',
    brand: 'Lymio',
    description: 'Perfectly proportioned for casual days, these shorts are made from lightweight cotton twill for all-day comfort and easy styling.'
  }
};

function modifySingleProduct(p: any): any {
  if (!p || typeof p !== 'object') return p;
  
  const id = p.id;
  if (MOCK_MENS_PRODUCTS[id as keyof typeof MOCK_MENS_PRODUCTS]) {
    const mockTee = MOCK_MENS_PRODUCTS[id as keyof typeof MOCK_MENS_PRODUCTS];
    return {
      ...p,
      ...mockTee,
      product_colors: mockTee.colors,
      product_sizes: mockTee.sizes
    };
  }

  if (CLEANED_MENS_PRODUCTS_INFO[id as keyof typeof CLEANED_MENS_PRODUCTS_INFO]) {
    const cleanedInfo = CLEANED_MENS_PRODUCTS_INFO[id as keyof typeof CLEANED_MENS_PRODUCTS_INFO];
    return {
      ...p,
      ...cleanedInfo
    };
  }

  return p;
}

function modifyProductsData(data: any): any {
  if (Array.isArray(data)) {
    let modified = data.map(modifySingleProduct);
    const containsMen = modified.some(p => p.category === 'men');
    const containsNaruto = modified.some(p => p.id === '8b1a3c6d-9945-4f3e-a21c-d0b933599142');
    if (containsMen && !containsNaruto) {
      modified.push(MOCK_MENS_PRODUCTS['8b1a3c6d-9945-4f3e-a21c-d0b933599142']);
    }
    return modified;
  } else if (data && typeof data === 'object') {
    const id = data.id;
    if (id === '8b1a3c6d-9945-4f3e-a21c-d0b933599142') {
      return MOCK_MENS_PRODUCTS['8b1a3c6d-9945-4f3e-a21c-d0b933599142'];
    }
    return modifySingleProduct(data);
  }
  return data;
}

// ─── GLOBAL NETWORK FETCH INTERCEPTOR ────────────────────────

if (typeof globalThis !== 'undefined' && globalThis.fetch) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async function (input: any, init: any) {
    const url = typeof input === 'string' ? input : (input && (input.url || input.href)) || '';
    if (typeof url === 'string' && url.includes('/rest/v1/products')) {
      const response = await originalFetch.apply(this, arguments as any);
      if (response.ok) {
        const clone = response.clone();
        try {
          const text = await clone.text();
          let data = JSON.parse(text);
          data = modifyProductsData(data);
          return new Response(JSON.stringify(data), {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
          });
        } catch (e) {
          return response;
        }
      }
      return response;
    }
    return originalFetch.apply(this, arguments as any);
  };
}

let supabase: SupabaseClient;

if (isConfigured) {
  supabase = createClient(supabaseUrl!, supabaseAnonKey!);
} else {
  // Create a minimal mock that won't crash the app
  // All queries will return empty data gracefully
  const mockResponse = { data: null, error: null, count: null };
  const mockAuthUser = { data: { session: null }, error: null };

  const chainable = (): any => {
    const handler: any = () => chainable();
    handler.then = (resolve: any) => resolve(mockResponse);
    handler.select = chainable;
    handler.insert = chainable;
    handler.update = chainable;
    handler.delete = chainable;
    handler.eq = chainable;
    handler.neq = chainable;
    handler.single = chainable;
    handler.order = chainable;
    handler.limit = chainable;
    handler.range = chainable;
    handler.match = chainable;
    handler.in = chainable;
    handler.gte = chainable;
    handler.lte = chainable;
    handler.like = chainable;
    handler.ilike = chainable;
    handler.is = chainable;
    handler.filter = chainable;
    handler.or = chainable;
    handler.not = chainable;
    handler.maybeSingle = () => Promise.resolve(mockResponse);
    return handler;
  };

  supabase = {
    from: () => chainable(),
    auth: {
      getSession: () => Promise.resolve(mockAuthUser),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: { message: 'Supabase not configured' } }),
      signUp: () => Promise.resolve({ data: { user: null, session: null }, error: { message: 'Supabase not configured' } }),
      signInWithOAuth: () => Promise.resolve({ data: { url: null, provider: '' as any }, error: { message: 'Supabase not configured' } }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: (_callback: any) => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
    },
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      }),
    },
  } as unknown as SupabaseClient;
}
export { supabase, isConfigured };
