/**
 * WebSocket Test Client
 *
 * This script helps test the WebSocket Gateway manually.
 *
 * Usage:
 * 1. Obtain a JWT token by logging in through the API
 * 2. Replace YOUR_JWT_TOKEN with the actual token
 * 3. Run: node test-websocket-client.js
 */

const io = require('socket.io-client');

// Configuration
const WS_URL = 'http://localhost:3000';
const JWT_TOKEN = 'YOUR_JWT_TOKEN'; // Replace with actual JWT token

console.log('🔌 Connecting to WebSocket server...');

// Connect to WebSocket server
const socket = io(WS_URL, {
  auth: {
    token: JWT_TOKEN,
  },
});

// Connection event handlers
socket.on('connect', () => {
  console.log('✅ Connected to WebSocket server');
  console.log('Socket ID:', socket.id);
});

socket.on('connected', (data) => {
  console.log('✅ Server confirmed connection:', data);

  // Example: Join a conversation
  const conversationId = 'your-conversation-id'; // Replace with actual conversation ID
  console.log(`\n📨 Joining conversation: ${conversationId}`);

  socket.emit('join-conversation', { conversationId }, (response) => {
    console.log('Join response:', response);
  });
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from WebSocket server');
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
});

// Message event handlers
socket.on('message', (data) => {
  console.log('\n📨 New message received:', {
    from: data.user.username,
    content: data.content,
    conversationId: data.conversationId,
    timestamp: data.createdAt,
  });
});

socket.on('new-message', (data) => {
  console.log('\n🔔 New message notification:', {
    conversationId: data.conversationId,
    from: data.message.user.username,
    content: data.message.content,
  });
});

socket.on('typing', (data) => {
  console.log(`\n⌨️  ${data.username} is ${data.isTyping ? 'typing' : 'not typing'}...`);
});

socket.on('read', (data) => {
  console.log('\n✓ Messages read:', {
    userId: data.userId,
    conversationId: data.conversationId,
    readAt: data.readAt,
  });
});

socket.on('user-joined', (data) => {
  console.log(`\n👋 ${data.username} joined the conversation`);
});

socket.on('user-left', (data) => {
  console.log(`\n👋 ${data.username} left the conversation`);
});

socket.on('offer-created', (data) => {
  console.log('\n💼 New offer created:', {
    offerId: data.offerId,
    conversationId: data.conversationId,
    description: data.offer.description,
  });
});

socket.on('offer-update', (data) => {
  console.log('\n📝 Offer updated:', {
    offerId: data.offerId,
    status: data.status,
    conversationId: data.conversationId,
  });
});

socket.on('offer-accepted', (data) => {
  console.log('\n✅ Offer accepted:', {
    offerId: data.offerId,
    conversationId: data.conversationId,
  });
});

socket.on('new-offer', (data) => {
  console.log('\n🔔 New offer notification:', {
    offerId: data.offerId,
    conversationId: data.conversationId,
  });
});

// Example functions to test events
function sendMessage(conversationId, content) {
  console.log(`\n📤 Sending message to ${conversationId}...`);
  socket.emit('message', { conversationId, content }, (response) => {
    console.log('Send response:', response);
  });
}

function sendTyping(conversationId, isTyping) {
  socket.emit('typing', { conversationId, isTyping }, (response) => {
    console.log('Typing response:', response);
  });
}

function markAsRead(conversationId) {
  console.log(`\n✓ Marking messages as read in ${conversationId}...`);
  socket.emit('read', { conversationId }, (response) => {
    console.log('Read response:', response);
  });
}

function leaveConversation(conversationId) {
  console.log(`\n🚪 Leaving conversation ${conversationId}...`);
  socket.emit('leave-conversation', { conversationId }, (response) => {
    console.log('Leave response:', response);
  });
}

// Export functions for interactive use
global.sendMessage = sendMessage;
global.sendTyping = sendTyping;
global.markAsRead = markAsRead;
global.leaveConversation = leaveConversation;
global.socket = socket;

console.log('\n📚 Available test functions:');
console.log('  - sendMessage(conversationId, content)');
console.log('  - sendTyping(conversationId, isTyping)');
console.log('  - markAsRead(conversationId)');
console.log('  - leaveConversation(conversationId)');
console.log('\nExample:');
console.log('  sendMessage("conversation-id", "Hello World!")');

// Keep the script running
process.stdin.resume();
