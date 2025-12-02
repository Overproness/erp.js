# Quote Delivery API - Quick Reference Guide

## 🚀 Quick Start

### Base URL

```
http://localhost:8888/api
```

### Authentication

All endpoints require Bearer token:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 📌 API Endpoints

### 1. Send Quote

**Send a quote to a customer via email/SMS**

```http
POST /quote/send/:id
```

**Request Body:**

```json
{
  "channels": ["email", "sms"],
  "attachPdf": true,
  "customMessage": "Looking forward to working with you!",
  "quoteUrl": "https://example.com/quotes/view/123"
}
```

**Response:**

```json
{
  "success": true,
  "result": {
    "success": true,
    "quote": {
      "id": "507f1f77bcf86cd799439011",
      "number": "2025-1001",
      "customer": "John Doe"
    },
    "deliveryResults": [
      {
        "channel": "email",
        "success": true,
        "sentAt": "2025-12-03T10:30:00.000Z",
        "recipient": "customer@example.com",
        "messageId": "msg_123456"
      }
    ],
    "allChannelsSuccessful": true
  },
  "message": "Quote sent successfully via all channels"
}
```

---

### 2. Resend Quote

**Resend an existing quote**

```http
POST /quote/resend/:id
```

**Request Body:**

```json
{
  "channels": ["email"],
  "attachPdf": true,
  "quoteUrl": "https://example.com/quotes/view/123"
}
```

---

### 3. Send Reminder

**Send a reminder for an expiring quote**

```http
POST /quote/reminder/:id
```

**Request Body:**

```json
{
  "channels": ["email", "sms"],
  "quoteUrl": "https://example.com/quotes/view/123"
}
```

---

### 4. Get Delivery History

**Retrieve complete delivery history for a quote**

```http
GET /quote/delivery-history/:id
```

**Response:**

```json
{
  "success": true,
  "result": {
    "quote": {
      "id": "507f1f77bcf86cd799439011",
      "number": "2025-1001"
    },
    "deliveryHistory": [
      {
        "sentAt": "2025-12-03T10:00:00.000Z",
        "channels": ["email"],
        "type": "quote",
        "results": [...],
        "sentBy": "admin_user_id"
      }
    ]
  }
}
```

---

### 5. Check Delivery Status

**Get current delivery status and summary**

```http
GET /quote/delivery-status/:id
```

**Response:**

```json
{
  "success": true,
  "result": {
    "quote": {
      "id": "507f1f77bcf86cd799439011",
      "number": "2025-1001",
      "status": "sent",
      "isExpired": false,
      "expiryDate": "2025-12-17T23:59:59.000Z"
    },
    "customer": {
      "name": "John Doe",
      "email": "customer@example.com",
      "phone": "+15551234567"
    },
    "totalDeliveries": 2,
    "lastDelivery": {
      "sentAt": "2025-12-05T14:00:00.000Z",
      "channels": ["email", "sms"],
      "success": true,
      "type": "reminder"
    }
  }
}
```

---

### 6. Send Bulk Quotes

**Send multiple quotes at once**

```http
POST /quote/send-bulk
```

**Request Body:**

```json
{
  "quoteIds": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"],
  "channels": ["email"],
  "attachPdf": true
}
```

**Response:**

```json
{
  "success": true,
  "result": {
    "success": true,
    "totalProcessed": 2,
    "successfulDeliveries": 2,
    "failedDeliveries": 0,
    "results": [...],
    "errors": []
  },
  "message": "Processed 2 quotes: 2 successful, 0 failed"
}
```

---

## 🎯 Common Use Cases

### Use Case 1: Send Quote via Email Only

```javascript
const response = await fetch("/api/quote/send/QUOTE_ID", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer TOKEN",
  },
  body: JSON.stringify({
    channels: ["email"],
    attachPdf: true,
  }),
});
```

### Use Case 2: Send Quote via Both Channels

```javascript
const response = await fetch("/api/quote/send/QUOTE_ID", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer TOKEN",
  },
  body: JSON.stringify({
    channels: ["email", "sms"],
    attachPdf: true,
    quoteUrl: "https://mycompany.com/view-quote/123",
  }),
});
```

### Use Case 3: Send Reminder Before Expiry

```javascript
const response = await fetch("/api/quote/reminder/QUOTE_ID", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer TOKEN",
  },
  body: JSON.stringify({
    channels: ["sms"],
  }),
});
```

### Use Case 4: Check If Quote Was Sent

```javascript
const response = await fetch("/api/quote/delivery-status/QUOTE_ID", {
  method: "GET",
  headers: {
    Authorization: "Bearer TOKEN",
  },
});

const data = await response.json();
if (data.result.totalDeliveries > 0) {
  console.log("Quote was sent!");
  console.log("Last delivery:", data.result.lastDelivery);
}
```

---

## ⚙️ Request Parameters

### Channel Options

```javascript
channels: ["email"]; // Email only
channels: ["sms"]; // SMS only
channels: ["email", "sms"]; // Both channels
```

### Optional Parameters

```javascript
{
  attachPdf: true,           // Attach PDF to email (default: true)
  customMessage: "...",      // Custom message in email
  quoteUrl: "https://..."    // Public quote URL
}
```

---

## ❌ Error Responses

### Quote Not Found

```json
{
  "success": false,
  "message": "Quote not found"
}
```

### Customer Email Missing

```json
{
  "success": false,
  "message": "Customer information not found"
}
```

### Quote Expired

```json
{
  "success": false,
  "message": "Cannot resend expired quote. Please create a new quote or update the expiry date."
}
```

### Quote Cancelled

```json
{
  "success": false,
  "message": "Cannot send cancelled quote"
}
```

---

## 🔔 Email & SMS Message Formats

### Email Format

- **Subject:** Quote #2025-1001 from Company Name
- **Content:** Professional HTML template with:
  - Company logo and branding
  - Quote details (number, date, expiry)
  - Itemized list of products/services
  - Pricing breakdown
  - Additional notes
  - Call-to-action button
  - Contact information

### SMS Format

**Quote Notification:**

```
Hi John Doe, Tech Revisor has sent you a quote #2025-1001 for USD 1,500.00.
View it here: https://example.com/quotes/123
Valid until 12/17/2025.
```

**Reminder:**

```
Reminder: Your quote #2025-1001 from Tech Revisor (USD 1,500.00) expires in 3 days.
Review it: https://example.com/quotes/123
```

---

## 🔒 Security & Validation

**Automatic Validations:**

- ✅ User authentication required
- ✅ Quote existence check
- ✅ Customer information validation
- ✅ Quote status validation (no cancelled)
- ✅ Expiry date validation (no expired for resend)
- ✅ Channel parameter validation

---

## 📊 Response Status Codes

| Code | Meaning                        |
| ---- | ------------------------------ |
| 200  | Success                        |
| 400  | Bad Request (validation error) |
| 401  | Unauthorized                   |
| 404  | Quote not found                |
| 500  | Server error                   |

---

## 💡 Tips & Best Practices

1. **Always check delivery status** after sending
2. **Use both channels** for important quotes
3. **Send reminders** 3-5 days before expiry
4. **Include quote URL** for better customer experience
5. **Monitor delivery history** for failed attempts
6. **Resend only if** customer confirms non-receipt
7. **Use bulk send** for multiple quotes at once

---

## 🧪 Testing

### Test with cURL

```bash
# Send quote via email
curl -X POST http://localhost:8888/api/quote/send/QUOTE_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"channels": ["email"], "attachPdf": true}'

# Check delivery status
curl -X GET http://localhost:8888/api/quote/delivery-status/QUOTE_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test with Postman

1. Create new POST request
2. Set URL: `http://localhost:8888/api/quote/send/:id`
3. Add Bearer token in Authorization
4. Set body to JSON with channel options
5. Send request

---

## 📖 Additional Resources

- Full documentation: `backend/docs/QUOTE-DELIVERY-SYSTEM.md`
- Implementation summary: `QUOTE-DELIVERY-IMPLEMENTATION.md`
- Email template: `backend/src/emailTemplate/quoteNotification.html`
- Frontend component: `frontend/src/components/Quote/SendQuoteModal.jsx`

---

**Last Updated:** December 3, 2025  
**API Version:** 1.0.0  
**Status:** Production Ready ✅
