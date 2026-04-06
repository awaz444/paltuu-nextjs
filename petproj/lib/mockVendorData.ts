// lib/mockVendorData.ts

export interface VendorInventoryItem {
  inventory_id: number;
  product_id: number;
  title: string;
  image_url?: string;
  sku: string;
  selling_price: number;
  original_price: number;
  discount_percent: number;
  is_available: boolean;
  stock_count?: number;
}

export type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'dispatched' | 'delivered' | 'cancelled';

export interface VendorOrderItem {
  product_title: string;
  quantity: number;
  price: number;
}

export interface VendorOrder {
  order_id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  address_summary: string;
  items: VendorOrderItem[];
  total_amount: number;
  status: OrderStatus;
  created_at: string;
}

export interface VendorData {
  vendor_id?: number;
  user_id?: number;
  shop_name: string;
  address: string;
  area: string;
  city_id: number;
  contact_number: string;
  whatsapp_number: string;
  logo_url?: string;

  // Delivery settings
  delivery_polygon: any;             // GeoJSON polygon
  flat_delivery_fee: number;
  per_kg_delivery_fee: number;
  max_delivery_weight_kg: number;
  free_delivery_threshold: number;

  // Platform settings
  platform_fee_percent: number;
  is_active: boolean;
  is_verified: boolean;

  // Inventory (Mocked for current session)
  inventory: VendorInventoryItem[];
  
  // Orders (Mocked)
  orders: VendorOrder[];
}

export const initialMockVendorData: VendorData = {
  vendor_id: 1,
  user_id: 101,
  shop_name: "Paltuu Pet Marketplace",
  address: "Street 12, Block B, Model Town",
  area: "Model Town",
  city_id: 1,
  contact_number: "+92 333 1122334",
  whatsapp_number: "+92 300 5566778",
  logo_url: "/maroonLogo.png",

  delivery_polygon: {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [73.0, 33.6],
          [73.1, 33.6],
          [73.1, 33.7],
          [73.0, 33.7],
          [73.0, 33.6]
        ]
      ]
    },
    properties: {}
  },
  flat_delivery_fee: 200,
  per_kg_delivery_fee: 20,
  max_delivery_weight_kg: 30,
  free_delivery_threshold: 5000,

  platform_fee_percent: 9,
  is_active: true,
  is_verified: true,

  inventory: [],
  orders: [
    {
      order_id: 5001,
      order_number: "paltuu-X7Y2Z1",
      customer_name: "Umer Farooq",
      customer_phone: "0321-4567890",
      address_summary: "House 45, Street 2, DHA Phase 6, Islamabad",
      total_amount: 2450,
      status: "pending",
      created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      items: [
        { product_title: "Royal Canin Fit 32 - 2kg", quantity: 1, price: 1850 },
        { product_title: "Pedigree Dentastix", quantity: 2, price: 300 }
      ]
    },
    {
      order_id: 5002,
      order_number: "paltuu-A9B8C7",
      customer_name: "Ayesha Khan",
      customer_phone: "0300-1122334",
      address_summary: "Flat 12, Block C, Gulberg III, Lahore",
      total_amount: 1200,
      status: "preparing",
      created_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      items: [
        { product_title: "Cat Litter - 5kg", quantity: 1, price: 1200 }
      ]
    }
  ]
};
