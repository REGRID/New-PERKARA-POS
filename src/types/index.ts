// TypeScript Interfaces for New PERKARA POS Superapp Ecosystem

export type UserRole = 'superadmin' | 'owner' | 'manager' | 'cashier' | 'kitchen';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  address?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  pinCode?: string;
  baseSalary?: number;
}

export interface Category {
  id: string;
  tenantId: string;
  name: string;
  sortOrder: number;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  priceAdjustment: number;
  sku?: string;
}

export interface Product {
  id: string;
  tenantId: string;
  categoryId?: string;
  sku?: string;
  name: string;
  description?: string;
  basePrice: number;
  imageUrl?: string;
  isActive: boolean;
  variants?: ProductVariant[];
}

export interface AddonItem {
  id: string;
  addonCategoryId: string;
  name: string;
  price: number;
}

export interface AddonCategory {
  id: string;
  tenantId: string;
  name: string;
  isRequired: boolean;
  allowMultiple: boolean;
  items?: AddonItem[];
}

export interface RawMaterial {
  id: string;
  tenantId: string;
  sku?: string;
  name: string;
  buyUnit: string;      // e.g. Karton, Kg, Pack
  useUnit: string;      // e.g. gram, ml, pcs
  conversionRatio: number; // 1 buyUnit = X useUnit
  currentStock: number;  // in useUnit
  minStockAlert: number;
  costPerUseUnit: number; // Moving Average HPP
  expiryDate?: string;
}

export interface Recipe {
  id: string;
  productId?: string;
  variantId?: string;
  rawMaterialId: string;
  quantityUsed: number; // in rawMaterial.useUnit
}

export interface AddonRecipe {
  id: string;
  addonItemId: string;
  rawMaterialId: string;
  quantityUsed: number; // in rawMaterial.useUnit
}

export interface StockAdjustment {
  id: string;
  tenantId: string;
  rawMaterialId: string;
  rawMaterialName?: string;
  systemStock: number;
  actualStock: number;
  variance: number;
  reason: 'WASTE' | 'SPILLAGE' | 'EXPIRED' | 'THEFT' | 'SYSTEM_CORRECTION';
  notes?: string;
  adjustedBy?: string;
  createdAt: string;
}

export interface SpillageLog {
  id: string;
  tenantId: string;
  rawMaterialId: string;
  rawMaterialName?: string;
  quantity: number;
  reason: string;
  reportedBy?: string;
  createdAt: string;
}

export interface ReceiptItem {
  id: string;
  receiptId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  categoryId?: string;
  rawMaterialId?: string;
  isStockItem: boolean;
  sku?: string;
}

export interface PhotoReceipt {
  id: string;
  tenantId: string;
  imageUrl: string;
  vendorName?: string;
  receiptDate: string;
  totalAmount: number;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  uploadedBy?: string;
  verifiedBy?: string;
  items?: ReceiptItem[];
  createdAt: string;
}

export interface OpexRecord {
  id: string;
  tenantId: string;
  categoryName: string;
  amount: number;
  expenseDate: string;
  receiptId?: string;
  notes?: string;
  createdAt: string;
}

export interface EmployeeAttendance {
  id: string;
  tenantId: string;
  userId: string;
  userName?: string;
  clockIn: string;
  clockOut?: string;
  status: 'ON_TIME' | 'LATE' | 'EARLY_LEAVE';
  lateMinutes: number;
  overtimeMinutes: number;
  notes?: string;
}

export interface CashierShift {
  id: string;
  tenantId: string;
  cashierId: string;
  cashierName?: string;
  attendanceId?: string;
  startTime: string;
  endTime?: string;
  startingCash: number;
  expectedCash: number;
  actualCash: number;
  difference: number;
  status: 'OPEN' | 'CLOSED';
}

export type OrderChannel = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'SHOPEE_FOOD' | 'GOFOOD' | 'GRABFOOD';

export interface OrderItemAddon {
  id: string;
  orderItemId: string;
  addonItemId?: string;
  addonName: string;
  unitPrice: number;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId?: string;
  variantId?: string;
  productName: string;
  variantName?: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  cogsAmount: number;
  notes?: string;
  addons?: OrderItemAddon[];
}

export interface OrderPayment {
  id: string;
  orderId: string;
  paymentMethod: 'CASH' | 'QRIS' | 'TRANSFER' | 'EDC_CARD' | 'EWALLET';
  amountPaid: number;
  changeAmount: number;
  referenceNumber?: string;
}

export interface Order {
  id: string;
  tenantId: string;
  orderNumber: string;
  cashierShiftId?: string;
  channel: OrderChannel;
  externalOrderId?: string;
  customerName?: string;
  tableNumber?: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paymentStatus: 'UNPAID' | 'PAID' | 'CANCELLED' | 'REFUNDED';
  orderStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
  items?: OrderItem[];
  payments?: OrderPayment[];
  createdAt: string;
}
