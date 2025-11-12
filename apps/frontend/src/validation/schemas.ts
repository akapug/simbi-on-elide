import { z } from 'zod'

// Auth Schemas
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
})

// Service Schemas
export const createServiceSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title must be less than 100 characters'),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(5000, 'Description must be less than 5000 characters'),
  kind: z.enum(['PHYSICAL', 'DIGITAL', 'BOTH']),
  tradingType: z.enum(['SIMBIS_ONLY', 'MONEY_ONLY', 'BOTH']),
  medium: z.enum(['IN_PERSON', 'ONLINE', 'BOTH']).optional(),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  images: z.array(z.string().url('Invalid image URL')).optional(),
  simbiPrice: z.number().min(0, 'Price must be positive').optional(),
  usdPrice: z.number().min(0, 'Price must be positive').optional(),
  estimatedHours: z.number().min(0, 'Hours must be positive').optional(),
  address: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radius: z.number().min(0).max(500).optional(),
})

export const updateServiceSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title must be less than 100 characters')
    .optional(),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(5000, 'Description must be less than 5000 characters')
    .optional(),
  tags: z.array(z.string()).optional(),
  images: z.array(z.string().url('Invalid image URL')).optional(),
  simbiPrice: z.number().min(0, 'Price must be positive').optional(),
  usdPrice: z.number().min(0, 'Price must be positive').optional(),
})

// Profile Schemas
export const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  about: z.string().max(1000, 'About must be less than 1000 characters').optional(),
  phoneNumber: z
    .string()
    .regex(/^\+?[\d\s-()]+$/, 'Invalid phone number format')
    .optional(),
  website: z.string().url('Invalid website URL').optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipcode: z.string().optional(),
  qualifications: z.string().max(2000, 'Qualifications must be less than 2000 characters').optional(),
})

// Talk/Message Schemas
export const createTalkSchema = z.object({
  receiverId: z.string().min(1, 'Receiver is required'),
  serviceId: z.string().optional(),
  subject: z.string().max(200, 'Subject must be less than 200 characters').optional(),
  initialMessage: z.string().max(5000, 'Message must be less than 5000 characters').optional(),
})

export const sendMessageSchema = z.object({
  content: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(5000, 'Message must be less than 5000 characters'),
  attachments: z.array(z.string().url('Invalid attachment URL')).optional(),
})

export const createOfferSchema = z.object({
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be less than 1000 characters'),
  simbiAmount: z.number().min(0, 'Amount must be positive').optional(),
  serviceOffered: z.string().optional(),
  hours: z.number().min(0, 'Hours must be positive').optional(),
})

// Review Schema
export const createReviewSchema = z.object({
  serviceId: z.string().optional(),
  reviewedUserId: z.string().min(1, 'Reviewed user is required'),
  rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  comment: z.string().max(1000, 'Comment must be less than 1000 characters').optional(),
})

// Search Schema
export const searchServicesSchema = z.object({
  query: z.string().optional(),
  kind: z.enum(['PHYSICAL', 'DIGITAL', 'BOTH']).optional(),
  tradingType: z.enum(['SIMBIS_ONLY', 'MONEY_ONLY', 'BOTH']).optional(),
  categoryId: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radius: z.number().min(1).max(100).optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
})

// Export type inference helpers
export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type CreateServiceFormData = z.infer<typeof createServiceSchema>
export type UpdateServiceFormData = z.infer<typeof updateServiceSchema>
export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>
export type CreateTalkFormData = z.infer<typeof createTalkSchema>
export type SendMessageFormData = z.infer<typeof sendMessageSchema>
export type CreateOfferFormData = z.infer<typeof createOfferSchema>
export type CreateReviewFormData = z.infer<typeof createReviewSchema>
export type SearchServicesFormData = z.infer<typeof searchServicesSchema>
