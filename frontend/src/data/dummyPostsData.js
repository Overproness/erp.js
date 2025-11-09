import dayjs from 'dayjs';

// Helper function to generate dates around current date
const generateDates = () => {
  // Create an array of dates spanning 3 months (past month, current month, next month)
  const dates = [];
  
  // Add past dates (about 100 posts in the past)
  for (let i = 100; i >= 1; i--) {
    dates.push(dayjs().subtract(i, 'day'));
  }
  
  // Add current and future dates (about 56 posts in the future)
  for (let i = 0; i < 56; i++) {
    dates.push(dayjs().add(i, 'day'));
  }
  
  return dates;
};

// Generate random post content
const generatePostContent = (index) => {
  const contentOptions = [
    `Product update ${index}: New features to enhance your workflow! #ProductUpdate #Innovation`,
    `Behind the scenes: Our team working on the next big thing! #BehindTheScenes #TeamWork`,
    `Tips and tricks: How to maximize productivity with our tools. #Tips #Productivity`,
    `Industry insights: What's trending in tech this week? #TrendReport #TechNews`,
    `Customer spotlight: See how ${['Company A', 'Brand B', 'Startup C', 'Enterprise D'][index % 4]} achieved success with our platform! #CustomerStory #Success`,
    `Join our upcoming webinar on ${['digital transformation', 'product innovation', 'market trends', 'customer engagement'][index % 4]}. Register now! #Webinar #Learning`,
    `We're excited to announce our partnership with ${['TechCorp', 'InnovateNow', 'FutureTech', 'DigitalPros'][index % 4]}! #Partnership #Growth`,
    `Meet the team: Introducing our ${['design', 'development', 'marketing', 'customer success'][index % 4]} experts. #TeamSpotlight #MeetTheTeam`,
    `Quick poll: What feature would you like to see next? Comment below! #Feedback #ProductDevelopment`,
    `Did you know? Our tool can help you save ${[20, 30, 40, 50][index % 4]}% of your time on daily tasks! #DidYouKnow #Efficiency`,
  ];
  
  return contentOptions[index % contentOptions.length];
};

// Generate platforms for a post
const generatePlatforms = (index) => {
  const platformCombinations = [
    ['facebook', 'instagram', 'twitter'],
    ['facebook', 'instagram'],
    ['facebook', 'twitter'],
    ['instagram', 'twitter'],
    ['facebook'],
    ['instagram'],
    ['twitter'],
    ['facebook', 'instagram', 'twitter', 'linkedin'],
    ['linkedin', 'facebook'],
    ['linkedin', 'twitter'],
  ];
  
  return platformCombinations[index % platformCombinations.length];
};

// Generate performance metrics
const generatePerformance = (isPublished, index) => {
  if (!isPublished) {
    return {
      engagement: 0,
      reach: 0,
      impressions: 0
    };
  }
  
  // Generate more realistic and varied metrics
  const baseEngagement = Math.floor(200 + Math.random() * 1800);
  const baseReach = Math.floor(baseEngagement * (3 + Math.random() * 5));
  const baseImpressions = Math.floor(baseReach * (1.2 + Math.random() * 0.8));
  
  return {
    engagement: baseEngagement,
    reach: baseReach,
    impressions: baseImpressions
  };
};

// Generate dates for posts
const dates = generateDates();

// Create exactly 156 posts to match the dashboard count
const dummyPosts = Array.from({ length: 156 }, (_, index) => {
  // Determine status based on date
  const date = dates[index % dates.length];
  const today = dayjs();
  const isPast = date.isBefore(today, 'day');
  const isFuture = date.isAfter(today, 'day');
  
  // Determine status based on date and add some randomness
  let status;
  if (isPast) {
    status = Math.random() > 0.1 ? 'published' : (Math.random() > 0.5 ? 'failed' : 'draft');
  } else if (isFuture) {
    status = Math.random() > 0.2 ? 'scheduled' : 'draft';
  } else {
    status = Math.random() > 0.5 ? 'published' : 'scheduled';
  }
  
  // Generate scheduled time
  const hour = Math.floor(9 + Math.random() * 9); // Between 9AM and 6PM
  const minute = Math.floor(Math.random() * 60);
  const scheduledAt = date.hour(hour).minute(minute).format();
  
  // Generate media attachments
  const hasMedia = Math.random() > 0.3;
  const mediaCount = hasMedia ? Math.floor(1 + Math.random() * 3) : 0;
  const media = Array.from({ length: mediaCount }, (_, i) => 
    `https://example.com/image${index}_${i}.jpg`
  );
  
  // Return the post object
  return {
    _id: `post_${index + 1}`,
    content: generatePostContent(index),
    platforms: generatePlatforms(index),
    status,
    scheduledAt,
    media,
    performance: generatePerformance(status === 'published', index)
  };
});

export default dummyPosts;