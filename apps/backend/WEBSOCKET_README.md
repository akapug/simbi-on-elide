# WebSocket Gateway Implementation

## Overview

The Simbi application now includes a comprehensive WebSocket Gateway for real-time communication features. This implementation enables instant messaging, typing indicators, read receipts, and real-time offer updates.

## Architecture

### Files Created/Modified

1. **`src/modules/talks/talks.gateway.ts`** - Main WebSocket Gateway
2. **`src/modules/talks/dto/websocket.dto.ts`** - WebSocket event DTOs
3. **`src/modules/talks/talks.module.ts`** - Updated to include Gateway
4. **`src/modules/talks/talks.service.ts`** - Updated with real-time broadcasts
5. **`src/modules/talks/talks.gateway.spec.ts`** - Unit tests
6. **`test-websocket-client.js`** - Manual test client

## Features

### Authentication
- JWT-based authentication for WebSocket connections
- Token validation on connection
- User verification against database
- Automatic disconnection for invalid tokens

### Connection Management
- Tracks active connections (userId -> socketIds mapping)
- Handles reconnections gracefully
- Updates user online status
- Cleanup on disconnection

### Room-Based Messaging
- Conversation-based rooms (`conversation:{id}`)
- Users must join rooms to receive messages
- Access control - only conversation participants can join
- Automatic notification when users join/leave

## Supported Events

### Client → Server Events

#### 1. `join-conversation`
Join a conversation room to receive real-time updates.

**Payload:**
```typescript
{
  conversationId: string
}
```

**Response:**
```typescript
{
  success: boolean
  message: string
  conversationId: string
}
```

**Access Control:** User must be sender or receiver of the conversation.

---

#### 2. `leave-conversation`
Leave a conversation room.

**Payload:**
```typescript
{
  conversationId: string
}
```

**Response:**
```typescript
{
  success: boolean
  message: string
  conversationId: string
}
```

---

#### 3. `message`
Send a real-time message in a conversation.

**Payload:**
```typescript
{
  conversationId: string
  content: string
  attachments?: string[]
}
```

**Response:**
```typescript
{
  success: boolean
  message: {
    id: string
    conversationId: string
    userId: string
    user: { id, username, avatar }
    content: string
    attachments: string[]
    createdAt: Date
  }
}
```

**Behavior:**
- Saves message to database
- Broadcasts to all users in the conversation room
- Sends notification to other user if not in room

---

#### 4. `typing`
Indicate that user is typing.

**Payload:**
```typescript
{
  conversationId: string
  isTyping: boolean
}
```

**Response:**
```typescript
{
  success: boolean
}
```

**Behavior:**
- Broadcasts to other users in conversation (not sender)
- Real-time typing indicators

---

#### 5. `read`
Mark messages in a conversation as read.

**Payload:**
```typescript
{
  conversationId: string
}
```

**Response:**
```typescript
{
  success: boolean
  message: string
}
```

**Behavior:**
- Updates read status in database
- Notifies other user with read receipt

---

#### 6. `offer-update`
Broadcast offer status updates.

**Payload:**
```typescript
{
  conversationId: string
  offerId: string
  status: string
}
```

**Response:**
```typescript
{
  success: boolean
  message: string
}
```

**Behavior:**
- Broadcasts offer update to conversation
- Sends notification to other user

---

### Server → Client Events

#### 1. `connected`
Emitted when client successfully connects.

**Payload:**
```typescript
{
  message: string
  userId: string
}
```

---

#### 2. `message`
Broadcasted when a new message is sent in the conversation.

**Payload:**
```typescript
{
  id: string
  conversationId: string
  userId: string
  user: { id, username, avatar }
  content: string
  attachments: string[]
  createdAt: Date
}
```

---

#### 3. `new-message`
Notification sent to user (even if not in room).

**Payload:**
```typescript
{
  conversationId: string
  message: {
    id: string
    content: string
    user: { id, username, avatar }
    createdAt: Date
  }
}
```

---

#### 4. `typing`
Broadcasted when user starts/stops typing.

**Payload:**
```typescript
{
  userId: string
  username: string
  conversationId: string
  isTyping: boolean
}
```

---

#### 5. `read`
Emitted when messages are marked as read.

**Payload:**
```typescript
{
  userId: string
  conversationId: string
  readAt: Date
}
```

---

#### 6. `user-joined`
Emitted when user joins a conversation room.

**Payload:**
```typescript
{
  userId: string
  username: string
  conversationId: string
}
```

---

#### 7. `user-left`
Emitted when user leaves a conversation room.

**Payload:**
```typescript
{
  userId: string
  username: string
  conversationId: string
}
```

---

#### 8. `offer-created`
Emitted when a new offer is created (broadcasted via TalksService).

**Payload:**
```typescript
{
  offerId: string
  conversationId: string
  offer: Offer
  createdAt: Date
}
```

---

#### 9. `offer-update`
Broadcasted when offer status changes.

**Payload:**
```typescript
{
  offerId: string
  conversationId: string
  status: string
  offer: Offer
  updatedAt: Date
}
```

---

#### 10. `offer-accepted`
Sent to specific user when their offer is accepted.

**Payload:**
```typescript
{
  offerId: string
  conversationId: string
  offer: Offer
}
```

---

#### 11. `new-offer`
Notification sent to receiver when new offer is created.

**Payload:**
```typescript
{
  offerId: string
  conversationId: string
  offer: Offer
}
```

---

## Usage Examples

### Frontend Integration

The frontend already has a WebSocket service at `apps/frontend/src/services/websocket.ts`. Here's how to use it:

```typescript
import websocketService from '@/services/websocket';

// Connect with JWT token
const token = localStorage.getItem('token');
const socket = websocketService.connect(token);

// Join a conversation
socket.emit('join-conversation', { conversationId: 'talk-123' });

// Listen for messages
websocketService.on('message', (data) => {
  console.log('New message:', data);
  // Update UI with new message
});

// Send a message
websocketService.emit('message', {
  conversationId: 'talk-123',
  content: 'Hello!',
});

// Send typing indicator
websocketService.emit('typing', {
  conversationId: 'talk-123',
  isTyping: true,
});

// Mark as read
websocketService.emit('read', {
  conversationId: 'talk-123',
});

// Listen for typing
websocketService.on('typing', (data) => {
  if (data.isTyping) {
    console.log(`${data.username} is typing...`);
  }
});

// Listen for read receipts
websocketService.on('read', (data) => {
  console.log('Messages read at:', data.readAt);
});

// Disconnect
websocketService.disconnect();
```

---

## Testing

### Manual Testing

Use the provided test client:

```bash
# 1. Get a JWT token by logging in
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'

# 2. Update test-websocket-client.js with the token
# 3. Run the test client
cd apps/backend
node test-websocket-client.js

# 4. Use the interactive functions:
sendMessage('conversation-id', 'Hello World!')
sendTyping('conversation-id', true)
markAsRead('conversation-id')
leaveConversation('conversation-id')
```

### Unit Testing

Run the gateway tests:

```bash
cd apps/backend
npm test -- talks.gateway.spec.ts
```

---

## Security Features

1. **JWT Authentication**: All connections must provide a valid JWT token
2. **User Verification**: Token is verified against the database
3. **Access Control**: Users can only join conversations they're part of
4. **Room Isolation**: Messages are only broadcasted to authorized users in the room
5. **Error Handling**: Invalid events throw WebSocket exceptions
6. **Automatic Cleanup**: Connections are cleaned up on disconnect

---

## Performance Considerations

1. **Connection Tracking**: Efficient Map-based tracking of active connections
2. **Room-Based Broadcasting**: Messages only sent to relevant users
3. **Dual Notification**: Room broadcast + individual user notification
4. **Reconnection Handling**: Supports multiple connections per user (multiple devices/tabs)

---

## Configuration

WebSocket configuration in `talks.gateway.ts`:

```typescript
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/',
})
```

Environment variables:
- `FRONTEND_URL`: Frontend URL for CORS
- `JWT_SECRET`: Secret for JWT validation

---

## Integration with REST API

The WebSocket Gateway integrates with the existing REST API:

1. **Messages**: `POST /api/v1/talks/:id/message` also broadcasts via WebSocket
2. **Offers**: Creating/accepting offers triggers WebSocket notifications
3. **Read Status**: Marking as read via WebSocket updates database

This ensures consistency whether users interact via REST API or WebSocket.

---

## Monitoring

The Gateway includes comprehensive logging:

```typescript
- Connection events (connect/disconnect)
- Authentication attempts (success/failure)
- Room joins/leaves
- Message sends
- Error conditions
```

Check logs for debugging:
```bash
# Look for TalksGateway logs
grep "TalksGateway" logs/app.log
```

---

## API Methods

### Public Methods (for service layer integration)

```typescript
// Check if user is online
isUserOnline(userId: string): boolean

// Get all active users
getActiveUsers(): string[]

// Broadcast to conversation room
broadcastToConversation(conversationId: string, event: string, data: any)

// Send to specific user
sendToUser(userId: string, event: string, data: any)
```

These methods are used by `TalksService` to trigger real-time updates from REST endpoints.

---

## Error Handling

All WebSocket events include proper error handling:

- Invalid tokens → Auto-disconnect
- Missing required fields → `WsException`
- Access denied → `WsException`
- Database errors → Logged and `WsException`

Errors are sent back to the client as WebSocket error events.

---

## Next Steps

To further enhance the WebSocket implementation:

1. Add presence indicators (online/offline status)
2. Implement message delivery confirmations
3. Add file upload progress via WebSocket
4. Implement video call signaling
5. Add group conversation support
6. Add message edit/delete events
7. Implement push notifications for offline users

---

## Troubleshooting

### Connection Rejected
- Check JWT token is valid and not expired
- Verify `JWT_SECRET` matches between auth and gateway
- Check CORS settings match frontend URL

### Messages Not Received
- Ensure user has joined the conversation room
- Check user has access to the conversation
- Verify WebSocket connection is established

### Typing Indicators Not Working
- Typing events only broadcast to other users (not sender)
- Ensure both users are in the same conversation room

---

## Summary

The WebSocket Gateway provides a robust, secure, and scalable real-time communication system for the Simbi application. It includes:

- JWT-based authentication
- Room-based messaging
- 11 event types (6 client→server, 11 server→client)
- Comprehensive access control
- Integration with REST API
- Unit tests and manual testing tools
- Production-ready error handling and logging
