import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Product } from '../types';
import { slugify } from '../utils/formatters';

export interface UseProductsParams {
  category?: string | null;
  brand?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  searchQuery?: string | null;
  // Legacy / existing params to support ProductListPage
  search?: string | null;
  sort?: string;
  types?: string[];
  priceRange?: string | null;
}

export function useProducts(params: UseProductsParams = {}) {
  const {
    category,
    brand,
    minPrice,
    maxPrice,
    searchQuery,
    search,
    sort = 'newest',
    types = [],
    priceRange,
  } = params;

  // Build reactive filters object for the queryKey
  const filters = {
    category,
    brand,
    minPrice,
    maxPrice,
    searchQuery,
    search,
    sort,
    types,
    priceRange,
  };

  return useInfiniteQuery<Product[]>({
    queryKey: ['products', filters],
    queryFn: async ({ pageParam = 0 }) => {
      const offset = pageParam as number;

      // Select explicit columns and related tables
      let query = supabase
        .from('products')
        .select(`
          id, name, price, original_price, category, brand, rating, review_count, tags, is_featured, is_trending, is_active, created_at,
          product_colors(id, product_id, color_name, hex_code, image_url),
          product_sizes(id, size, stock, is_out_of_stock)
        `)
        .eq('is_active', true);

      // Filters
      if (category) {
        query = query.eq('category', category);
      }
      if (brand) {
        query = query.eq('brand', brand);
      }
      if (minPrice !== undefined && minPrice !== null) {
        query = query.gte('price', minPrice);
      }
      if (maxPrice !== undefined && maxPrice !== null) {
        query = query.lte('price', maxPrice);
      }

      const actualSearch = searchQuery || search;
      if (actualSearch) {
        query = query.ilike('name', `%${actualSearch}%`);
      }

      // Sorting
      if (sort === 'price-asc') {
        query = query.order('price', { ascending: true });
      } else if (sort === 'price-desc') {
        query = query.order('price', { ascending: false });
      } else if (sort === 'name-asc') {
        query = query.order('name', { ascending: true });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // Add pagination range
      query = query.range(offset, offset + 11);

      const { data, error } = await query;
      if (error) throw error;

      let result = (data || []) as any[];

      // Legacy in-memory filters for types and priceRange
      if (priceRange) {
        if (priceRange === 'under50') {
          result = result.filter((p) => p.price < 50);
        } else if (priceRange === '50to100') {
          result = result.filter((p) => p.price >= 50 && p.price <= 100);
        } else if (priceRange === 'over100') {
          result = result.filter((p) => p.price > 100);
        }
      }

      if (types && types.length > 0) {
        result = result.filter((p) => p.tags && p.tags.some((tag: string) => types.includes(tag)));
      }

      // Map to include image_url, slug, colors and sizes properties
      return result.map((p) => ({
        ...p,
        colors: p.product_colors,
        sizes: p.product_sizes,
        image_url: p.product_colors?.[0]?.image_url || null,
        slug: slugify(p.name),
      })) as Product[];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      const offset = lastPageParam as number;
      return lastPage.length === 12 ? offset + 12 : undefined;
    },
    staleTime: 5 * 60 * 1000,
  });
}
