# Notification System Integration Guide

## Overview

The new WebSocket-based notification system has been successfully implemented using Socket.io, MongoDB, and React Toastify. This guide shows how to integrate it into your application.

## Backend Setup ✅ COMPLETED

### What Was Implemented:

1. **MongoDB Model** - `backend/src/models/appModels/Notification.js`
2. **Socket.io Server** - Configured in `backend/src/server.js`
3. **Socket Handlers** - `backend/src/sockets/notificationSocket.js`
4. **Refactored Service** - `backend/src/services/notificationService.js`
5. **REST API Routes** - `backend/src/routes/appRoutes/notificationRoutes.js`
6. **Controller** - `backend/src/controllers/appControllers/notificationController.js`
7. **Configuration** - Updated `backend/src/config/notificationConfig.js`

## Frontend Setup ✅ COMPLETED

### What Was Implemented:

1. **Socket Service** - `frontend/src/services/socketService.js`
2. **Notification Context** - `frontend/src/context/NotificationContext.jsx`
3. **Custom Hook** - `frontend/src/hooks/useNotifications.js`
4. **Notification Bell Component** - `frontend/src/components/NotificationBell/NotificationBell.jsx`
5. **Toast Configuration** - `frontend/src/config/toastConfig.js`
6. **Custom Styles** - CSS files for notifications and toasts

## Integration Steps

### Step 1: Wrap Your App with NotificationProvider

In your main app file (e.g., `frontend/src/RootApp.jsx` or `frontend/src/main.jsx`):

```jsx
import { NotificationProvider } from "./context/NotificationContext";
import { ToastContainer } from "react-toastify";
import toastConfig from "./config/toastConfig";

function App() {
  return (
    <NotificationProvider>
      {/* Your existing providers */}
      <YourApp />

      {/* Add ToastContainer at the root level */}
      <ToastContainer {...toastConfig} />
    </NotificationProvider>
  );
}
```

### Step 2: Initialize Socket Connection After Login

In your authentication flow (after successful login):

```jsx
import { useNotifications } from './hooks/useNotifications';

function YourAuthComponent() {
  const { initializeSocket } = useNotifications();

  const handleLogin = async (credentials) => {
    // Your login logic
    const response = await login(credentials);
    const token = response.token;

    // Store token
    localStorage.setItem('token', token);

    // Initialize socket connection
    initializeSocket(token);
  };

  return (
    // Your login UI
  );
}
```

### Step 3: Add Notification Bell to Header

In your header/navbar component:

```jsx
import NotificationBell from "./components/NotificationBell/NotificationBell";

function Header() {
  return (
    <header>
      {/* Your other header items */}
      <NotificationBell />
    </header>
  );
}
```

### Step 4: Disconnect Socket on Logout

```jsx
import { useNotifications } from "./hooks/useNotifications";

function YourLogoutHandler() {
  const { disconnectSocket } = useNotifications();

  const handleLogout = () => {
    // Clear token
    localStorage.removeItem("token");

    // Disconnect socket
    disconnectSocket();

    // Redirect to login
    navigate("/login");
  };

  return <button onClick={handleLogout}>Logout</button>;
}
```

## Using Notifications in Your Code

### Send a Notification (Backend)

```javascript
const { notificationService } = require("@/services/notificationService");

// Example: Send task assignment notification
await notificationService.sendNotification({
  recipientId: userId,
  title: "New Task Assigned",
  message: "You have been assigned a new task: Complete Report",
  type: "task_assigned",
  priority: "high",
  actionUrl: "/tasks/12345",
  actionText: "View Task",
  channels: ["app", "email"], // Optional: also send email
  source: {
    module: "tasks",
    entityId: taskId,
    entityType: "Task",
  },
});
```

### Available Notification Types:

- `info` - General information
- `success` - Success messages
- `warning` - Warnings
- `error` - Error messages
- `task_assigned` - Task assignments
- `new_review` - New reviews
- `negative_review` - Negative review alerts
- `review_approval` - Review approval needed
- `ai_response` - AI assistant responses
- `workflow_completed` - Workflow completions
- `social_mention` - Social media mentions
- `system_alert` - System alerts

### Priority Levels:

- `low` - Low priority
- `normal` - Normal priority (default)
- `high` - High priority
- `urgent` - Urgent (auto-closes toast slower, appears in red)

## Environment Variables

Add to your `.env` file:

```env
# Backend
PORT=8888
FRONTEND_URL=http://localhost:3000

# Frontend (.env or .env.local)
VITE_API_URL=http://localhost:8888
```

## REST API Endpoints

All endpoints require authentication token in header:

```
GET    /api/notifications              - List notifications
GET    /api/notifications/unread-count - Get unread count
GET    /api/notifications/stats        - Get statistics
GET    /api/notifications/:id          - Get single notification
PATCH  /api/notifications/:id/read     - Mark as read
PATCH  /api/notifications/mark-all-read - Mark all as read
DELETE /api/notifications/:id          - Delete notification
```

## WebSocket Events

### Client → Server:

- `notifications:fetch` - Fetch notifications
- `notifications:markRead` - Mark as read
- `notifications:markAllRead` - Mark all as read
- `notifications:delete` - Delete notification
- `notifications:getUnreadCount` - Get unread count

### Server → Client:

- `notification:new` - New notification received
- `notification:updated` - Notification updated
- `notification:deleted` - Notification deleted
- `notifications:unreadCount` - Unread count update

## Testing

1. **Start Backend**: `cd backend && npm start`
2. **Start Frontend**: `cd frontend && npm run dev`
3. **Login** to initialize socket connection
4. **Send Test Notification** via API or trigger an event
5. **Check**:
   - Bell icon shows unread count
   - Toast appears
   - Notification appears in dropdown

## Module Integration

To integrate notifications with existing modules, update their respective services:

### Example: Review Module

```javascript
// In your review creation handler
const review = await Review.create(reviewData);

// Send notification
await notificationService.sendNotification({
  recipientId: businessOwnerId,
  title: "New Review Received",
  message: `${customerName} left a ${rating}-star review`,
  type: "new_review",
  priority: rating <= 2 ? "urgent" : "normal",
  actionUrl: `/reviews/${review._id}`,
  actionText: "View Review",
  channels: rating <= 2 ? ["app", "email", "sms"] : ["app"],
  source: {
    module: "reviews",
    entityId: review._id,
    entityType: "Review",
  },
});
```

## Troubleshooting

### Socket Not Connecting:

- Check if backend server is running
- Verify CORS configuration in `backend/src/server.js`
- Check authentication token is valid
- Look for errors in browser console

### Notifications Not Appearing:

- Verify Socket.io connection is established
- Check MongoDB is running
- Ensure NotificationProvider wraps your app
- Check browser console for errors

### Toasts Not Showing:

- Verify ToastContainer is rendered
- Check toast configuration
- Ensure react-toastify CSS is imported

## Next Steps

The system is ready! You just need to:

1. Integrate the providers in your main app file
2. Add the NotificationBell component to your header
3. Initialize socket connection after login
4. Update existing modules to use the new notification service

## Files Modified/Created

### Backend:

- ✅ `models/appModels/Notification.js` - NEW
- ✅ `sockets/notificationSocket.js` - NEW
- ✅ `services/notificationService.js` - REFACTORED
- ✅ `controllers/appControllers/notificationController.js` - NEW
- ✅ `routes/appRoutes/notificationRoutes.js` - NEW
- ✅ `config/notificationConfig.js` - UPDATED
- ✅ `server.js` - UPDATED
- ✅ `app.js` - UPDATED

### Frontend:

- ✅ `services/socketService.js` - NEW
- ✅ `context/NotificationContext.jsx` - NEW
- ✅ `hooks/useNotifications.js` - NEW
- ✅ `components/NotificationBell/NotificationBell.jsx` - NEW
- ✅ `components/NotificationBell/NotificationBell.css` - NEW
- ✅ `config/toastConfig.js` - NEW
- ✅ `config/toastCustomStyles.css` - NEW

### Dependencies Added:

- Backend: `socket.io`
- Frontend: `socket.io-client`, `react-toastify`
