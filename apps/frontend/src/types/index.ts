// Common Types
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pages: number
  limit: number
}

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface ErrorResponse {
  statusCode: number
  message: string | string[]
  error?: string
  timestamp?: string
  path?: string
}

// User Types
export interface User {
  id: string
  email: string
  username: string
  firstName?: string
  lastName?: string
  displayName?: string
  avatar?: string
  about?: string
  phoneNumber?: string
  website?: string
  address?: string
  city?: string
  state?: string
  zipcode?: string
  country?: string
  qualifications?: string
  simbiBalance: number
  usdBalance: number
  rating: number
  reviewsCount: number
  servicesCount: number
  isVerified: boolean
  emailVerified: boolean
  phoneVerified: boolean
  createdAt: string
  updatedAt: string
}

export interface UpdateProfileData {
  firstName?: string
  lastName?: string
  about?: string
  phoneNumber?: string
  website?: string
  address?: string
  city?: string
  state?: string
  zipcode?: string
  qualifications?: string
}

export interface UserSettings {
  disabledNotifications: boolean
  vacationMode: boolean
  enabledFeatures: string[]
}

// Auth Types
export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  firstName?: string
  lastName?: string
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken?: string
}

// Service Types
export enum ServiceKind {
  PHYSICAL = 'PHYSICAL',
  DIGITAL = 'DIGITAL',
  BOTH = 'BOTH'
}

export enum TradingType {
  SIMBIS_ONLY = 'SIMBIS_ONLY',
  MONEY_ONLY = 'MONEY_ONLY',
  BOTH = 'BOTH'
}

export enum ServiceMedium {
  IN_PERSON = 'IN_PERSON',
  ONLINE = 'ONLINE',
  BOTH = 'BOTH'
}

export enum ProcessingTime {
  IMMEDIATE = 'IMMEDIATE',
  ONE_DAY = 'ONE_DAY',
  THREE_DAYS = 'THREE_DAYS',
  ONE_WEEK = 'ONE_WEEK',
  CUSTOM = 'CUSTOM'
}

export enum ShippingType {
  NONE = 'NONE',
  LOCAL_PICKUP = 'LOCAL_PICKUP',
  STANDARD = 'STANDARD',
  EXPRESS = 'EXPRESS'
}

export interface Service {
  id: string
  title: string
  description: string
  kind: ServiceKind
  tradingType: TradingType
  medium?: ServiceMedium
  categoryId?: string
  category?: Category
  tags: string[]
  images: string[]
  simbiPrice?: number
  usdPrice?: number
  estimatedHours?: number
  address?: string
  latitude?: number
  longitude?: number
  radius?: number
  processingTime?: ProcessingTime
  shippingType?: ShippingType
  userId: string
  user?: User
  likesCount: number
  viewsCount: number
  bookingsCount: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateServiceData {
  title: string
  description: string
  kind: ServiceKind
  tradingType: TradingType
  medium?: ServiceMedium
  categoryId?: string
  tags?: string[]
  images?: string[]
  simbiPrice?: number
  usdPrice?: number
  estimatedHours?: number
  address?: string
  latitude?: number
  longitude?: number
  radius?: number
}

export interface UpdateServiceData {
  title?: string
  description?: string
  tags?: string[]
  images?: string[]
  simbiPrice?: number
  usdPrice?: number
}

export interface SearchServicesParams {
  query?: string
  kind?: ServiceKind
  tradingType?: TradingType
  categoryId?: string
  latitude?: number
  longitude?: number
  radius?: number
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// Category Types
export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
  parentId?: string
  children?: Category[]
  servicesCount: number
  createdAt: string
  updatedAt: string
}

// Talk and Message Types
export interface Talk {
  id: string
  subject?: string
  serviceId?: string
  service?: Service
  senderId: string
  sender?: User
  receiverId: string
  receiver?: User
  lastMessageAt?: string
  lastMessage?: Message
  unreadCount: number
  isArchived: boolean
  createdAt: string
  updatedAt: string
}

export interface Message {
  id: string
  talkId: string
  senderId: string
  sender?: User
  content: string
  attachments: string[]
  isRead: boolean
  readAt?: string
  createdAt: string
  updatedAt: string
}

export interface CreateTalkData {
  receiverId: string
  serviceId?: string
  subject?: string
  initialMessage?: string
}

export interface SendMessageData {
  content: string
  attachments?: string[]
}

export interface Offer {
  id: string
  talkId: string
  senderId: string
  sender?: User
  description: string
  simbiAmount?: number
  serviceOffered?: string
  hours?: number
  status: OfferStatus
  expiresAt?: string
  createdAt: string
  updatedAt: string
}

export enum OfferStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  EXPIRED = 'EXPIRED',
  COMPLETED = 'COMPLETED'
}

export interface CreateOfferData {
  description: string
  simbiAmount?: number
  serviceOffered?: string
  hours?: number
}

// Community Types
export interface Community {
  id: string
  name: string
  slug: string
  description: string
  avatar?: string
  banner?: string
  cityName?: string
  stateName?: string
  countryName?: string
  latitude?: number
  longitude?: number
  membersCount: number
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

export interface CommunityMember {
  id: string
  communityId: string
  userId: string
  user?: User
  role: CommunityRole
  joinedAt: string
}

export enum CommunityRole {
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  MEMBER = 'MEMBER'
}

// Review Types
export interface Review {
  id: string
  serviceId?: string
  service?: Service
  reviewerId: string
  reviewer?: User
  reviewedUserId: string
  reviewedUser?: User
  rating: number
  comment?: string
  response?: string
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateReviewData {
  serviceId?: string
  reviewedUserId: string
  rating: number
  comment?: string
}

// Booking Types
export interface Booking {
  id: string
  serviceId: string
  service?: Service
  buyerId: string
  buyer?: User
  sellerId: string
  seller?: User
  status: BookingStatus
  simbiAmount?: number
  usdAmount?: number
  notes?: string
  scheduledFor?: string
  completedAt?: string
  cancelledAt?: string
  cancellationReason?: string
  createdAt: string
  updatedAt: string
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED'
}

// Transaction Types
export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  currency: 'SIMBI' | 'USD'
  senderId?: string
  sender?: User
  receiverId?: string
  receiver?: User
  serviceId?: string
  service?: Service
  bookingId?: string
  booking?: Booking
  status: TransactionStatus
  description?: string
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export enum TransactionType {
  SIMBI_TRANSFER = 'SIMBI_TRANSFER',
  SIMBI_EARNED = 'SIMBI_EARNED',
  SIMBI_SPENT = 'SIMBI_SPENT',
  USD_DEPOSIT = 'USD_DEPOSIT',
  USD_WITHDRAWAL = 'USD_WITHDRAWAL',
  USD_PAYMENT = 'USD_PAYMENT',
  USD_REFUND = 'USD_REFUND',
  PLATFORM_FEE = 'PLATFORM_FEE'
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

// Notification Types
export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, any>
  isRead: boolean
  readAt?: string
  createdAt: string
}

export enum NotificationType {
  MESSAGE = 'MESSAGE',
  BOOKING = 'BOOKING',
  REVIEW = 'REVIEW',
  PAYMENT = 'PAYMENT',
  SYSTEM = 'SYSTEM',
  COMMUNITY = 'COMMUNITY'
}

// Upload Types
export interface UploadResponse {
  url: string
  filename: string
  mimetype: string
  size: number
}

// WebSocket Event Types
export interface WebSocketEvent<T = any> {
  type: string
  data: T
  timestamp: string
}

export interface TypingEvent {
  talkId: string
  userId: string
  isTyping: boolean
}

export interface OnlineStatusEvent {
  userId: string
  isOnline: boolean
  lastSeen?: string
}

// Form Validation Types
export interface ValidationError {
  field: string
  message: string
}

export interface FormState<T> {
  data: T
  errors: Record<keyof T, string>
  isSubmitting: boolean
  isValid: boolean
}
