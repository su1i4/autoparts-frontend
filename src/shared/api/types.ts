// Типы, зеркалирующие бэкенд (src/common/enums.ts и сущности). Держать в синхроне.

export type Role = 'CLIENT' | 'SELLER' | 'ADMIN' | 'LOGISTICS' | 'SUPPORT';
export type Language = 'ru' | 'ky' | 'en';
export type Currency = 'KGS' | 'USD' | 'CNY' | 'RUB';
export type UserStatus = 'ACTIVE' | 'BLOCKED' | 'DELETED';
export type SellerType = 'SHOP' | 'SCRAPYARD' | 'PRIVATE';
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';
export type PartCondition = 'NEW' | 'USED';
export type PartOrigin = 'ORIGINAL' | 'ANALOG';
export type ConditionPreference = 'NEW' | 'USED' | 'ANY';
export type RequestStatus = 'DRAFT' | 'PUBLISHED' | 'HAS_OFFERS' | 'OFFER_SELECTED' | 'CLOSED' | 'EXPIRED' | 'CANCELLED';
export type OfferStatus = 'SENT' | 'VIEWED' | 'SELECTED' | 'REJECTED' | 'WITHDRAWN' | 'EXPIRED' | 'REMOVED';
export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'CONFIRMED'
  | 'SHIPPED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTE'
  | 'RETURN'
  | 'REFUNDED';
export type DeliveryMethod = 'PICKUP_POINT' | 'COURIER';
export type ShippingMethod = 'AIR' | 'TRUCK' | 'RAIL' | 'LOCAL';
export type PaymentMethod = 'CARD' | 'ELCART' | 'ODENGI' | 'MBANK' | 'OPTIMA' | 'QR' | 'BANK_TRANSFER' | 'CASH';
export type PaymentStatus = 'CREATED' | 'HOLD' | 'CAPTURED' | 'PAID_OUT' | 'REFUNDED' | 'PARTIALLY_REFUNDED' | 'FAILED';
export type PayoutStatus = 'REQUESTED' | 'PAID' | 'REJECTED';
export type WarehouseType = 'SELLER' | 'CONSOLIDATION' | 'PICKUP_POINT';
export type ShipmentStatus =
  | 'PENDING'
  | 'HANDED_BY_SELLER'
  | 'AT_ORIGIN_WAREHOUSE'
  | 'IN_TRANSIT'
  | 'AT_CUSTOMS'
  | 'AT_DESTINATION_WAREHOUSE'
  | 'HANDED_TO_COURIER'
  | 'DELIVERED'
  | 'CANCELLED';
export type DisputeStatus = 'OPEN' | 'SELLER_RESPONDED' | 'IN_REVIEW' | 'RESOLVED';
export type DisputeResolution = 'REFUND_FULL' | 'REFUND_PARTIAL' | 'PAYOUT_SELLER';
export type ReturnStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'RECEIVED' | 'REFUNDED';
export type CommissionScope = 'GLOBAL' | 'COUNTRY' | 'CATEGORY' | 'SELLER';
export type CommissionType = 'PERCENT' | 'FIXED';
export type ReportTarget = 'REQUEST' | 'OFFER' | 'MESSAGE' | 'USER';

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

interface Base {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export type I18nText = { ru: string; ky?: string; en?: string };

export interface Seller extends Base {
  userId: string;
  type: SellerType;
  displayName: string;
  legalName: string | null;
  inn: string | null;
  verificationStatus: VerificationStatus;
  verificationComment: string | null;
  rating: number;
  reviewsCount: number;
  balanceAvailable: number;
  balanceHold: number;
  payoutDetails: PayoutDetails | null;
  offersPerDayLimit: number | null;
  stores?: Store[];
  documents?: { id: string; type: string; url: string }[];
  user?: User;
}

export interface PayoutDetails {
  method: 'BANK' | 'WALLET';
  bankName?: string;
  accountNumber?: string;
  recipientName?: string;
  bik?: string;
}

export interface User extends Base {
  phone: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  roles: Role[];
  language: Language;
  status: UserStatus;
  city: string | null;
  country: string;
  telegramChatId: string | null;
  chatViolations: number;
  chatRestrictedUntil: string | null;
  seller?: Seller | null;
}

export interface Store extends Base {
  sellerId: string;
  name: string;
  country: string;
  city: string;
  address: string | null;
  description: string | null;
  logoUrl: string | null;
  workingHours: Record<string, string> | null;
  viewsCount: number;
  isActive: boolean;
  seller?: Pick<Seller, 'id' | 'displayName' | 'rating' | 'reviewsCount' | 'type' | 'verificationStatus'>;
}

export interface Category extends Base {
  slug: string;
  name: I18nText;
  parentId: string | null;
  sort: number;
  isActive: boolean;
}

export interface CarMake extends Base {
  name: string;
}
export interface CarModel extends Base {
  makeId: string;
  name: string;
}

export interface VinDecode {
  vin: string;
  valid: boolean;
  make: string | null;
  model: string | null;
  year: number | null;
  trim: string | null;
  engine: string | null;
  transmission: string | null;
  drive: string | null;
  bodyType: string | null;
  country: string | null;
  source: string;
  recognized: boolean;
}

export interface Vehicle extends Base {
  userId: string;
  vin: string | null;
  frameNumber: string | null;
  make: string;
  model: string;
  year: number | null;
  engine: string | null;
  transmission: string | null;
  drive: string | null;
  nickname: string | null;
}

export interface Compatibility {
  id?: string;
  make: string;
  model?: string | null;
  yearFrom?: number | null;
  yearTo?: number | null;
  engine?: string | null;
}

export interface Part extends Base {
  storeId: string;
  sellerId: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  oemNumbers: string[];
  brand: string | null;
  condition: PartCondition;
  origin: PartOrigin;
  photos: string[];
  price: number;
  currency: Currency;
  stock: number;
  weightKg: number | null;
  isActive: boolean;
  store?: Store & { seller?: Seller };
  category?: Category | null;
  compatibility?: Compatibility[];
}

export interface PartRequest extends Base {
  clientId?: string;
  vehicleId: string | null;
  vin: string | null;
  frameNumber: string | null;
  make: string;
  model: string | null;
  year: number | null;
  engine: string | null;
  title: string;
  description: string | null;
  oemNumber: string | null;
  photos: string[];
  categoryId: string | null;
  category?: Category | null;
  condition: ConditionPreference;
  originCountry: string;
  budget: number | null;
  budgetCurrency: Currency;
  desiredDate: string | null;
  country: string;
  city: string | null;
  status: RequestStatus;
  publishedAt: string | null;
  expiresAt: string | null;
  offersCount: number;
  selectedOfferId: string | null;
  closedReason: string | null;
  // лента продавца
  matchesAssortment?: boolean;
  myOfferId?: string | null;
  myOffer?: Offer | null;
  client?: User;
}

export interface Offer extends Base {
  requestId: string;
  sellerId: string;
  storeId: string;
  partId: string | null;
  title: string;
  price: number;
  currency: Currency;
  priceKgs: number;
  condition: PartCondition;
  origin: PartOrigin;
  brand: string | null;
  deliveryDays: number;
  warrantyDays: number;
  photos: string[];
  comment: string | null;
  weightKg: number | null;
  shipFromCountry: string;
  status: OfferStatus;
  viewedAt: string | null;
  seller?: Pick<Seller, 'id' | 'displayName' | 'type' | 'rating' | 'reviewsCount' | 'verificationStatus'>;
  store?: Pick<Store, 'id' | 'name' | 'country' | 'city'>;
  request?: PartRequest;
}

export interface DeliveryAddress {
  city: string;
  address?: string;
  recipientName?: string;
  recipientPhone?: string;
  comment?: string;
}

export interface OrderHistory {
  id: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  actorId: string | null;
  note: string | null;
  createdAt: string;
}

export interface Order extends Base {
  number: string;
  /** только в GET /orders/:id */
  reviewed?: boolean;
  disputeId?: string | null;
  clientId: string;
  sellerId: string;
  storeId: string;
  requestId: string | null;
  offerId: string | null;
  partId: string | null;
  title: string;
  quantity: number;
  goodsPrice: number;
  goodsCurrency: Currency;
  exchangeRate: number;
  goodsAmount: number;
  shippingAmount: number;
  commissionAmount: number;
  totalAmount: number;
  sellerPayoutAmount: number;
  refundedAmount: number;
  deliveryMethod: DeliveryMethod;
  shippingMethod: ShippingMethod;
  pickupPointId: string | null;
  deliveryAddress: DeliveryAddress;
  shipFromCountry: string;
  weightKg: number | null;
  status: OrderStatus;
  paidAt: string | null;
  deliveredAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  history?: OrderHistory[];
}

export interface Quote {
  title: string;
  quantity: number;
  price: number;
  currency: Currency;
  exchangeRate: number;
  goodsAmount: number;
  shippingAmount: number;
  shippingMethod: ShippingMethod;
  shippingDays: { min: number; max: number };
  totalAmount: number;
}

export interface ShippingOption {
  method: ShippingMethod;
  chargeableWeightKg: number;
  transportPrice: number;
  courierFee: number;
  total: number;
  daysMin: number;
  daysMax: number;
}

export interface Payment extends Base {
  orderId: string;
  amount: number;
  method: PaymentMethod;
  provider: string;
  status: PaymentStatus;
  providerTxId: string | null;
  refundedAmount: number;
}

export interface PayInit {
  payment: Payment;
  redirectUrl?: string;
  instructions?: string;
}

export interface Warehouse extends Base {
  name: string;
  type: WarehouseType;
  country: string;
  city: string;
  address: string;
  isActive: boolean;
}

export interface ShipmentEvent {
  id: string;
  status: ShipmentStatus;
  location: string | null;
  note: string | null;
  photos: string[];
  createdAt: string;
}

export interface Shipment extends Base {
  orderId: string;
  trackingNumber: string;
  externalTrackingNumber: string | null;
  carrier: string | null;
  method: ShippingMethod;
  fromCountry: string;
  toCountry: string;
  originWarehouseId: string | null;
  destinationWarehouseId: string | null;
  deliveryMethod: DeliveryMethod;
  consolidationId: string | null;
  weightKg: number | null;
  dimensions: { l: number; w: number; h: number } | null;
  cost: number;
  status: ShipmentStatus;
  events?: ShipmentEvent[];
}

export interface PublicTracking {
  trackingNumber: string;
  status: ShipmentStatus;
  statusLabel: string;
  method: ShippingMethod;
  route: string;
  events: { status: ShipmentStatus; label: string; location: string | null; at: string }[];
}

export interface Consolidation extends Base {
  code: string;
  originWarehouseId: string;
  destinationWarehouseId: string;
  method: ShippingMethod;
  carrier: string | null;
  trackingNumber: string | null;
  status: ShipmentStatus;
  shippedAt: string | null;
}

export interface Chat extends Base {
  type: 'REQUEST' | 'DISPUTE';
  requestId: string | null;
  offerId: string | null;
  orderId: string | null;
  disputeId: string | null;
  clientId: string;
  sellerId: string | null;
  sellerUserId: string | null;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  unread?: number;
  requestTitle?: string | null;
  orderNumber?: string | null;
  counterpartName?: string;
  isClosed: boolean;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string | null;
  senderRole: 'CLIENT' | 'SELLER' | 'SUPPORT' | 'SYSTEM';
  text: string;
  photos: string[];
  status: 'SENT' | 'BLOCKED' | 'HIDDEN';
  flags: string[];
  originalText?: string | null;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, string> | null;
  channels: string[];
  readAt: string | null;
  createdAt: string;
}

export interface Evidence {
  byUserId: string;
  role: 'CLIENT' | 'SELLER' | 'SUPPORT';
  text?: string;
  photos: string[];
  at: string;
}

export interface Dispute extends Base {
  orderId: string;
  clientId: string;
  sellerId: string;
  initiatorId: string;
  reason: string;
  description: string;
  evidence: Evidence[];
  status: DisputeStatus;
  resolution: DisputeResolution | null;
  refundAmount: number | null;
  resolutionComment: string | null;
  assignedToId: string | null;
  resolvedAt: string | null;
  chatId: string | null;
}

export interface ReturnRequest extends Base {
  orderId: string;
  clientId: string;
  sellerId: string;
  reason: string;
  description: string | null;
  photos: string[];
  method: string;
  cost: number;
  status: ReturnStatus;
  refundAmount: number | null;
  adminComment: string | null;
}

export interface Review extends Base {
  orderId: string;
  authorId: string;
  sellerId: string;
  rating: number;
  text: string | null;
  photos: string[];
  sellerReply: string | null;
  sellerReplyAt: string | null;
  isHidden: boolean;
}

export interface Balance {
  available: number;
  hold: number;
  payoutPending: number;
  currency: 'KGS';
  minPayout: number;
  payoutDetails: PayoutDetails | null;
}

export interface LedgerEntry {
  id: string;
  txId: string;
  account: string;
  amount: number;
  operation: string;
  orderId: string | null;
  paymentId: string | null;
  payoutId: string | null;
  description: string | null;
  createdAt: string;
}

export interface Payout extends Base {
  sellerId: string;
  amount: number;
  status: PayoutStatus;
  details: PayoutDetails;
  bankReference: string | null;
  comment: string | null;
  processedAt: string | null;
}

export interface SellerStats {
  storeViews: number;
  offersTotal: number;
  offersSelected: number;
  ordersTotal: number;
  ordersCompleted: number;
  revenue: number;
  conversion: number;
  rating: number;
  reviewsCount: number;
  balanceAvailable: number;
  balanceHold: number;
}

export interface CommissionRule extends Base {
  scope: CommissionScope;
  categoryId: string | null;
  sellerId: string | null;
  country: string | null;
  type: CommissionType;
  value: number;
  validFrom: string;
  validTo: string | null;
  isActive: boolean;
  previousId: string | null;
  note: string | null;
}

export interface ShippingTariff extends Base {
  fromCountry: string;
  toCountry: string;
  method: ShippingMethod;
  pricePerKg: number;
  minPrice: number;
  volumetricDivisor: number;
  surchargePercent: number;
  daysMin: number;
  daysMax: number;
  isActive: boolean;
}

export interface AuditLog {
  id: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  payload: Record<string, unknown> | null;
  createdAt: string;
}

export interface UserBlock extends Base {
  userId: string;
  reason: string;
  until: string | null;
  isActive: boolean;
  appealText: string | null;
  appealStatus: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
  appealResponse: string | null;
  user?: User;
}

export interface Report extends Base {
  targetType: ReportTarget;
  targetId: string;
  reporterId: string;
  reason: string;
  status: 'OPEN' | 'RESOLVED' | 'DISMISSED';
  resolution: string | null;
}

export interface BlacklistEntry extends Base {
  type: 'PHONE' | 'DEVICE';
  value: string;
  reason: string | null;
}

export interface AdminStats {
  users: number;
  usersToday: number;
  sellersVerified: number;
  sellersPending: number;
  requestsOpen: number;
  requestsToday: number;
  offersToday: number;
  avgOffersPerRequest: number;
  gmv: number;
  commissionRevenue: number;
  escrowBalance: number;
  disputesOpen: number;
  payoutsPending: number;
  blockedMessages7d: number;
  ordersByStatus: Record<string, number>;
}

export interface Reconcile {
  ok: boolean;
  total: number;
  balances: { account: string; balance: number }[];
  unbalancedTx: unknown[];
  sellerMismatch: unknown[];
}
