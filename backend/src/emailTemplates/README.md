# Marketing Automation Email Templates

This directory contains email templates for the marketing automation system.

## Overview

These templates use Handlebars syntax for dynamic content. They are designed to be responsive and work across different email clients.

## Templates

### campaignBase.html

Base template that defines the common structure and styling for all marketing emails. Other templates extend this base template.

**Key Features:**
- Responsive design that works on desktop and mobile
- Customizable header with logo
- Footer with legal information and unsubscribe links
- Customizable color scheme using CSS variables

### behaviorTrigger.html

Template for behavior-triggered campaigns, such as abandoned cart emails or product view follow-ups.

**Key Features:**
- Activity summary section
- Personalized recommendations based on user behavior
- Urgency elements (countdown timers, limited-time offers)
- Support for discount codes

### retargeting.html

Template for retargeting campaigns with product recommendations.

**Key Features:**
- Recently viewed products section
- Product recommendations with pricing and discounts
- Social proof section with customer reviews
- Limited-time offer notifications

## Usage

### Template Variables

The templates use the following variables that should be provided by your application:

#### Common Variables
- `{{company.name}}` - Company name
- `{{company.logoUrl}}` - URL to company logo
- `{{company.address}}` - Company address
- `{{customer.firstName}}` - Customer's first name
- `{{currentYear}}` - Current year for copyright notice
- `{{unsubscribeUrl}}` - URL for unsubscribing
- `{{preferencesUrl}}` - URL for email preferences
- `{{privacyPolicyUrl}}` - URL to privacy policy
- `{{cta}}` - Call to action object with `url` and `text` properties
- `{{campaignId}}` - ID of the campaign for tracking

#### Behavior Trigger Template Variables
- `{{triggerAction}}` - Action that triggered the email
- `{{customerActivity}}` - Array of customer activities
- `{{abandonedCart}}` - Boolean indicating if this is an abandoned cart email
- `{{viewedItems}}` - Boolean indicating if this is a viewed items email
- `{{searchHistory}}` - Boolean indicating if this is a search history email
- `{{searchTerms}}` - Customer's search terms
- `{{discountCode}}` - Discount code (if applicable)
- `{{discountAmount}}` - Discount amount (if applicable)
- `{{expiryTime}}` - Expiry time for offers
- `{{recommendations}}` - Array of recommended products
- `{{urgencyMessage}}` - Urgency message (if applicable)

#### Retargeting Template Variables
- `{{limitedTimeOffer}}` - Object with limited time offer details
- `{{recentlyViewed}}` - Array of recently viewed products
- `{{recommendations}}` - Array of recommended products
- `{{socialProof}}` - Object with social proof details
- `{{personalizedMessage}}` - Personalized message for the customer

### Example Usage

```javascript
const fs = require('fs');
const Handlebars = require('handlebars');
const path = require('path');

// Register partials
Handlebars.registerPartial('base', fs.readFileSync(
  path.join(__dirname, 'campaignBase.html'), 'utf8'
));

// Load template
const templateSource = fs.readFileSync(
  path.join(__dirname, 'behaviorTrigger.html'), 'utf8'
);
const template = Handlebars.compile(templateSource);

// Prepare data
const data = {
  title: 'Items in Your Cart',
  company: {
    name: 'YourCompany',
    logoUrl: 'https://example.com/logo.png',
    address: '123 Main St, City, Country'
  },
  customer: {
    firstName: 'John'
  },
  currentYear: new Date().getFullYear(),
  unsubscribeUrl: 'https://example.com/unsubscribe',
  preferencesUrl: 'https://example.com/preferences',
  privacyPolicyUrl: 'https://example.com/privacy',
  cta: {
    url: 'https://example.com/cart',
    text: 'Complete Your Purchase'
  },
  campaignId: 'camp_123456',
  triggerAction: 'left items in your cart',
  abandonedCart: true,
  discountCode: 'WELCOME10',
  discountAmount: 10,
  expiryTime: '24 hours',
  recommendations: [
    {
      id: 'prod_1',
      name: 'Product 1',
      price: '$19.99',
      url: 'https://example.com/product1',
      imageUrl: 'https://example.com/product1.jpg'
    },
    // More products...
  ]
};

// Render template
const html = template(data);

// Use the HTML (send via email service, etc.)
console.log(html);
```

## Customization

You can customize the look and feel of the templates by modifying the CSS styles. The base template defines CSS variables that can be overridden:

```css
:root {
    --primary-color: #4a86e8;
    --secondary-color: #34a853;
    --accent-color: #fbbc05;
    --text-color: #333333;
    --background-color: #ffffff;
}
```

Change these values to match your brand colors.
