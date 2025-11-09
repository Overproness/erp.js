/**
 * Behavioral Trigger Rules and Thresholds
 * 
 * Defines default trigger rules for marketing automation
 */

const triggers = {
  // Trigger types and their configurations
  triggerTypes: {
    // Behavioral triggers based on customer actions
    behavioral: {
      displayName: 'Behavioral Triggers',
      description: 'Triggers based on customer actions and behavior',
      events: {
        // Page view triggers
        pageView: {
          eventType: 'page_view',
          displayName: 'Page View',
          description: 'When a customer views a specific page',
          parameters: ['url', 'urlPattern', 'pageCategory', 'referrer'],
          operators: ['equals', 'contains', 'startsWith', 'endsWith', 'matches'],
          aggregations: ['count', 'frequency'],
          defaultThreshold: 1,
        },
        
        // Product view triggers
        productView: {
          eventType: 'product_view',
          displayName: 'Product View',
          description: 'When a customer views a specific product',
          parameters: ['productId', 'productCategory', 'productPrice', 'productBrand'],
          operators: ['equals', 'contains', 'greaterThan', 'lessThan', 'between'],
          aggregations: ['count', 'duration', 'frequency'],
          defaultThreshold: 1,
        },
        
        // Cart interactions
        addToCart: {
          eventType: 'add_to_cart',
          displayName: 'Add to Cart',
          description: 'When a customer adds an item to their cart',
          parameters: ['productId', 'quantity', 'price', 'totalValue'],
          operators: ['equals', 'greaterThan', 'lessThan', 'between'],
          aggregations: ['count', 'sum', 'average'],
          defaultThreshold: 1,
        },
        
        // Cart abandonment
        cartAbandonment: {
          eventType: 'cart_abandonment',
          displayName: 'Cart Abandonment',
          description: 'When a customer abandons their shopping cart',
          parameters: ['cartValue', 'itemCount', 'hasHighValueItems'],
          operators: ['greaterThan', 'lessThan', 'equals', 'between'],
          aggregations: ['duration'],
          defaultThreshold: 1,
          defaultDelay: 30, // minutes
        },
        
        // Form interactions
        formSubmit: {
          eventType: 'form_submit',
          displayName: 'Form Submission',
          description: 'When a customer submits a form',
          parameters: ['formId', 'formType', 'formFields'],
          operators: ['equals', 'contains'],
          aggregations: ['count'],
          defaultThreshold: 1,
        },
        
        // Form abandonment
        formAbandonment: {
          eventType: 'form_abandonment',
          displayName: 'Form Abandonment',
          description: 'When a customer starts but abandons a form',
          parameters: ['formId', 'formType', 'percentComplete'],
          operators: ['equals', 'greaterThan', 'lessThan'],
          aggregations: ['count', 'duration'],
          defaultThreshold: 1,
          defaultDelay: 15, // minutes
        },
        
        // Campaign interactions
        emailOpen: {
          eventType: 'email_open',
          displayName: 'Email Open',
          description: 'When a customer opens a marketing email',
          parameters: ['campaignId', 'emailId', 'emailSubject', 'deviceType'],
          operators: ['equals', 'contains'],
          aggregations: ['count', 'frequency'],
          defaultThreshold: 1,
        },
        
        emailClick: {
          eventType: 'email_click',
          displayName: 'Email Click',
          description: 'When a customer clicks a link in a marketing email',
          parameters: ['campaignId', 'emailId', 'linkUrl', 'linkText'],
          operators: ['equals', 'contains'],
          aggregations: ['count'],
          defaultThreshold: 1,
        },
        
        // Search events
        search: {
          eventType: 'search',
          displayName: 'Site Search',
          description: 'When a customer searches for something on your site',
          parameters: ['searchQuery', 'searchCategory', 'resultsCount'],
          operators: ['equals', 'contains', 'startsWith', 'greaterThan', 'lessThan'],
          aggregations: ['count', 'frequency'],
          defaultThreshold: 1,
        },
        
        // Custom events
        custom: {
          eventType: 'custom',
          displayName: 'Custom Event',
          description: 'When a customer triggers a custom-defined event',
          parameters: ['eventName', 'properties'],
          operators: ['equals', 'contains', 'greaterThan', 'lessThan'],
          aggregations: ['count', 'frequency'],
          defaultThreshold: 1,
        },
      }
    },
    
    // Time-based triggers
    timeBased: {
      displayName: 'Time-Based Triggers',
      description: 'Triggers based on time and schedules',
      events: {
        // Specific date/time
        specificDateTime: {
          eventType: 'specific_date_time',
          displayName: 'Specific Date/Time',
          description: 'Trigger at a specific date and time',
          parameters: ['date', 'time', 'timezone'],
          operators: ['equals'],
          defaultThreshold: null,
        },
        
        // Recurring schedule
        recurring: {
          eventType: 'recurring',
          displayName: 'Recurring Schedule',
          description: 'Trigger on a recurring schedule',
          parameters: ['frequency', 'days', 'time'],
          operators: ['equals'],
          defaultThreshold: null,
        },
        
        // Relative time after an event
        afterEvent: {
          eventType: 'after_event',
          displayName: 'After Event',
          description: 'Trigger after a specified time since an event occurred',
          parameters: ['eventType', 'delay', 'unit'],
          operators: ['equals', 'greaterThan', 'lessThan'],
          defaultThreshold: null,
        },
        
        // Inactivity period
        inactivity: {
          eventType: 'inactivity',
          displayName: 'Customer Inactivity',
          description: 'Trigger after a customer has been inactive for a period',
          parameters: ['duration', 'unit', 'previousActivity'],
          operators: ['equals', 'greaterThan'],
          defaultThreshold: 30, // days by default
        }
      }
    },
    
    // Segment-based triggers
    segmentBased: {
      displayName: 'Segment-Based Triggers',
      description: 'Triggers based on segment membership changes',
      events: {
        // Added to segment
        addedToSegment: {
          eventType: 'segment_entry',
          displayName: 'Added to Segment',
          description: 'When a customer is added to a segment',
          parameters: ['segmentId', 'segmentName'],
          operators: ['equals', 'in'],
          defaultThreshold: 1,
        },
        
        // Removed from segment
        removedFromSegment: {
          eventType: 'segment_exit',
          displayName: 'Removed from Segment',
          description: 'When a customer is removed from a segment',
          parameters: ['segmentId', 'segmentName', 'duration'],
          operators: ['equals', 'in'],
          defaultThreshold: 1,
        },
        
        // Meeting segment criteria
        meetsSegmentCriteria: {
          eventType: 'segment_criteria_met',
          displayName: 'Meets Segment Criteria',
          description: 'When a customer meets the criteria for a segment, but before being added',
          parameters: ['segmentId', 'segmentName', 'criteriaId'],
          operators: ['equals', 'in'],
          defaultThreshold: 1,
        }
      }
    },
    
    // Compound triggers (combining multiple conditions)
    compound: {
      displayName: 'Compound Triggers',
      description: 'Combine multiple triggers with logical operators',
      events: {
        // AND combination
        and: {
          eventType: 'compound_and',
          displayName: 'All Conditions Match',
          description: 'Trigger when all specified conditions are met',
          parameters: ['conditions'],
          operators: ['and'],
          defaultThreshold: null,
        },
        
        // OR combination
        or: {
          eventType: 'compound_or',
          displayName: 'Any Condition Matches',
          description: 'Trigger when any specified condition is met',
          parameters: ['conditions'],
          operators: ['or'],
          defaultThreshold: null,
        },
        
        // Sequential combination
        sequence: {
          eventType: 'compound_sequence',
          displayName: 'Event Sequence',
          description: 'Trigger when a sequence of events occurs in order',
          parameters: ['events', 'maxTimespan', 'strict'],
          operators: ['sequence'],
          defaultThreshold: null,
        }
      }
    }
  },
  
  // Action types available when triggers fire
  actionTypes: {
    // Email actions
    email: {
      displayName: 'Send Email',
      description: 'Send an email to the customer',
      parameters: {
        templateId: {
          type: 'string',
          required: true,
          description: 'Email template ID to use',
        },
        subject: {
          type: 'string',
          required: true,
          description: 'Email subject line',
        },
        delay: {
          type: 'number',
          required: false,
          default: 0,
          description: 'Delay in minutes before sending',
        }
      }
    },
    
    // SMS actions
    sms: {
      displayName: 'Send SMS',
      description: 'Send a text message to the customer',
      parameters: {
        message: {
          type: 'string',
          required: true,
          description: 'Message content',
          maxLength: 160,
        },
        delay: {
          type: 'number',
          required: false,
          default: 0,
          description: 'Delay in minutes before sending',
        }
      }
    },
    
    // Push notification actions
    pushNotification: {
      displayName: 'Send Push Notification',
      description: 'Send a push notification to the customer\'s devices',
      parameters: {
        title: {
          type: 'string',
          required: true,
          description: 'Notification title',
        },
        body: {
          type: 'string',
          required: true,
          description: 'Notification body',
        },
        image: {
          type: 'string',
          required: false,
          description: 'URL to an image for the notification',
        },
        url: {
          type: 'string',
          required: false,
          description: 'URL to open when clicked',
        },
        delay: {
          type: 'number',
          required: false,
          default: 0,
          description: 'Delay in minutes before sending',
        }
      }
    },
    
    // Segment membership actions
    segmentAction: {
      displayName: 'Update Segment Membership',
      description: 'Add or remove customer from segments',
      parameters: {
        action: {
          type: 'string',
          required: true,
          enum: ['add', 'remove'],
          description: 'Whether to add or remove from segment',
        },
        segmentId: {
          type: 'string',
          required: true,
          description: 'ID of the segment',
        },
        temporary: {
          type: 'boolean',
          required: false,
          default: false,
          description: 'If true, membership is temporary',
        },
        duration: {
          type: 'number',
          required: false,
          description: 'Duration in days if temporary',
        }
      }
    },
    
    // Web personalization actions
    webPersonalization: {
      displayName: 'Update Web Experience',
      description: 'Change the customer\'s website experience',
      parameters: {
        elementType: {
          type: 'string',
          required: true,
          enum: ['banner', 'popup', 'content', 'recommendation'],
          description: 'Type of web element to personalize',
        },
        content: {
          type: 'string',
          required: true,
          description: 'Content ID or HTML content',
        },
        pages: {
          type: 'array',
          required: false,
          description: 'Pages where content should appear',
        },
        position: {
          type: 'string',
          required: false,
          enum: ['top', 'bottom', 'left', 'right', 'center'],
          description: 'Position on page',
        },
        duration: {
          type: 'number',
          required: false,
          default: 30,
          description: 'Duration in days to show this content',
        }
      }
    },
    
    // Campaign actions
    campaignAction: {
      displayName: 'Campaign Action',
      description: 'Start, stop, or modify a campaign for this customer',
      parameters: {
        action: {
          type: 'string',
          required: true,
          enum: ['start', 'stop', 'modify'],
          description: 'Action to take on the campaign',
        },
        campaignId: {
          type: 'string',
          required: true,
          description: 'ID of the campaign',
        },
        parameters: {
          type: 'object',
          required: false,
          description: 'Additional parameters for campaign',
        }
      }
    },
    
    // Webhook actions
    webhook: {
      displayName: 'Webhook',
      description: 'Call an external webhook with customer data',
      parameters: {
        url: {
          type: 'string',
          required: true,
          description: 'Webhook URL',
        },
        method: {
          type: 'string',
          required: false,
          default: 'POST',
          enum: ['GET', 'POST', 'PUT', 'DELETE'],
          description: 'HTTP method',
        },
        headers: {
          type: 'object',
          required: false,
          description: 'HTTP headers',
        },
        payload: {
          type: 'object',
          required: false,
          description: 'Custom payload to send',
        }
      }
    },
    
    // Customer property update actions
    updateCustomer: {
      displayName: 'Update Customer Data',
      description: 'Update customer properties or attributes',
      parameters: {
        properties: {
          type: 'object',
          required: true,
          description: 'Properties to update',
        },
        overwrite: {
          type: 'boolean',
          required: false,
          default: false,
          description: 'Whether to overwrite existing values',
        }
      }
    },
    
    // Notification actions
    notification: {
      displayName: 'System Notification',
      description: 'Send a notification to team members',
      parameters: {
        recipients: {
          type: 'array',
          required: true,
          description: 'List of team member IDs or emails',
        },
        message: {
          type: 'string',
          required: true,
          description: 'Notification message',
        },
        channel: {
          type: 'string',
          required: false,
          default: 'email',
          enum: ['email', 'slack', 'dashboard', 'sms'],
          description: 'Notification channel',
        }
      }
    }
  },
  
  // Default trigger templates for common use cases
  defaultTriggers: [
    // Cart abandonment trigger
    {
      name: 'Cart Abandonment Recovery',
      description: 'Send a reminder email when customer abandons their cart',
      type: 'behavioral',
      event: 'cartAbandonment',
      conditions: [
        { field: 'cartValue', operator: 'greaterThan', value: 0 }
      ],
      actions: [
        {
          type: 'email',
          parameters: {
            templateId: 'cart_abandonment_email',
            subject: 'You left items in your cart!',
            delay: 30 // 30 minute delay
          }
        }
      ],
      cooldownPeriod: 1440, // 24 hours in minutes
      isActive: true
    },
    
    // Browse abandonment trigger
    {
      name: 'Browse Abandonment Recovery',
      description: 'Send a reminder when customer views products but doesn\'t purchase',
      type: 'behavioral',
      event: 'productView',
      conditions: [
        { field: 'count', operator: 'greaterThan', value: 2 },
        { 
          type: 'not_performed', 
          event: 'add_to_cart', 
          timeframe: { unit: 'hours', value: 1 }
        }
      ],
      actions: [
        {
          type: 'email',
          parameters: {
            templateId: 'product_interest_email',
            subject: 'Still interested in these products?',
            delay: 60 // 60 minute delay
          }
        }
      ],
      cooldownPeriod: 1440, // 24 hours in minutes
      isActive: true
    },
    
    // Welcome series trigger
    {
      name: 'New Customer Welcome',
      description: 'Send a welcome email series to new customers',
      type: 'segmentBased',
      event: 'addedToSegment',
      conditions: [
        { field: 'segmentName', operator: 'equals', value: 'new_customers' }
      ],
      actions: [
        {
          type: 'email',
          parameters: {
            templateId: 'welcome_email_1',
            subject: 'Welcome to our store!',
            delay: 0
          }
        },
        {
          type: 'email',
          parameters: {
            templateId: 'welcome_email_2',
            subject: 'Getting started with your account',
            delay: 1440 // 24 hours delay
          }
        },
        {
          type: 'email',
          parameters: {
            templateId: 'welcome_email_3',
            subject: 'Exclusive offer for new customers',
            delay: 4320 // 72 hours delay
          }
        }
      ],
      cooldownPeriod: 10080, // 7 days in minutes
      isActive: true
    },
    
    // Re-engagement trigger
    {
      name: 'Customer Re-engagement',
      description: 'Re-engage customers who haven\'t purchased recently',
      type: 'timeBased',
      event: 'inactivity',
      conditions: [
        { field: 'duration', operator: 'greaterThan', value: 30 }, // 30 days inactivity
        { field: 'previousActivity', operator: 'equals', value: 'purchase' }
      ],
      actions: [
        {
          type: 'email',
          parameters: {
            templateId: 'reengagement_email',
            subject: 'We miss you! Here\'s 15% off your next purchase',
            delay: 0
          }
        }
      ],
      cooldownPeriod: 10080, // 7 days in minutes
      isActive: true
    },
    
    // Post-purchase follow-up
    {
      name: 'Post-Purchase Follow-up',
      description: 'Ask for a review after customer receives their order',
      type: 'timeBased',
      event: 'afterEvent',
      conditions: [
        { field: 'eventType', operator: 'equals', value: 'order_delivered' },
        { field: 'delay', operator: 'equals', value: 7 }, // 7 days after delivery
        { field: 'unit', operator: 'equals', value: 'days' }
      ],
      actions: [
        {
          type: 'email',
          parameters: {
            templateId: 'review_request_email',
            subject: 'How are you enjoying your recent purchase?',
            delay: 0
          }
        }
      ],
      cooldownPeriod: 10080, // 7 days in minutes
      isActive: true
    }
  ],
  
  // System settings for the trigger engine
  engineSettings: {
    evaluationFrequency: 60, // in seconds
    batchSize: 100, // number of events to process in a batch
    maxConcurrentEvaluations: 5,
    maxTriggersPerCustomer: 5, // max triggers to execute per customer per day
    cooldownOverride: {
      enabled: false,
      adminOnly: true
    },
    logging: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      evaluationDetails: process.env.NODE_ENV !== 'production',
      maxDetailedLogs: 1000
    },
    performance: {
      cacheResults: true,
      cacheTTL: 300, // in seconds
      useRedisCache: process.env.REDIS_URL ? true : false,
    }
  }
};

module.exports = triggers;
