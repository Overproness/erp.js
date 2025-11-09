# Campaigns API Documentation

## Overview

The Campaigns API provides comprehensive marketing automation capabilities including campaign management, A/B testing, email templates, lead scoring, and behavior tracking.

**Base URL:** `http://localhost:8888/api/marketing`

**Authentication:** All endpoints require Bearer token authentication.

## Campaign Management Endpoints

### Create Campaign

**POST** `/campaigns`

Creates a new marketing campaign.

#### Request Body

```json
{
  "name": "Summer Sale 2024",
  "type": "email",
  "status": "draft",
  "description": "Summer promotion campaign",
  "channels": ["email", "sms"],
  "content": {
    "subject": "Summer Sale - 50% Off!",
    "body": "Don't miss our amazing summer deals!"
  },
  "targeting": {
    "segments": ["high-value-customers"],
    "audience": "segment_based"
  },
  "schedule": {
    "type": "scheduled",
    "startDate": "2024-07-01T10:00:00Z",
    "timezone": "UTC"
  },
  "budget": {
    "total": 5000,
    "currency": "USD"
  }
}
```

#### Response

```json
{
  "success": true,
  "message": "Campaign created successfully",
  "result": {
    "_id": "60d21b4667d0d8992e610c85",
    "name": "Summer Sale 2024",
    "type": "email",
    "status": "draft",
    "channels": ["email", "sms"],
    "analytics": {
      "totalSent": 0,
      "openRate": 0,
      "clickRate": 0
    },
    "createdAt": "2024-07-01T09:30:00Z"
  }
}
```

### Get All Campaigns

**GET** `/campaigns/list`

Retrieves all campaigns with pagination and filtering.

#### Query Parameters

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `status` (string): Filter by status
- `type` (string): Filter by campaign type
- `search` (string): Search in campaign names

#### Response

```json
{
  "success": true,
  "result": {
    "campaigns": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalCampaigns": 48,
      "hasNextPage": true
    }
  }
}
```

### Get Campaign by ID

**GET** `/campaigns/:id`

Retrieves a specific campaign by ID.

#### Response

```json
{
  "success": true,
  "result": {
    "_id": "60d21b4667d0d8992e610c85",
    "name": "Summer Sale 2024",
    "analytics": {
      "totalSent": 1500,
      "openRate": 25.5,
      "clickRate": 12.3
    }
  }
}
```

### Update Campaign

**PATCH** `/campaigns/:id`

Updates an existing campaign.

#### Request Body

```json
{
  "name": "Updated Campaign Name",
  "description": "Updated description"
}
```

### Delete Campaign

**DELETE** `/campaigns/:id`

Soft deletes a campaign.

### Start Campaign

**POST** `/campaigns/:id/start`

Starts campaign execution.

### Pause Campaign

**POST** `/campaigns/:id/pause`

Pauses an active campaign.

### Schedule Campaign

**POST** `/campaigns/:id/schedule`

Schedules a campaign for future execution.

#### Request Body

```json
{
  "startDate": "2024-07-01T10:00:00Z",
  "timezone": "UTC"
}
```

## A/B Testing Endpoints

### Create A/B Test

**POST** `/campaigns/:id/ab-test`

Creates an A/B test for a campaign.

#### Request Body

```json
{
  "testType": "subject",
  "variations": [
    {
      "name": "Original",
      "percentage": 50,
      "content": {
        "subject": "Original Subject Line"
      }
    },
    {
      "name": "Variation A",
      "percentage": 50,
      "content": {
        "subject": "New Subject Line"
      }
    }
  ],
  "testDuration": 72,
  "autoSelectWinner": true
}
```

#### Response

```json
{
  "success": true,
  "result": {
    "abTesting": {
      "isEnabled": true,
      "testType": "subject",
      "variations": [...],
      "startTime": "2024-07-01T10:00:00Z"
    }
  }
}
```

### Get A/B Test Results

**GET** `/campaigns/:id/ab-test/results`

Retrieves A/B test performance results.

#### Response

```json
{
  "success": true,
  "result": {
    "variations": [
      {
        "name": "Original",
        "metrics": {
          "sent": 750,
          "opened": 200,
          "clicked": 85,
          "converted": 25
        },
        "rates": {
          "openRate": 26.7,
          "clickRate": 11.3,
          "conversionRate": 3.3
        }
      }
    ],
    "winner": "Variation A",
    "confidence": 95,
    "recommendations": [
      "Variation A shows 23% better open rate",
      "Difference is statistically significant"
    ]
  }
}
```

### Update A/B Test Metrics

**POST** `/campaigns/:id/ab-test/metrics`

Updates A/B test performance metrics.

## Campaign Analytics Endpoints

### Get Campaign Analytics

**GET** `/campaigns/:id/analytics`

Retrieves comprehensive campaign analytics.

#### Query Parameters

- `dateRange` (string): Time period (last-7-days, last-30-days, custom)
- `metrics` (array): Specific metrics to include

#### Response

```json
{
  "success": true,
  "result": {
    "metrics": {
      "totalSent": 5000,
      "totalDelivered": 4950,
      "totalOpened": 1275,
      "totalClicked": 595,
      "totalConverted": 89,
      "openRate": 25.8,
      "clickRate": 11.9,
      "conversionRate": 1.8,
      "roi": 250
    },
    "performance": {
      "trend": "improving",
      "bestChannel": "email",
      "peakEngagementTime": "10:00 AM"
    },
    "comparison": {
      "previousPeriod": {
        "openRate": 22.1,
        "improvement": "+16.7%"
      }
    }
  }
}
```

### Generate Campaign Report

**POST** `/campaigns/:id/report`

Generates a comprehensive campaign report.

#### Request Body

```json
{
  "format": "json",
  "metrics": ["open-rate", "click-rate", "conversion-rate"],
  "dateRange": "last-30-days",
  "includeCharts": true
}
```

## Email Templates Endpoints

### Get Email Templates

**GET** `/emails/templates`

Retrieves all email templates.

#### Response

```json
{
  "success": true,
  "result": [
    {
      "_id": "60d21b4667d0d8992e610c86",
      "name": "Welcome Email",
      "subject": "Welcome {{customerName}}!",
      "category": "transactional",
      "createdAt": "2024-07-01T09:30:00Z"
    }
  ]
}
```

### Create Email Template

**POST** `/emails/templates`

Creates a new email template.

#### Request Body

```json
{
  "name": "Welcome Email Template",
  "subject": "Welcome {{customerName}}!",
  "htmlContent": "<h1>Welcome {{customerName}}</h1><p>Thank you for joining us!</p>",
  "textContent": "Welcome {{customerName}}! Thank you for joining us!",
  "category": "transactional",
  "variables": ["customerName"],
  "industryTemplate": {
    "industryType": "ecommerce",
    "compliance": ["GDPR", "CAN-SPAM"]
  }
}
```

#### Response

```json
{
  "success": true,
  "result": {
    "_id": "60d21b4667d0d8992e610c87",
    "name": "Welcome Email Template",
    "subject": "Welcome {{customerName}}!",
    "createdAt": "2024-07-01T09:30:00Z"
  }
}
```

## Lead Scoring Endpoints

### Calculate Lead Score

**POST** `/lead-scoring/calculate/:customerId`

Calculates lead score for a specific customer.

#### Response

```json
{
  "success": true,
  "result": {
    "customerId": "60d21b4667d0d8992e610c88",
    "totalScore": 85,
    "grade": "A",
    "status": "hot",
    "scoring": {
      "behavioral": 45,
      "demographic": 25,
      "engagement": 15
    },
    "recommendations": [
      "High engagement customer - prioritize for sales",
      "Consider premium product offerings"
    ],
    "lastCalculated": "2024-07-01T10:15:00Z"
  }
}
```

### Get Lead Scoring Rules

**GET** `/lead-scoring/rules`

Retrieves current lead scoring rules and configuration.

#### Response

```json
{
  "success": true,
  "result": {
    "rules": {
      "behavioral": {
        "emailOpens": 2,
        "emailClicks": 5,
        "websiteVisits": 3
      },
      "demographic": {
        "industryMatch": 20,
        "companySizeMatch": 15,
        "locationMatch": 10
      }
    },
    "thresholds": {
      "hot": 80,
      "warm": 60,
      "cold": 40
    }
  }
}
```

### Get Lead Leaderboard

**GET** `/lead-scoring/leaderboard`

Retrieves top-scoring leads.

#### Query Parameters

- `limit` (number): Number of leads to return (default: 10)
- `timeframe` (string): Time period to consider

#### Response

```json
{
  "success": true,
  "result": [
    {
      "customerId": "60d21b4667d0d8992e610c88",
      "customerName": "John Doe",
      "score": 92,
      "grade": "A+",
      "recentActivity": "Clicked email link 2 hours ago"
    }
  ]
}
```

## Behavior Tracking Endpoints

### Track Behavior Event

**POST** `/behavior/track`

Records a customer behavior event.

#### Request Body

```json
{
  "customerId": "60d21b4667d0d8992e610c88",
  "eventType": "email_open",
  "eventData": {
    "campaignId": "60d21b4667d0d8992e610c85",
    "timestamp": "2024-07-01T10:30:00Z",
    "metadata": {
      "device": "mobile",
      "location": "US"
    }
  }
}
```

#### Response

```json
{
  "success": true,
  "result": {
    "event": {
      "_id": "60d21b4667d0d8992e610c89",
      "customerId": "60d21b4667d0d8992e610c88",
      "eventType": "email_open",
      "triggeredWorkflows": ["60d21b4667d0d8992e610c90"]
    },
    "leadScoreImpact": 2,
    "triggeredActions": 1
  }
}
```

### Get Behavior Analytics

**GET** `/behavior/analytics/:customerId`

Retrieves behavior analytics for a specific customer.

#### Response

```json
{
  "success": true,
  "result": {
    "summary": {
      "totalEvents": 45,
      "mostActiveChannel": "email",
      "lastActivity": "2024-07-01T10:30:00Z",
      "engagementTrend": "increasing"
    },
    "eventBreakdown": {
      "email_open": 20,
      "email_click": 12,
      "website_visit": 8,
      "form_submit": 3,
      "download": 2
    },
    "timeline": [
      {
        "date": "2024-07-01",
        "events": 8,
        "topEvent": "email_open"
      }
    ]
  }
}
```

### Create Behavior Trigger

**POST** `/behavior/triggers`

Creates a new behavior-based automation trigger.

#### Request Body

```json
{
  "name": "Email Open Follow-up",
  "eventType": "email_open",
  "conditions": {
    "campaignType": "promotional",
    "frequency": "once",
    "timeWindow": 24
  },
  "actions": [
    {
      "type": "send_email",
      "delay": 2,
      "config": {
        "templateId": "60d21b4667d0d8992e610c86"
      }
    }
  ],
  "isActive": true
}
```

### Get Behavior Triggers

**GET** `/behavior/triggers`

Retrieves all behavior triggers.

## Bulk Operations Endpoints

### Bulk Campaign Operations

**POST** `/campaigns/bulk`

Performs bulk operations on multiple campaigns.

#### Request Body

```json
{
  "action": "updateStatus",
  "campaignIds": ["60d21b4667d0d8992e610c85", "60d21b4667d0d8992e610c86"],
  "data": {
    "status": "paused"
  }
}
```

#### Response

```json
{
  "success": true,
  "result": {
    "action": "updateStatus",
    "updated": 2,
    "failed": 0,
    "details": [
      {
        "campaignId": "60d21b4667d0d8992e610c85",
        "status": "success"
      }
    ]
  }
}
```

## Campaign Optimization Endpoints

### Get Optimization Suggestions

**POST** `/campaigns/:id/optimize`

Generates AI-powered optimization suggestions for a campaign.

#### Response

```json
{
  "success": true,
  "result": {
    "suggestions": [
      {
        "type": "subject_line",
        "suggestion": "Add urgency words like 'Limited Time'",
        "expectedImprovement": "15% open rate increase",
        "confidence": 0.85
      },
      {
        "type": "send_time",
        "suggestion": "Send at 10:00 AM for better engagement",
        "expectedImprovement": "12% click rate increase",
        "confidence": 0.78
      }
    ],
    "overallScore": 72,
    "implementationPriority": ["subject_line", "send_time"]
  }
}
```

### Duplicate Campaign

**POST** `/campaigns/duplicate`

Creates a copy of an existing campaign.

#### Request Body

```json
{
  "campaignId": "60d21b4667d0d8992e610c85",
  "name": "Summer Sale 2024 - Copy",
  "modifications": {
    "status": "draft",
    "schedule": {
      "type": "immediate"
    }
  }
}
```

## Error Responses

### Authentication Error

```json
{
  "success": false,
  "message": "No authentication token provided",
  "error": "UNAUTHORIZED"
}
```

### Validation Error

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "name",
      "message": "Campaign name is required"
    }
  ]
}
```

### Not Found Error

```json
{
  "success": false,
  "message": "Campaign not found",
  "error": "NOT_FOUND"
}
```

## Rate Limiting

- **Rate Limit:** 1000 requests per hour per API key
- **Burst Limit:** 100 requests per minute

## Code Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

// Create a campaign
const campaign = await axios.post(
  'http://localhost:8888/api/marketing/campaigns',
  {
    name: 'Test Campaign',
    type: 'email',
    // ... other fields
  },
  {
    headers: { Authorization: `Bearer ${token}` },
  }
);

// Get campaign analytics
const analytics = await axios.get(
  `http://localhost:8888/api/marketing/campaigns/${campaignId}/analytics`,
  { headers: { Authorization: `Bearer ${token}` } }
);
```

### cURL Examples

```bash
# Create campaign
curl -X POST http://localhost:8888/api/marketing/campaigns \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Campaign","type":"email"}'

# Get campaign analytics
curl -X GET http://localhost:8888/api/marketing/campaigns/CAMPAIGN_ID/analytics \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Webhook Integration

Configure webhooks to receive real-time campaign events:

```json
{
  "event": "campaign.completed",
  "campaignId": "60d21b4667d0d8992e610c85",
  "data": {
    "totalSent": 5000,
    "openRate": 25.8,
    "clickRate": 11.9
  },
  "timestamp": "2024-07-01T15:30:00Z"
}
```

## Support

For API support and questions, contact: support@techrevisor.com
