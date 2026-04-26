import type { Product, ProductCategory, Order, OrderStatus } from '@/lib/types';

export interface ProductFilters {
  category?: ProductCategory;
  vehicleType?: 'auto' | 'moto';
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}

export interface OrderFilters {
  status?: OrderStatus;
  limit?: number;
}

export interface DataAdapter {
  getProducts(filters?: ProductFilters): Promise<Product[]>;
  getProductBySlug(slug: string): Promise<Product | null>;
  getProductById(id: string): Promise<Product | null>;
  getProductsByCategory(category: ProductCategory): Promise<Product[]>;
  getPromotedProducts(): Promise<Product[]>;
  getFeaturedProducts(limit?: number): Promise<Product[]>;
  getCategories(): Promise<string[]>;
  getBrands(): Promise<string[]>;

  createOrder(order: Omit<Order, 'id'>): Promise<string>;
  getOrders(filters?: OrderFilters): Promise<Order[]>;
  getOrderById(id: string): Promise<Order | null>;
  updateOrderStatus(id: string, status: OrderStatus): Promise<void>;
}
