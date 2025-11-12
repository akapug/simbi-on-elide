/**
 * Database Type Definitions
 * Auto-generated from PostgreSQL schema
 * 68 tables, 6 custom enums
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum CategoryKind {
  SERVICE = 'service',
  PRODUCT = 'product'
}

export enum EmailTemplateEditor {
  HTML = 'html',
  SLIM = 'slim',
  SENDGRID = 'sendgrid'
}

export enum OrganizationMemberRole {
  ADMIN = 'admin',
  MEMBER = 'member',
  MODERATOR = 'moderator'
}

export enum TransferCurrency {
  SIMBI = 'simbi',
  SIMBI_SERVICES = 'simbi_services',
  USD = 'usd'
}

export enum TransferType {
  DEAL_ACCEPTED = 'deal_accepted',
  DEAL_COMPLETED = 'deal_completed',
  DEAL_CANCELLED = 'deal_cancelled',
  CREDITED = 'credited',
  DEPOSITED = 'deposited'
}

export enum UserCategoryExpertStatus {
  ACTIVE = 'active',
  REJECTED = 'rejected',
  EXPERT = 'expert',
  TOP_EXPERT = 'top_expert'
}

// ============================================================================
// BASE TYPES
// ============================================================================

export interface BaseModel {
  id: number;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}

// ============================================================================
// TABLE INTERFACES
// ============================================================================

export interface Account extends BaseModel {
  accountable_type: string;
  accountable_id: number;
  available_balance: number;
  total_balance: number;
}

export interface Badge extends BaseModel {
  user_id?: number;
  kind?: number;
  read_at?: Date | null;
  level?: number;
}

export interface Bot extends BaseModel {
  name: string;
  notes?: string;
}

export interface Category {
  id: number;
  name?: string;
  category_id?: number;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
  description?: string;
  index: number;
  category_tags: number[];
  slug?: string;
  kind: CategoryKind;
}

export interface CategoryTag {
  id: number;
  title?: string;
  description?: string;
  created_at?: Date;
  updated_at?: Date;
  image_file_name?: string;
  image_content_type?: string;
  image_file_size?: number;
  image_updated_at?: Date;
  slug?: string;
  hero_image_file_name?: string;
  hero_image_content_type?: string;
  hero_image_file_size?: number;
  hero_image_updated_at?: Date;
  first_caption?: string;
  second_caption?: string;
  position: number;
  image_fingerprint?: string;
}

export interface Cohort extends BaseModel {
  location?: string;
  radius?: number;
  latitude?: number;
  longitude?: number;
}

export interface Comment extends BaseModel {
  user_id?: number;
  commentable_id?: number;
  commentable_type?: string;
  content?: string;
  hidden_at?: Date | null;
  mentioned_user_ids: number[];
  replied_to_comment_id?: number;
}

export interface Community extends BaseModel {
  name: string;
  subdomain: string;
  description?: string;
  private: boolean;
  location?: string;
  latitude?: number;
  longitude?: number;
  featured: boolean;
  promoted: boolean;
  guidelines_title: string;
  guidelines?: string;
  status?: string;
}

export interface CommunityService {
  id: number;
  community_id: number;
  service_id: number;
  deleted_at?: Date | null;
  created_at: Date;
}

export interface CommunityUser {
  id: number;
  community_id: number;
  user_id: number;
  deleted_at?: Date | null;
  created_at: Date;
  joined: boolean;
  role: number;
  last_visited_at?: Date | null;
  metadata: any;
}

export interface Compliment extends BaseModel {
  service_id?: number;
  author_id?: number;
  kind?: number;
  read_at?: Date | null;
}

export interface Customer extends BaseModel {
  user_id?: number;
  stripe_id?: string;
  shipping_address: any;
  billing_address_same?: boolean;
  subscription: any;
  requested_trial_at?: Date | null;
}

export interface Device {
  id: number;
  user_id?: number;
  token?: string;
  platform?: string;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}

export interface EmailEvent extends BaseModel {
  email?: string;
  message_id?: string;
  user_id?: number;
  categories: string[];
  delivered_at?: Date | null;
  bounced_at?: Date | null;
  spam_reported_at?: Date | null;
  opened_at?: Date | null;
  clicked_at?: Date | null;
  url?: string;
  dropped_at?: Date | null;
  drop_reason?: string;
  bounce_reason?: string;
}

export interface EmailTemplate {
  id: number;
  name?: string;
  subject?: string;
  template?: string;
  users_query?: string;
  services_query?: string;
  schedule?: string;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
  scheduled_at?: Date | null;
  interval?: number;
  repeat: boolean;
  sender?: string;
  notification_kind?: string;
  title?: string;
  preview_text?: string;
  deleted_at?: Date | null;
  sendgrid_id?: string;
  editor: EmailTemplateEditor;
}

export interface Favorite {
  id: number;
  user_id?: number;
  service_id?: number;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}

export interface Flag {
  id: number;
  flaggable_id?: number;
  user_id?: number;
  created_at?: Date;
  updated_at?: Date;
  flaggable_type?: string;
  kind: number;
  reason?: string;
  deleted_at?: Date | null;
  metadata: any;
  owner_id?: number;
}

export interface FriendlyIdSlug {
  id: number;
  slug: string;
  sluggable_id: number;
  sluggable_type?: string;
  scope?: string;
  created_at?: Date;
}

export interface Friendship extends BaseModel {
  user_id?: number;
  friend_id?: number;
  status: string;
}

export interface Identity {
  id: number;
  user_id?: number;
  provider?: string;
  uid?: string;
  created_at?: Date;
  updated_at?: Date;
  auth_data?: string;
  deleted_at?: Date | null;
}

export interface ImageUpload {
  id: number;
  user_id?: number;
  image_file_name?: string;
  image_content_type?: string;
  image_file_size?: number;
  image_updated_at?: Date;
  image_fingerprint?: string;
}

export interface Image {
  id: number;
  imageable_type?: string;
  imageable_id?: number;
  image_file_name?: string;
  image_content_type?: string;
  image_file_size?: number;
  image_updated_at?: Date;
  is_main: boolean;
  created_at?: Date;
  updated_at?: Date;
  caption?: string;
  image_fingerprint?: string;
  position: number;
  deleted_at?: Date | null;
  image_processing?: boolean;
}

export interface Job {
  id: number;
  name?: string;
  user_id?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface LeaderboardHistory {
  id: number;
  user_id?: number;
  score?: number;
  read_at?: Date | null;
  category?: string;
  created_at?: Date;
  deleted_at?: Date | null;
}

export interface LeaderboardPrize {
  id: number;
  name: string;
  title: string;
  message: string;
  month?: Date;
  link?: string;
  image_url?: string;
}

export interface Lead {
  id: number;
  email: string;
  sent_at?: Date | null;
  accepted_at?: Date | null;
  user_id?: number;
  invited_by_id?: number;
  community_id?: number;
  created_at: Date;
}

export interface Like extends BaseModel {
  user_id?: number;
  service_id: number;
  kind?: number;
  read_at?: Date | null;
}

export interface MessageAttachment {
  id: number;
  message_id?: number;
  attachment_file_name?: string;
  attachment_content_type?: string;
  attachment_file_size?: number;
  attachment_updated_at?: Date;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}

export interface Message {
  id: number;
  content?: string;
  author_id?: number;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
  client_id?: string;
}

export interface OfferEvent {
  id: number;
  user_id?: number;
  offer_id?: number;
  accepted_at?: Date | null;
  confirmed_at?: Date | null;
  declined_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
  done_at?: Date | null;
  autoconfirmed?: boolean;
}

export interface OfferItem {
  id: number;
  offer_id?: number;
  simbucks?: number;
  unit_count?: number;
  owner_id?: number;
  created_at?: Date;
  updated_at?: Date;
  service_id?: number;
  term?: string;
  deleted_at?: Date | null;
  kind?: number;
}

export interface Offered {
  id: number;
  user_id?: number;
  category_id?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface Offer {
  id: number;
  status: string;
  created_at?: Date;
  updated_at?: Date;
  due_date?: Date | null;
  owner_id?: number;
  cancel_reason?: string;
  deleted_at?: Date | null;
  within?: number;
  cancel_kind?: number;
  charge_id?: string;
}

export interface OrderItem extends BaseModel {
  order_id?: number;
  owner_id?: number;
  service_id?: number;
  count?: number;
}

export interface Order extends BaseModel {
  status: string;
  author_id?: number;
  processing_time?: number;
  shipping_costs?: number;
  shipping_costs_received_at?: Date | null;
  cancel_reason?: string;
  charge_id?: string;
}

export interface OrganizationMember extends BaseModel {
  role: OrganizationMemberRole;
  user_id?: number;
  organization_id?: number;
}

export interface Page {
  id: number;
  title: string;
  slug: string;
  content: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface Qualification {
  id: number;
  name?: string;
  user_id?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface Rating extends BaseModel {
  user_id?: number;
  author_id?: number;
  talk_id?: number;
  kind: number;
  value?: number;
  talk_item_id?: number;
}

export interface Reference {
  id: number;
  sender_id?: number;
  user_id?: number;
  message?: string;
  token?: string;
  filled_at?: Date | null;
  approved_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
  email?: string;
  deleted_at?: Date | null;
  notified_at?: Date | null;
}

export interface Review {
  id: number;
  message?: string;
  author_id?: number;
  user_id?: number;
  talk_id?: number;
  rating?: number;
  approved_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
  talk_item_id?: number;
}

export interface Reward {
  id: number;
  user_id: number;
  author_id?: number;
  amount?: number;
  title?: string;
  message?: string;
  notified_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}

export interface Score extends BaseModel {
  value?: number;
  scorable_id?: number;
  scorable_type?: string;
  score_formula_id?: number;
  metadata: any;
}

export interface ScoreFormula extends BaseModel {
  title?: string;
  formula?: string;
  query?: string;
  kind: number;
}

export interface SentEmail {
  id: number;
  email_template_id?: number;
  user_id?: number;
  service_id?: number;
  sent_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
  template_kind?: number;
}

export interface Service {
  id: number;
  user_id?: number;
  category_id?: number;
  name: string;
  description: string;
  price?: number;
  unit_id?: number;
  qualification?: string;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
  kind: number;
  secondary_category_id?: number;
  slug?: string;
  virtual?: boolean;
  homepage_order?: number;
  featured: boolean;
  preferences?: string;
  tags: string[];
  no_image: boolean;
  promoted: boolean;
  deleted_at?: Date | null;
  first_published_at?: Date | null;
  uniquely_simbi: boolean;
  trading_type?: number;
  quota?: number;
  quota_used: number;
  medium?: number;
  processing_time?: number;
  shipping_costs?: number;
  in_probation_at?: Date | null;
  invisible_for?: number;
  strength?: number;
  shipping_type?: number;
  notified_status: string;
  searchable: boolean;
  index_on_main_site: boolean;
  service_id?: number;
  services_count?: number;
  original_service_id?: number;
  usd_price?: number;
}

export interface Skill {
  id: number;
  name?: string;
  user_id?: number;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}

export interface StateHistory {
  id: number;
  state_machine_name?: string;
  state?: string;
  previous_state?: string;
  stateable_id?: number;
  stateable_type?: string;
  transition_reason?: string;
  created_at?: Date;
  deleted_at?: Date | null;
}

export interface StripeAccount extends BaseModel {
  user_id?: number;
  stripe_id?: string;
}

export interface TalkHistory {
  id: number;
  talk_id?: number;
  talk_item_id?: number;
  user_id?: number;
  kind?: string;
  created_at?: Date;
  updated_at?: Date;
  metadata: any;
  deleted_at?: Date | null;
}

export interface TalkItem {
  id: number;
  talk_id?: number;
  talk_itemable_id?: number;
  talk_itemable_type?: string;
  created_at?: Date;
  updated_at?: Date;
  replied_at?: Date | null;
  deleted_at?: Date | null;
}

export interface TalkItemRead {
  id: number;
  talk_item_id?: number;
  user_id?: number;
  status: string;
  is_read: boolean;
  read_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface TalkUser extends BaseModel {
  talk_id?: number;
  user_id?: number;
  review_id?: number;
  read_at?: Date | null;
  assumed_service_id?: number;
  assumed_unit_count?: number;
  archived_at?: Date | null;
  seen_at?: Date | null;
}

export interface Talk extends BaseModel {
  last_talked_user_id?: number;
  status: number;
  closed_at?: Date | null;
  initial_service_id?: number;
  assumed_status?: number;
  assumed_status_at?: Date | null;
}

export interface Transaction {
  id: number;
  user_id?: number;
  amount?: number;
  balance?: number;
  completed_at?: Date | null;
  accountable_id?: number;
  accountable_type?: string;
  created_at?: Date;
  updated_at?: Date;
  rollback_at?: Date | null;
  deleted_at?: Date | null;
  read_at?: Date | null;
  transfer_id?: number;
}

export interface Transfer {
  id: number;
  transfer_type: TransferType;
  sender_account_id: number;
  recipient_account_id: number;
  amount: number;
  currency: TransferCurrency;
  deal_itemable_type?: string;
  deal_itemable_id?: number;
  created_at: Date;
}

export interface Unit {
  id: number;
  name: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface Upload {
  id: number;
  user_id?: number;
  kind?: string;
  upload_file_name?: string;
  upload_content_type?: string;
  upload_file_size?: number;
  upload_updated_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export interface UserEvent extends BaseModel {
  user_id?: number;
  trackable_type?: string;
  trackable_id?: number;
  name?: string;
  properties?: any;
}

export interface UserExpertCategory extends BaseModel {
  user_id?: number;
  category_id?: number;
  expert_status: UserCategoryExpertStatus;
}

export interface User {
  id: number;
  email?: string;
  encrypted_password: string;
  reset_password_token?: string;
  reset_password_sent_at?: Date | null;
  remember_created_at?: Date | null;
  sign_in_count: number;
  current_sign_in_at?: Date | null;
  last_sign_in_at?: Date | null;
  current_sign_in_ip?: string;
  last_sign_in_ip?: string;
  confirmation_token?: string;
  confirmed_at?: Date | null;
  confirmation_sent_at?: Date | null;
  unconfirmed_email?: string;
  failed_attempts: number;
  unlock_token?: string;
  locked_at?: Date | null;
  role: string;
  created_at?: Date;
  updated_at?: Date;
  first_name?: string;
  last_name?: string;
  about?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  avatar_file_name?: string;
  avatar_content_type?: string;
  avatar_file_size?: number;
  avatar_updated_at?: Date;
  signup_reason?: string;
  location?: any;
  response_time?: number;
  slug?: string;
  avatar_fingerprint?: string;
  invited_by_id?: number;
  invited_by_type?: string;
  invitation_skill?: string;
  website?: string;
  phone_number?: string;
  applied_at?: Date | null;
  disabled_notifications: string[];
  disabled_text_notifications: string[];
  featured: boolean;
  qualifications?: string;
  deleted_at?: Date | null;
  zipcode?: string;
  country_code?: string;
  response_rate?: number;
  subscription_token?: string;
  cancel_reason?: string;
  cancel_explanation?: string;
  avatar_crop_x?: number;
  avatar_crop_y?: number;
  avatar_crop_w?: number;
  avatar_crop_h?: number;
  remember_token?: string;
  disabled_push_notifications: string[];
  probation_unanswered?: number;
  onboard_locked_at?: Date | null;
  transacted_at?: Date | null;
  avatar_processing?: boolean;
  display_rating: number;
  rating?: number;
  deals_count: number;
  enabled_features: string[];
  noindex: boolean;
  strength?: number;
  avatar_face?: boolean;
  deactivated_at?: Date | null;
  deactivated_for?: number;
  deactivation_reason?: string;
  settings: any;
  onboarding_finished_at?: Date | null;
  onboarding_state: string;
  nonprofit: boolean;
  organization_status?: string;
  registration_number?: string;
}

export interface Version {
  id: number;
  item_type: string;
  item_id: number;
  event: string;
  whodunnit?: string;
  object?: any;
  object_changes?: any;
  created_at?: Date;
}

export interface Wanted {
  id: number;
  user_id?: number;
  category_id?: number;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}

export interface Website {
  id: number;
  kind?: string;
  name?: string;
  linkable_id?: number;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
  linkable_type: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type TableName =
  | 'accounts' | 'badges' | 'bots' | 'categories' | 'category_tags'
  | 'cohorts' | 'comments' | 'communities' | 'community_services'
  | 'community_users' | 'compliments' | 'customers' | 'devices'
  | 'email_events' | 'email_templates' | 'favorites' | 'flags'
  | 'friendly_id_slugs' | 'friendships' | 'identities' | 'image_uploads'
  | 'images' | 'jobs' | 'leaderboard_histories' | 'leaderboard_prizes'
  | 'leads' | 'likes' | 'message_attachments' | 'messages'
  | 'offer_events' | 'offer_items' | 'offereds' | 'offers'
  | 'order_items' | 'orders' | 'organization_members' | 'pages'
  | 'qualifications' | 'ratings' | 'references' | 'reviews' | 'rewards'
  | 'score_formulas' | 'scores' | 'sent_emails' | 'services' | 'skills'
  | 'state_histories' | 'stripe_accounts' | 'talk_histories' | 'talk_items'
  | 'talk_items_reads' | 'talk_users' | 'talks' | 'transactions'
  | 'transfers' | 'units' | 'uploads' | 'user_events' | 'user_expert_categories'
  | 'users' | 'versions' | 'wanteds' | 'websites';

export interface QueryOptions {
  select?: string[];
  where?: Record<string, any>;
  orderBy?: string | [string, 'ASC' | 'DESC'][];
  limit?: number;
  offset?: number;
  join?: Array<{
    table: TableName;
    on: string;
    type?: 'INNER' | 'LEFT' | 'RIGHT';
  }>;
}
