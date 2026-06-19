// ═══════════════════════════════════════════════════════════════
// FASHIONVERSE DELIVERY HUB — useDriver Hook
// Provides driver data, Supabase queries, realtime, GPS
// ═══════════════════════════════════════════════════════════════

import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useDriverStore, type DriverDelivery, type CourierCompany } from '../store/driverStore';
import toast from 'react-hot-toast';

// ── Mock courier companies for demo mode ───────────────────
const MOCK_COMPANIES: CourierCompany[] = [
  { id: 'c1', name: 'Shadowfax', logo_url: 'https://logo.clearbit.com/shadowfax.in', brand_color: '#6C3BEB', commission_rate: 15, is_active: true },
  { id: 'c2', name: 'Borzo', logo_url: 'https://logo.clearbit.com/borzo.com', brand_color: '#FF6B00', commission_rate: 15, is_active: true },
  { id: 'c3', name: 'Porter', logo_url: 'https://logo.clearbit.com/porter.in', brand_color: '#F7B731', commission_rate: 15, is_active: true },
  { id: 'c4', name: 'Dunzo', logo_url: 'https://logo.clearbit.com/dunzo.com', brand_color: '#00C853', commission_rate: 15, is_active: true },
  { id: 'c5', name: 'Delhivery', logo_url: 'https://logo.clearbit.com/delhivery.com', brand_color: '#E31837', commission_rate: 15, is_active: true },
  { id: 'c6', name: 'Ecom Express', logo_url: 'https://logo.clearbit.com/ecomexpress.in', brand_color: '#0056A2', commission_rate: 15, is_active: true },
  { id: 'c7', name: 'Xpressbees', logo_url: 'https://logo.clearbit.com/xpressbees.com', brand_color: '#FF6600', commission_rate: 15, is_active: true },
  { id: 'c8', name: 'Shiprocket', logo_url: 'https://logo.clearbit.com/shiprocket.in', brand_color: '#F7C325', commission_rate: 15, is_active: true },
  { id: 'c9', name: 'Bluedart', logo_url: 'https://logo.clearbit.com/bluedart.com', brand_color: '#003366', commission_rate: 15, is_active: true },
  { id: 'c10', name: 'WeFast', logo_url: 'https://logo.clearbit.com/wefast.com', brand_color: '#FF3D00', commission_rate: 15, is_active: true },
];

// ── Geo helpers ────────────────────────────────────────────
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getOrderCoords(orderId: string, hubLat: number, hubLng: number): [number, number] {
  let hash = 0;
  for (let i = 0; i < orderId.length; i++) {
    hash = (hash * 31 + orderId.charCodeAt(i)) & 0xffffffff;
  }
  const latOffset = ((hash & 0xff) / 255 - 0.5) * 0.12;
  const lngOffset = (((hash >> 8) & 0xff) / 255 - 0.5) * 0.12;
  return [hubLat + latOffset, hubLng + lngOffset];
}

export function timeAgo(dateStr: string): string {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Main Hook ──────────────────────────────────────────────
export function useDriver() {
  const { user, profile } = useAuthStore();
  const store = useDriverStore();
  const prevAvailableIds = useRef<Set<string>>(new Set());

  // ── Fetch courier companies ──────────────────────────────
  const fetchCompanies = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('courier_companies')
        .select('id, name, logo_url, brand_color, commission_rate, is_active')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      if (data && data.length > 0) {
        store.setCompanies(data);
      } else {
        store.setCompanies(MOCK_COMPANIES);
      }
    } catch {
      // Fallback to mock companies
      store.setCompanies(MOCK_COMPANIES);
    }
  }, []);

  // ── Fetch orders ─────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    if (!user) return;
    store.setLoading(true);
    try {
      // Try new deliveries table first, fallback to orders table
      let availList: DriverDelivery[] = [];
      let activeList: DriverDelivery[] = [];
      let doneList: DriverDelivery[] = [];

      // Try fetching from 'orders' table (existing schema)
      const { data: avail } = await supabase
        .from('orders')
        .select('id, user_id, status, total_amount, payment_method, coupon_code, discount_amount, created_at, delivery_pin, driver_id, pin_verified, pin_attempts, claimed_at, delivered_at, order_items(id, order_id, product_id, color_name, size, quantity, price)')
        .eq('status', 'packed')
        .is('driver_id', null)
        .order('created_at', { ascending: false });
      availList = (avail || []).map((o: any) => ({
        ...o,
        driver_earnings: Math.round((o.total_amount || 0) * 0.1),
        courier_companies: MOCK_COMPANIES[Math.abs(o.id.charCodeAt(0)) % MOCK_COMPANIES.length],
      }));


      const { data: mine } = await supabase
        .from('orders')
        .select('id, user_id, status, total_amount, payment_method, coupon_code, discount_amount, created_at, delivery_pin, driver_id, pin_verified, pin_attempts, claimed_at, delivered_at, order_items(id, order_id, product_id, color_name, size, quantity, price)')
        .eq('driver_id', user.id)
        .eq('status', 'out_for_delivery')
        .order('claimed_at', { ascending: false });
      activeList = (mine || []).map((o: any) => ({
        ...o,
        driver_earnings: Math.round((o.total_amount || 0) * 0.1),
        courier_companies: MOCK_COMPANIES[Math.abs(o.id.charCodeAt(0)) % MOCK_COMPANIES.length],
      }));


      const { data: done } = await supabase
        .from('orders')
        .select('id, user_id, status, total_amount, payment_method, coupon_code, discount_amount, created_at, delivery_pin, driver_id, pin_verified, pin_attempts, claimed_at, delivered_at, order_items(id, order_id, product_id, color_name, size, quantity, price)')
        .eq('driver_id', user.id)
        .eq('status', 'delivered')
        .order('delivered_at', { ascending: false })
        .limit(50);
      doneList = (done || []).map((o: any) => ({
        ...o,
        driver_earnings: Math.round((o.total_amount || 0) * 0.1),
        courier_companies: MOCK_COMPANIES[Math.abs(o.id.charCodeAt(0)) % MOCK_COMPANIES.length],
      }));

      // Detect new orders for bell notification
      const newIds = new Set(availList.map((o) => o.id));
      const brandNew = availList.filter((o) => !prevAvailableIds.current.has(o.id));
      if (brandNew.length > 0 && prevAvailableIds.current.size > 0) {
        store.setBellShaking(true);
        store.setNewOrderCount(brandNew.length);
        setTimeout(() => store.setBellShaking(false), 600);
      }
      prevAvailableIds.current = newIds;

      store.setAvailableOrders(availList);
      store.setActiveDeliveries(activeList);
      store.setCompletedDeliveries(doneList);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      store.setLoading(false);
    }
  }, [user]);

  // ── Accept order ─────────────────────────────────────────
  const acceptOrder = useCallback(
    async (orderId: string) => {
      if (!user) return false;


      try {
        const { error } = await supabase
          .from('orders')
          .update({
            driver_id: user.id,
            status: 'out_for_delivery',
            claimed_at: new Date().toISOString(),
          })
          .eq('id', orderId)
          .eq('status', 'packed');

        if (error) {
          // Fallback: try without status check
          const { error: e2 } = await supabase
            .from('orders')
            .update({ status: 'out_for_delivery' })
            .eq('id', orderId);
          if (e2) throw e2;
        }

        toast.success('Order accepted!', { icon: '🚀' });
        store.removeAvailableOrder(orderId);
        store.setActiveTab('active');
        await fetchOrders();
        return true;
      } catch (err: any) {
        toast.error(err?.message || 'Failed to accept order');
        return false;
      }
    },
    [user, fetchOrders]
  );

  // ── Verify delivery PIN ──────────────────────────────────
  const verifyDeliveryPin = useCallback(
    async (orderId: string, pin: string): Promise<'success' | 'wrong' | 'locked' | 'error'> => {
      try {
        const { data: orderData } = await supabase
          .from('orders')
          .select('delivery_pin, pin_attempts')
          .eq('id', orderId)
          .single();

        if (!orderData) return 'error';

        if ((orderData.pin_attempts || 0) >= 3) return 'locked';

        if (orderData.delivery_pin === pin) {
          await supabase
            .from('orders')
            .update({
              status: 'delivered',
              pin_verified: true,
              delivered_at: new Date().toISOString(),
            })
            .eq('id', orderId);
          toast.success('Delivery confirmed! 🎉');
          await fetchOrders();
          return 'success';
        } else {
          const attempts = (orderData.pin_attempts || 0) + 1;
          await supabase
            .from('orders')
            .update({ pin_attempts: attempts })
            .eq('id', orderId);
          return attempts >= 3 ? 'locked' : 'wrong';
        }
      } catch {
        return 'error';
      }
    },
    [fetchOrders]
  );

  // ── Computed values ──────────────────────────────────────
  const today = new Date().toDateString();
  const todayCompleted = store.completedDeliveries.filter(
    (o) => o.delivered_at && new Date(o.delivered_at).toDateString() === today
  );
  const todayEarnings = todayCompleted.reduce(
    (sum, o) => sum + (o.driver_earnings || Math.round((o.total_amount || 0) * 0.1)),
    0
  );
  const todayCount = todayCompleted.length;
  const totalDeliveries = store.completedDeliveries.length;
  const totalEarnings = store.completedDeliveries.reduce(
    (sum, o) => sum + (o.driver_earnings || Math.round((o.total_amount || 0) * 0.1)),
    0
  );

  const driverTier =
    totalDeliveries >= 500
      ? 'platinum'
      : totalDeliveries >= 201
      ? 'gold'
      : totalDeliveries >= 51
      ? 'silver'
      : 'bronze';

  // ── Weekly data ──────────────────────────────────────────
  const weeklyData = (() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const now = new Date();
    return days.map((day, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1) + i);
      const ds = d.toDateString();
      const amt = store.completedDeliveries
        .filter((o) => o.delivered_at && new Date(o.delivered_at).toDateString() === ds)
        .reduce((s, o) => s + (o.driver_earnings || Math.round((o.total_amount || 0) * 0.1)), 0);
      const count = store.completedDeliveries.filter(
        (o) => o.delivered_at && new Date(o.delivered_at).toDateString() === ds
      ).length;
      return { day, amt, count, isToday: ds === today };
    });
  })();

  // ── Init: fetch data, start GPS, start polling ──────────
  useEffect(() => {
    fetchCompanies();
    fetchOrders();
  }, [user]);

  // Realtime subscription replacing polling
  useEffect(() => {
    if (!store.isOnline || !user) return;

    const channel = supabase
      .channel('delivery-hub-realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT and UPDATE
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          console.log('🔄 Order changed via Realtime:', payload);
          // Play ping sound for new or updated orders
          if (payload.eventType === 'INSERT' || (payload.eventType === 'UPDATE' && payload.new.status === 'packed')) {
            try {
              new Audio('/ping.mp3').play();
            } catch (e) {
              // Ignore browser block
            }
          }
          // Fetch orders to sync state securely
          fetchOrders();
        }
      )
      .subscribe((status) => {
        console.log('📡 Supabase Realtime:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [store.isOnline, user]);

  // GPS tracking
  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => store.setDriverLocation([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  return {
    user,
    profile,
    ...store,
    fetchOrders,
    acceptOrder,
    verifyDeliveryPin,
    todayEarnings,
    todayCount,
    totalDeliveries,
    totalEarnings,
    driverTier,
    weeklyData,
  };
}
