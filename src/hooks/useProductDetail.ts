import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Product } from '../types';
import { slugify } from '../utils/formatters';

export function useProductDetail(slugOrId: string | undefined) {
  const queryResult = useQuery<Product | null>({
    queryKey: ['product', slugOrId],
    queryFn: async () => {
      if (!slugOrId) throw new Error('Product identifier is required');

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);

      if (isUuid) {
        // Query by ID
        const { data, error } = await supabase
          .from('products')
          .select(`
            id, name, price, original_price, description, category, brand, rating, review_count, tags, is_featured,
            product_colors (id, product_id, color_name, hex_code, image_url),
            product_sizes (id, size, stock, is_out_of_stock)
          `)
          .eq('id', slugOrId)
          .single();

        if (error) throw error;
        if (!data) return null;

        const colors = data.product_colors || [];
        const sizes = data.product_sizes || [];

        return {
          id: data.id,
          name: data.name,
          price: data.price,
          original_price: data.original_price,
          description: data.description,
          category: data.category as any,
          brand: data.brand,
          rating: data.rating,
          review_count: data.review_count,
          image_url: colors[0]?.image_url || null,
          images: colors.map((c: any) => c.image_url),
          sizes: sizes,
          colors: colors,
          tags: data.tags,
          is_featured: data.is_featured,
          stock: sizes.reduce((sum: number, s: any) => sum + (s.stock || 0), 0),
          slug: slugify(data.name),
        } as unknown as Product;
      } else {
        // Query all active products and filter by slug in-memory
        const { data, error } = await supabase
          .from('products')
          .select(`
            id, name, price, original_price, description, category, brand, rating, review_count, tags, is_featured,
            product_colors (id, product_id, color_name, hex_code, image_url),
            product_sizes (id, size, stock, is_out_of_stock)
          `)
          .eq('is_active', true);

        if (error) throw error;
        if (!data) return null;

        const found = data.find((p: any) => slugify(p.name) === slugOrId);
        if (!found) return null;

        const colors = found.product_colors || [];
        const sizes = found.product_sizes || [];

        return {
          id: found.id,
          name: found.name,
          price: found.price,
          original_price: found.original_price,
          description: found.description,
          category: found.category as any,
          brand: found.brand,
          rating: found.rating,
          review_count: found.review_count,
          image_url: colors[0]?.image_url || null,
          images: colors.map((c: any) => c.image_url),
          sizes: sizes,
          colors: colors,
          tags: found.tags,
          is_featured: found.is_featured,
          stock: sizes.reduce((sum: number, s: any) => sum + (s.stock || 0), 0),
          slug: slugify(found.name),
        } as unknown as Product;
      }
    },
    enabled: !!slugOrId,
    staleTime: 10 * 60 * 1000,
  });

  return {
    product: queryResult.data ?? null,
    data: queryResult.data ?? null,
    isLoading: queryResult.isLoading,
    error: queryResult.error,
    isError: queryResult.isError,
    refetch: queryResult.refetch,
  };
}

export default useProductDetail;
