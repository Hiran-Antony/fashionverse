// ═══════════════════════════════════════════════════════════════
// FASHIONVERSE DELIVERY HUB — Driver Zustand Store
// ═══════════════════════════════════════════════════════════════

import { create } from 'zustand';

export type DriverTab = 'orders' | 'active' | 'done' | 'profile' | 'map';

export interface CourierCompany {
  id: string;
  name: string;
  logo_url: string | null;
  brand_color: string;
  commission_rate: number;
  is_active: boolean;
}

export interface DriverDelivery {
  id: string;
  status: string;
  courier_company_id?: string | null;
  courier_companies?: CourierCompany | null;
  expires_at?: string | null;
  otp_code?: string | null;
  customer_phone?: string | null;
  customer_name?: string | null;
  pickup_address?: string | null;
  drop_address?: string | null;
  pickup_lat?: number | null;
  pickup_lng?: number | null;
  drop_lat?: number | null;
  drop_lng?: number | null;
  delivery_fee?: number;
  driver_earnings?: number;
  distance_km?: number | null;
  duration_min?: number | null;
  assigned_driver_id?: string | null;
  assigned_at?: string | null;
  delivered_at?: string | null;
  created_at: string;
  // Fallback fields from existing orders table
  total_amount?: number;
  address?: any;
  order_items?: any[];
  driver_id?: string | null;
  delivery_pin?: string | null;
  pin_verified?: boolean;
  pin_attempts?: number;
  claimed_at?: string | null;
}

export interface DriverProfile {
  id: string;
  name: string;
  phone?: string;
  avatar_url?: string;
  vehicle_type?: string;
  license_plate?: string;
  bank_account?: string;
  upi_id?: string;
  tier: string;
  rating: number;
  total_deliveries: number;
  total_earned: number;
  status: 'online' | 'offline' | 'on_delivery';
}

export interface DriverState {
  // Tab
  activeTab: DriverTab;
  setActiveTab: (tab: DriverTab) => void;

  // Online status
  isOnline: boolean;
  setOnline: (online: boolean) => void;
  toggleOnline: () => void;

  // Orders
  availableOrders: DriverDelivery[];
  activeDeliveries: DriverDelivery[];
  completedDeliveries: DriverDelivery[];
  setAvailableOrders: (orders: DriverDelivery[]) => void;
  setActiveDeliveries: (orders: DriverDelivery[]) => void;
  setCompletedDeliveries: (orders: DriverDelivery[]) => void;
  addAvailableOrder: (order: DriverDelivery) => void;
  removeAvailableOrder: (orderId: string) => void;

  // Companies
  companies: CourierCompany[];
  setCompanies: (companies: CourierCompany[]) => void;
  selectedCompanyId: string | null; // null = All
  setSelectedCompanyId: (id: string | null) => void;

  // UI state
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  newOrderCount: number;
  setNewOrderCount: (count: number) => void;
  bellShaking: boolean;
  setBellShaking: (shaking: boolean) => void;

  // Location
  driverLocation: [number, number];
  setDriverLocation: (loc: [number, number]) => void;

  // Sidebar (Desktop)
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

// Default: Coimbatore
const DEFAULT_LOCATION: [number, number] = [11.0168, 76.9558];

export const useDriverStore = create<DriverState>()((set) => ({
  activeTab: 'orders',
  setActiveTab: (tab) => set({ activeTab: tab }),

  isOnline: true,
  setOnline: (online) => set({ isOnline: online }),
  toggleOnline: () => set((s) => ({ isOnline: !s.isOnline })),

  availableOrders: [],
  activeDeliveries: [],
  completedDeliveries: [],
  setAvailableOrders: (orders) => set({ availableOrders: orders }),
  setActiveDeliveries: (orders) => set({ activeDeliveries: orders }),
  setCompletedDeliveries: (orders) => set({ completedDeliveries: orders }),
  addAvailableOrder: (order) =>
    set((s) => ({
      availableOrders: [order, ...s.availableOrders],
      newOrderCount: s.newOrderCount + 1,
    })),
  removeAvailableOrder: (orderId) =>
    set((s) => ({
      availableOrders: s.availableOrders.filter((o) => o.id !== orderId),
    })),

  companies: [],
  setCompanies: (companies) => set({ companies }),
  selectedCompanyId: null,
  setSelectedCompanyId: (id) => set({ selectedCompanyId: id }),

  isLoading: true,
  setLoading: (loading) => set({ isLoading: loading }),
  newOrderCount: 0,
  setNewOrderCount: (count) => set({ newOrderCount: count }),
  bellShaking: false,
  setBellShaking: (shaking) => set({ bellShaking: shaking }),

  driverLocation: DEFAULT_LOCATION,
  setDriverLocation: (loc) => set({ driverLocation: loc }),

  isSidebarOpen: false,
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
}));
