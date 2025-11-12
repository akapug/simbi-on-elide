import { IsString, IsBoolean, IsOptional, IsArray } from 'class-validator';

export class JoinConversationDto {
  @IsString()
  conversationId: string;
}

export class LeaveConversationDto {
  @IsString()
  conversationId: string;
}

export class SendMessageDto {
  @IsString()
  conversationId: string;

  @IsString()
  content: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attachments?: string[];
}

export class TypingDto {
  @IsString()
  conversationId: string;

  @IsBoolean()
  isTyping: boolean;
}

export class ReadDto {
  @IsString()
  conversationId: string;
}

export class OfferUpdateDto {
  @IsString()
  conversationId: string;

  @IsString()
  offerId: string;

  @IsString()
  status: string;
}

// Response DTOs
export interface WebSocketResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export interface MessageEvent {
  id: string;
  conversationId: string;
  userId: string;
  user: {
    id: string;
    username: string;
    avatar?: string;
  };
  content: string;
  attachments?: string[];
  createdAt: Date;
}

export interface TypingEvent {
  userId: string;
  username: string;
  conversationId: string;
  isTyping: boolean;
}

export interface ReadEvent {
  userId: string;
  conversationId: string;
  readAt: Date;
}

export interface OfferUpdateEvent {
  offerId: string;
  conversationId: string;
  status: string;
  offer: any;
  updatedAt: Date;
}

export interface UserJoinedEvent {
  userId: string;
  username: string;
  conversationId: string;
}

export interface UserLeftEvent {
  userId: string;
  username: string;
  conversationId: string;
}
