// Updated pending reviews from ReviewMonitoringModule (reviews with responded: false)
export const pendingReviews = [
  {
    id: '2',
    customer: 'Jane Smith',
    rating: 2,
    date: '2023-04-10',
    content: 'Poor experience. Long wait times and staff was not attentive.',
    platform: 'Facebook',
    responded: false,
    sentiment: 'negative'
  },
  {
    id: '4',
    customer: 'Emily Davis',
    rating: 1,
    date: '2023-04-02',
    content: 'Very disappointed with the service. Will not be returning.',
    platform: 'Google',
    responded: false,
    sentiment: 'negative'
  }
];

// Responded reviews from ReviewMonitoringModule (reviews with responded: true)
export const respondedReviews = [
  {
    id: '1',
    customer: 'John Doe',
    rating: 5,
    date: '2023-04-15',
    content: 'Excellent service! The team was very professional and helpful. Would highly recommend.',
    platform: 'Google',
    responded: true,
    sentiment: 'positive',
    response: 'Thank you for your kind words! We\'re delighted that you enjoyed your experience with us. We strive to provide excellent service to all our customers. Looking forward to serving you again soon!'
  },
  {
    id: '3',
    customer: 'Robert Johnson',
    rating: 4,
    date: '2023-04-05',
    content: 'Good overall, but could improve on communication.',
    platform: 'Google',
    responded: true,
    sentiment: 'neutral',
    response: 'Thank you for your feedback, Robert. We appreciate you taking the time to share your experience. We\'re constantly working to improve our communication and will take your suggestions into account. Please don\'t hesitate to reach out if you have any other feedback.'
  },
  {
    id: '5',
    customer: 'Michael Brown',
    rating: 5,
    date: '2023-03-28',
    content: 'Amazing experience! The staff went above and beyond.',
    platform: 'Facebook',
    responded: true,
    sentiment: 'positive',
    response: 'We\'re thrilled to hear about your amazing experience, Michael! Our team works hard to provide exceptional service, and we\'re glad it showed. Thank you for your kind words and support. We hope to see you again soon!'
  }
];

// Response templates
export const responseTemplates = [
  {
    id: '1',
    name: 'Positive Response Template',
    content: 'Thank you for your positive feedback! We are thrilled to hear you enjoyed your experience with us. We look forward to serving you again soon!',
    sentiment: 'positive'
  },
  {
    id: '2',
    name: 'Neutral Response Template',
    content: 'Thank you for your feedback. We appreciate your comments and will use them to improve our service. If you have any specific suggestions, please feel free to contact us directly.',
    sentiment: 'neutral'
  },
  {
    id: '3',
    name: 'Negative Response Template',
    content: 'We apologize for your disappointing experience. We would like to learn more about what happened and make things right. Please contact our customer service team at support@example.com so we can address your concerns personally.',
    sentiment: 'negative'
  },
  {
    id: '4',
    name: 'Very Positive Response',
    content: 'Wow! We are absolutely delighted by your wonderful review! Thank you for taking the time to share your experience. Our team works hard to exceed expectations, and we\'re thrilled that we hit the mark. We can\'t wait to welcome you back soon!',
    sentiment: 'positive'
  },
  {
    id: '5',
    name: 'Service Issue Apology',
    content: 'We sincerely apologize for the service issues you experienced. This is not the standard we hold ourselves to. We would appreciate the opportunity to make this right - please contact our manager at manager@example.com so we can address your concerns personally and ensure a better experience next time.',
    sentiment: 'negative'
  }
];
