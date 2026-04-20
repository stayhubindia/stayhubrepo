# 💬 Chat System Documentation

## Overview
GharBazar has a **production-ready real-time chat system** using Django Channels (WebSocket) for instant messaging between property owners and tenants.

---

## 🏗️ Architecture

### Backend (Django + Channels)
- **Framework**: Django Channels 4.1.0
- **Protocol**: WebSocket (ws://) for real-time bidirectional communication
- **Authentication**: JWT token-based authentication via custom middleware
- **Message Broker**: Redis (channels-redis 4.2.0)
- **Database**: PostgreSQL for message persistence

### Frontend (Next.js + Socket.io)
- **Library**: socket.io-client for WebSocket connection
- **State Management**: React hooks + Zustand
- **Notifications**: react-hot-toast for real-time alerts
- **UI**: Responsive chat interface with mobile-first design

---

## 📡 API Endpoints

### REST API Endpoints

#### 1. List/Create Conversations
```
GET  /api/communication/conversations/
POST /api/communication/conversations/
```

**POST Request Body:**
```json
{
  "property_id": "uuid"
}
```

**Response:**
```json
{
  "id": "uuid",
  "property": {...},
  "tenant": {...},
  "owner": {...},
  "status": "ACTIVE",
  "message_count": 0,
  "owner_unread_count": 0,
  "tenant_unread_count": 0,
  "last_message_at": null
}
```

#### 2. List/Send Messages
```
GET  /api/communication/conversations/{conversation_id}/messages/
POST /api/communication/conversations/{conversation_id}/messages/
```

**POST Request Body:**
```json
{
  "content": "Hello, is this property still available?",
  "image": null  // Optional: multipart/form-data for image upload
}
```

**Response:**
```json
{
  "id": "uuid",
  "conversation": "uuid",
  "sender": {...},
  "message_type": "TEXT",
  "content": "Hello, is this property still available?",
  "image": null,
  "is_read": false,
  "read_at": null,
  "created_at": "2025-01-20T10:30:00Z"
}
```

#### 3. Mark Messages as Read
```
POST /api/communication/conversations/{conversation_id}/read/
```

**Response:**
```json
{
  "updated": 5  // Number of messages marked as read
}
```

#### 4. Archive Conversation
```
POST /api/communication/conversations/{conversation_id}/archive/
```

---

## 🔌 WebSocket Connection

### Connection URL
```
ws://localhost:8000/ws/communication/conversations/{conversation_id}/
```

### Authentication
WebSocket connections are authenticated using JWT tokens passed in the connection headers.

### Connection Flow
```javascript
// Frontend connection example
import { io } from 'socket.io-client';

const socket = io('http://localhost:8000', {
  auth: { token: 'your-jwt-token' },
  transports: ['websocket', 'polling']
});
```

---

## 📨 WebSocket Events

### Client → Server Events

#### 1. Send Message
```json
{
  "action": "send_message",
  "content": "Hello, is this property available?"
}
```

#### 2. Mark as Read
```json
{
  "action": "mark_read"
}
```

### Server → Client Events

#### 1. Message Created
```json
{
  "type": "message.created",
  "message": {
    "id": "uuid",
    "sender": {...},
    "content": "Hello!",
    "created_at": "2025-01-20T10:30:00Z"
  }
}
```

#### 2. Read Status Updated
```json
{
  "type": "read.updated",
  "updated": 3
}
```

#### 3. Error
```json
{
  "type": "error",
  "detail": "Error message"
}
```

---

## 🗄️ Database Models

### Conversation Model
```python
class Conversation(BaseModel):
    property = ForeignKey(Property)
    tenant = ForeignKey(User)
    owner = ForeignKey(User)
    status = CharField(choices=['ACTIVE', 'ARCHIVED'])
    message_count = PositiveIntegerField()
    owner_unread_count = PositiveIntegerField()
    tenant_unread_count = PositiveIntegerField()
    last_message_at = DateTimeField()
```

**Constraints:**
- Unique constraint: One conversation per property-tenant pair
- Check constraint: Tenant and owner must be different users

### Message Model
```python
class Message(BaseModel):
    conversation = ForeignKey(Conversation)
    sender = ForeignKey(User)
    message_type = CharField(choices=['TEXT', 'IMAGE', 'SYSTEM'])
    content = TextField()
    image = ImageField()
    is_read = BooleanField()
    read_at = DateTimeField()
```

**Constraints:**
- Check constraint: Either content or image must be present

---

## 🚀 Setup Instructions

### Backend Setup

1. **Install Dependencies**
```bash
cd Server
pip install -r requirements.txt
```

2. **Install Redis** (Required for Channels)
```bash
# Ubuntu/Debian
sudo apt-get install redis-server

# macOS
brew install redis

# Start Redis
redis-server
```

3. **Configure Settings**
```python
# server/settings.py
INSTALLED_APPS = [
    'daphne',  # Must be first
    'channels',
    'apps.communication',
    ...
]

ASGI_APPLICATION = 'server.asgi.application'

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [('127.0.0.1', 6379)],
        },
    },
}
```

4. **Run Migrations**
```bash
python manage.py makemigrations communication
python manage.py migrate
```

5. **Run Server with Daphne** (ASGI server for WebSocket)
```bash
# Development
daphne -b 0.0.0.0 -p 8000 server.asgi:application

# Or use Django's runserver (supports ASGI in Django 3.0+)
python manage.py runserver
```

### Frontend Setup

1. **Install Dependencies**
```bash
cd Apps/webapp
npm install socket.io-client react-hot-toast
```

2. **Configure Environment**
```bash
# .env.local
NEXT_PUBLIC_SOCKET_URL=http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

3. **Run Development Server**
```bash
npm run dev
```

---

## 🔐 Security Features

### Authentication
- JWT token validation on WebSocket connection
- User must be authenticated to connect
- User can only access their own conversations

### Authorization
- Conversation access restricted to property owner and tenant
- Message sending restricted to conversation participants
- Read status updates restricted to conversation participants

### Rate Limiting
- Message sending throttled (configured in throttles.py)
- Prevents spam and abuse

### Data Validation
- Message content validation
- Image upload validation
- Conversation creation validation

---

## 📱 Frontend Integration

### WebSocket Service
```typescript
// src/services/websocket.ts
import { io, Socket } from 'socket.io-client';

class WebSocketService {
  private socket: Socket | null = null;

  connect(userId: string, token: string) {
    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });
  }

  sendMessage(chatId: string, message: string) {
    this.socket?.emit('send_message', { chatId, message });
  }

  onMessage(callback: (data: any) => void) {
    this.socket?.on('message', callback);
  }
}
```

### Chat Component
```typescript
// app/chats/page.tsx
import { wsService } from '@/services/websocket';

useEffect(() => {
  if (user && tokens?.access) {
    wsService.connect(user.id, tokens.access);
    
    wsService.onMessage((data) => {
      setMessages(prev => [...prev, data]);
    });
  }
}, [user, tokens]);
```

---

## 🧪 Testing

### Backend Tests
```bash
cd Server
python manage.py test apps.communication
```

### WebSocket Testing with wscat
```bash
# Install wscat
npm install -g wscat

# Connect to WebSocket
wscat -c "ws://localhost:8000/ws/communication/conversations/{uuid}/" \
  -H "Authorization: Bearer {jwt-token}"

# Send message
{"action": "send_message", "content": "Hello!"}
```

### Frontend Tests
```bash
cd Apps/webapp
npm test
```

---

## 📊 Performance Considerations

### Scalability
- **Redis**: Handles message distribution across multiple server instances
- **Channels**: Supports horizontal scaling with Redis backend
- **Database**: Indexed queries for fast message retrieval

### Optimization
- Message pagination (limit queries)
- Lazy loading of conversations
- WebSocket connection pooling
- Message caching with Redis

### Monitoring
- Track active WebSocket connections
- Monitor message delivery latency
- Log connection errors
- Track unread message counts

---

## 🐛 Troubleshooting

### Common Issues

#### 1. WebSocket Connection Failed
**Problem**: Cannot connect to WebSocket
**Solution**:
- Check Redis is running: `redis-cli ping`
- Verify ASGI server is running
- Check JWT token is valid
- Verify CORS settings

#### 2. Messages Not Delivering
**Problem**: Messages sent but not received
**Solution**:
- Check channel layer configuration
- Verify Redis connection
- Check conversation permissions
- Review server logs

#### 3. Authentication Failed
**Problem**: WebSocket connection rejected
**Solution**:
- Verify JWT token in auth header
- Check token expiration
- Verify user is authenticated
- Review middleware configuration

---

## 🔄 Future Enhancements

### Planned Features
- [ ] Voice/Video calling with WebRTC
- [ ] File sharing (documents, PDFs)
- [ ] Message reactions (emoji)
- [ ] Typing indicators
- [ ] Message editing/deletion
- [ ] Push notifications (FCM/APNS)
- [ ] Message search
- [ ] Conversation pinning
- [ ] Group chats
- [ ] Message encryption (E2E)

### Performance Improvements
- [ ] Message compression
- [ ] WebSocket connection pooling
- [ ] CDN for media files
- [ ] Database query optimization
- [ ] Caching layer for conversations

---

## 📚 Additional Resources

- [Django Channels Documentation](https://channels.readthedocs.io/)
- [Socket.io Documentation](https://socket.io/docs/)
- [WebSocket Protocol RFC](https://tools.ietf.org/html/rfc6455)
- [Redis Documentation](https://redis.io/documentation)

---

## 🆘 Support

For issues or questions:
1. Check this documentation
2. Review server logs: `tail -f logs/django.log`
3. Check Redis logs: `redis-cli monitor`
4. Review WebSocket connection in browser DevTools

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Status**: ✅ Production Ready
