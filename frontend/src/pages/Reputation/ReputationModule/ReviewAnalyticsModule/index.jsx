import React, { useState, useEffect } from 'react';
import { 
  Container, Grid, Paper, Typography, Box, Card, CardContent,
  Divider, Button, Menu, MenuItem, Skeleton, Chip,
  CircularProgress, IconButton, FormControl, InputLabel, Select
} from '@mui/material';
import { 
  Download as DownloadIcon,
  FilterList as FilterIcon,
  DateRange as DateRangeIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Star as StarIcon,
  Comment as CommentIcon,
  Message as MessageIcon
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { fetchAnalytics, exportAnalytics } from '@/redux/reputation/reputationActions';
import { 
  selectAnalyticsOverview,
  selectAnalyticsTrends,
  selectAnalyticsMetrics,
  selectSentimentDistribution,
  selectAverageRating
} from '@/redux/reputation/reputationSelectors';
import { useReviewAnalytics } from '@/hooks/reputation/useReviewAnalytics';

// Components
import SentimentChart from '@/components/ReputationComponents/SentimentChart';
import ReviewMetricsCards from '@/components/ReputationComponents/ReviewMetricsCards';
import ReviewTimeline from '@/components/ReputationComponents/ReviewTimeline';

// Dummy data for when no real data is available - updated to reflect total reviews = 5
const dummyData = {
  kpis: {
    averageRating: 3.4,
    totalReviews: 5,
    responseRate: 60,
    sentimentScore: 68
  },
  comparisonMetrics: {
    ratingChange: { absolute: 0.3, percentage: 7.7, trend: 'up' },
    reviewsChange: { absolute: 1, percentage: 25, trend: 'up' },
    responseRateChange: { absolute: 10, percentage: 20, trend: 'up' },
    sentimentChange: { absolute: 3, percentage: 4.0, trend: 'up' }
  },
  sentimentDistribution: {
    positive: 40,
    neutral: 20,
    negative: 40,
    // Added more detailed sentiment distribution data
    byRating: {
      5: { positive: 100, neutral: 0, negative: 0 },
      4: { positive: 75, neutral: 25, negative: 0 },
      3: { positive: 0, neutral: 100, negative: 0 },
      2: { positive: 0, neutral: 25, negative: 75 },
      1: { positive: 0, neutral: 0, negative: 100 }
    },
    // Temporal sentiment trends (monthly)
    temporal: [
      { month: 'Jan', positive: 0, neutral: 0, negative: 0 },
      { month: 'Feb', positive: 0, neutral: 0, negative: 0 },
      { month: 'Mar', positive: 0, neutral: 0, negative: 100 },
      { month: 'Apr', positive: 50, neutral: 25, negative: 25 },
      { month: 'May', positive: 100, neutral: 0, negative: 0 },
      { month: 'Jun', positive: 0, neutral: 0, negative: 0 }
    ]
  },
  // New detailed sentiment analysis data
  sentimentAnalysis: {
    // Sentiment trends over time (last 6 months)
    trends: [
      { period: `${new Date().getFullYear()}-${String(new Date().getMonth() - 5 + 1).padStart(2, '0')}`, positive: 0, neutral: 0, negative: 0 },
      { period: `${new Date().getFullYear()}-${String(new Date().getMonth() - 4 + 1).padStart(2, '0')}`, positive: 0, neutral: 0, negative: 0 },
      { period: `${new Date().getFullYear()}-${String(new Date().getMonth() - 3 + 1).padStart(2, '0')}`, positive: 0, neutral: 0, negative: 1 },
      { period: `${new Date().getFullYear()}-${String(new Date().getMonth() - 2 + 1).padStart(2, '0')}`, positive: 1, neutral: 1, negative: 1 },
      { period: `${new Date().getFullYear()}-${String(new Date().getMonth() - 1 + 1).padStart(2, '0')}`, positive: 1, neutral: 0, negative: 0 },
      { period: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`, positive: 0, neutral: 0, negative: 0 }
    ],
    // Sentiment by source/platform
    byPlatform: [
      { platform: 'Google', positive: 1, neutral: 1, negative: 1 },
      { platform: 'Facebook', positive: 1, neutral: 0, negative: 1 },
    ],
    // Top positive and negative keywords
    keywords: {
      positive: ['excellent', 'professional', 'helpful'],
      negative: ['poor', 'disappointed', 'wait', 'not attentive']
    },
    // Sentiment by category
    categories: [
      { name: 'Service', positive: 2, neutral: 0, negative: 2 },
      { name: 'Quality', positive: 2, neutral: 0, negative: 1 },
      { name: 'Value', positive: 1, neutral: 1, negative: 1 },
      { name: 'Cleanliness', positive: 1, neutral: 0, negative: 0 }
    ]
  },
  ratingDistributionPercent: {
    5: 40,
    4: 20,
    3: 20,
    2: 20,
    1: 0
  },
  platformPerformance: [
    { id: 'google', name: 'Google', count: 3, avgRating: 3.3, responseRate: 67 },
    { id: 'facebook', name: 'Facebook', count: 2, avgRating: 3.5, responseRate: 50 },
  ],
  trends: {
    // Enhanced review trends with more realistic patterns
    reviewTrends: [
      { period: '2023-01', count: 0, averageRating: 0, responseRate: 0 },
      { period: '2023-02', count: 0, averageRating: 0, responseRate: 0 },
      { period: '2023-03', count: 1, averageRating: 1.0, responseRate: 0 },
      { period: '2023-04', count: 3, averageRating: 3.7, responseRate: 67 },
      { period: '2023-05', count: 1, averageRating: 5.0, responseRate: 100 },
      { period: '2023-06', count: 0, averageRating: 0, responseRate: 0 }
    ],
    // Added daily trend data for more granular analysis
    dailyTrends: [
      { date: new Date(2023, 2, 28).toISOString().split('T')[0], count: 1, averageRating: 1.0, dayOfWeek: 'Tue' },
      { date: new Date(2023, 3, 2).toISOString().split('T')[0], count: 1, averageRating: 1.0, dayOfWeek: 'Sun' },
      { date: new Date(2023, 3, 5).toISOString().split('T')[0], count: 1, averageRating: 4.0, dayOfWeek: 'Wed' },
      { date: new Date(2023, 3, 10).toISOString().split('T')[0], count: 1, averageRating: 2.0, dayOfWeek: 'Mon' },
      { date: new Date(2023, 3, 15).toISOString().split('T')[0], count: 1, averageRating: 5.0, dayOfWeek: 'Sat' },
    ],
    // Added sentiment trends over time
    sentimentTrends: [
      { period: '2023-01', positive: 0, neutral: 0, negative: 0 },
      { period: '2023-02', positive: 0, neutral: 0, negative: 0 },
      { period: '2023-03', positive: 0, neutral: 0, negative: 1 },
      { period: '2023-04', positive: 1, neutral: 1, negative: 1 },
      { period: '2023-05', positive: 1, neutral: 0, negative: 0 },
      { period: '2023-06', positive: 0, neutral: 0, negative: 0 }
    ],
    // Added rating distribution trends
    ratingTrends: [
      { period: '2023-01', '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 },
      { period: '2023-02', '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 },
      { period: '2023-03', '5': 0, '4': 0, '3': 0, '2': 0, '1': 1 },
      { period: '2023-04', '5': 1, '4': 1, '3': 0, '2': 1, '1': 0 },
      { period: '2023-05', '5': 1, '4': 0, '3': 0, '2': 0, '1': 0 },
      { period: '2023-06', '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 }
    ]
  },
  // Advanced metrics - adjusted to match 5 reviews
  advancedMetrics: {
    responseTime: {
      average: 12.5, // hours
      trend: 'down', // improving
      change: 15 // percent
    },
    topIssues: [
      { issue: 'Wait Time', count: 2, percentage: 40 },
      { issue: 'Staff Attitude', count: 1, percentage: 20 },
      { issue: 'Communication', count: 1, percentage: 20 }
    ],
    topCompliments: [
      { compliment: 'Professional Staff', count: 2, percentage: 40 },
      { compliment: 'Service Quality', count: 2, percentage: 40 },
      { compliment: 'Helpful', count: 1, percentage: 20 }
    ]
  }
};

const ReviewAnalyticsModule = () => {
  const dispatch = useDispatch();
  const [dateRange, setDateRange] = useState('30d');
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);
  const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);
  const [platformFilter, setPlatformFilter] = useState('all');
  
  // Custom hook for analytics data and functions
  const {
    overview,
    trends,
    metrics,
    sentimentDistribution,
    averageRating,
    comparisonMetrics,
    platformPerformance,
    sentimentTrends,
    ratingDistributionPercent,
    kpis,
    loading,
    error,
    refreshAnalytics,
    updateDateRange,
    exportAnalyticsData
  } = useReviewAnalytics({
    autoFetch: true,
    dateRange,
    includeComparisons: true
  });

  // Always use dummy data for now
  const displayKpis = dummyData.kpis;
  const displayComparisonMetrics = dummyData.comparisonMetrics;
  const displaySentimentDistribution = dummyData.sentimentDistribution;
  const displaySentimentAnalysis = dummyData.sentimentAnalysis;
  const displayRatingDistributionPercent = dummyData.ratingDistributionPercent;
  const displayPlatformPerformance = dummyData.platformPerformance;
  const displayTrends = dummyData.trends;

  // Handle date range change
  const handleDateRangeChange = (range) => {
    setDateRange(range);
    updateDateRange(range);
  };

  // Handle export menu
  const handleExportMenuOpen = (event) => {
    setExportMenuAnchor(event.currentTarget);
  };

  const handleExportMenuClose = () => {
    setExportMenuAnchor(null);
  };

  const handleExport = async (format) => {
    await exportAnalyticsData(format);
    handleExportMenuClose();
  };

  // Handle filter menu
  const handleFilterMenuOpen = (event) => {
    setFilterMenuAnchor(event.currentTarget);
  };

  const handleFilterMenuClose = () => {
    setFilterMenuAnchor(null);
  };

  const handlePlatformFilterChange = (event) => {
    setPlatformFilter(event.target.value);
  };

  // Generate date range display text
  const getDateRangeText = (range) => {
    switch (range) {
      case '7d':
        return 'Last 7 days';
      case '30d':
        return 'Last 30 days';
      case '90d':
        return 'Last 90 days';
      case '1y':
        return 'Last year';
      default:
        return 'Custom range';
    }
  };

  return (
    <Container maxWidth="xl">
      {/* Main Content - Streamlined without tabs */}
      <Grid container spacing={3}>
        {/* Review Trend Analysis Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2, mb: 3 }}>
            <Typography variant="h5" gutterBottom fontWeight="medium">
              Review Trends
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Track your review volume and rating trends over time.
            </Typography>
            
            {/* Filter row */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
              <Box sx={{ minWidth: 200 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Platform</InputLabel>
                  <Select value="all" label="Platform">
                    <MenuItem value="all">All Platforms</MenuItem>
                    <MenuItem value="google">Google</MenuItem>
                    <MenuItem value="facebook">Facebook</MenuItem>
                    <MenuItem value="yelp">Yelp</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ minWidth: 200 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Rating</InputLabel>
                  <Select value="all" label="Rating">
                    <MenuItem value="all">All Ratings</MenuItem>
                    <MenuItem value="5">5 Stars</MenuItem>
                    <MenuItem value="4">4 Stars</MenuItem>
                    <MenuItem value="3">3 Stars</MenuItem>
                    <MenuItem value="2">2 Stars</MenuItem>
                    <MenuItem value="1">1 Star</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ minWidth: 200 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Sentiment</InputLabel>
                  <Select value="all" label="Sentiment">
                    <MenuItem value="all">All Sentiments</MenuItem>
                    <MenuItem value="positive">Positive</MenuItem>
                    <MenuItem value="neutral">Neutral</MenuItem>
                    <MenuItem value="negative">Negative</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ minWidth: 200 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Group By</InputLabel>
                  <Select value="date" label="Group By">
                    <MenuItem value="date">Date</MenuItem>
                    <MenuItem value="platform">Platform</MenuItem>
                    <MenuItem value="rating">Rating</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
                <IconButton size="small" sx={{ mr: 1 }}>
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
            
            {loading ? (
              <Skeleton variant="rectangular" height={350} />
            ) : (
              <Box sx={{ height: 350, mt: 2 }}>
                <ReviewTimeline trends={displayTrends.reviewTrends || []} />
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* Rating Distribution & Sentiment Analysis Side by Side */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%', borderRadius: 2, boxShadow: 2 }}>
            <Typography variant="h5" gutterBottom fontWeight="medium">
              Rating Distribution
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Breakdown of ratings received across all platforms.
            </Typography>
            {loading ? (
              <Skeleton variant="rectangular" height={300} />
            ) : (
              <Box sx={{ height: 300, mt: 2 }}>
                {Object.entries(displayRatingDistributionPercent).map(([rating, percent]) => (
                  <Box key={rating} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography sx={{ minWidth: 40, fontWeight: 'bold' }}>{rating}★</Typography>
                    <Box
                      sx={{
                        flexGrow: 1,
                        ml: 1,
                        height: 24,
                        backgroundColor: 'background.paper',
                        position: 'relative',
                        borderRadius: 1,
                        overflow: 'hidden',
                        boxShadow: 'inset 0 0 5px rgba(0,0,0,0.1)',
                      }}
                    >
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          height: '100%',
                          width: `${percent}%`,
                          backgroundColor: rating >= 4 ? 'success.main' : 
                                         rating >= 3 ? 'warning.main' : 'error.main',
                          transition: 'width 1s ease-in-out',
                        }}
                      />
                    </Box>
                    <Typography sx={{ ml: 2, minWidth: 60, fontWeight: 'medium' }}>{percent}%</Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%', borderRadius: 2, boxShadow: 2 }}>
            <Typography variant="h5" gutterBottom fontWeight="medium">
              Sentiment Distribution
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Analysis of review sentiment across all platforms.
            </Typography>
            
            {/* Period selector for sentiment analysis */}
            <Box sx={{ mb: 2 }}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Period</InputLabel>
                <Select value="monthly" label="Period">
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="quarterly">Quarterly</MenuItem>
                  <MenuItem value="yearly">Yearly</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            {/* Chart type buttons */}
            <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
              <Button variant="contained" size="small" sx={{ px: 2, py: 0.5, minWidth: 0 }}>
                LINE
              </Button>
              <Button variant="outlined" size="small" sx={{ px: 2, py: 0.5, minWidth: 0 }}>
                BAR
              </Button>
              <Button variant="outlined" size="small" sx={{ px: 2, py: 0.5, minWidth: 0 }}>
                AREA
              </Button>
              <Button variant="outlined" size="small" sx={{ px: 2, py: 0.5, minWidth: 0 }}>
                PIE
              </Button>
            </Box>
            
            {loading ? (
              <Skeleton variant="rectangular" height={300} />
            ) : (
              <Box sx={{ height: 300, mt: 2 }}>
                <SentimentChart data={displaySentimentDistribution} />
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Added Sentiment Keywords Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2, mb: 3 }}>
            <Typography variant="h5" gutterBottom fontWeight="medium">
              Sentiment Keywords
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Most common keywords in positive and negative reviews.
            </Typography>
            {loading ? (
              <Skeleton variant="rectangular" height={150} />
            ) : (
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 2, color: 'success.main' }}>
                    Top Positive Keywords
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {displaySentimentAnalysis.keywords.positive.map((keyword, index) => (
                      <Chip 
                        key={keyword}
                        label={keyword}
                        color="success"
                        variant={index < 2 ? "filled" : "outlined"}
                        size="medium"
                        sx={{ px: 1, fontSize: index < 2 ? 16 : 14 }}
                      />
                    ))}
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 2, color: 'error.main' }}>
                    Top Negative Keywords
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {displaySentimentAnalysis.keywords.negative.map((keyword, index) => (
                      <Chip 
                        key={keyword}
                        label={keyword}
                        color="error"
                        variant={index < 2 ? "filled" : "outlined"}
                        size="medium"
                        sx={{ px: 1, fontSize: index < 2 ? 16 : 14 }}
                      />
                    ))}
                  </Box>
                </Grid>
              </Grid>
            )}
          </Paper>
        </Grid>
        
        {/* Platform Performance Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
            <Typography variant="h5" gutterBottom fontWeight="medium">
              Platform Performance
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Compare your performance across different review platforms.
            </Typography>
            {loading ? (
              <Skeleton variant="rectangular" height={300} />
            ) : (
              <Box sx={{ mt: 3 }}>
                <Grid container spacing={3}>
                  {displayPlatformPerformance.map(platform => (
                    <Grid item xs={12} md={4} key={platform.id}>
                      <Card sx={{ 
                        borderRadius: 2, 
                        boxShadow: 1, 
                        p: 2, 
                        height: '100%',
                        border: '1px solid',
                        borderColor: platform.id === 'google' ? '#4285F4' : 
                                    platform.id === 'facebook' ? '#1877F2' : 
                                    platform.id === 'yelp' ? '#D32323' : 'divider'
                      }}>
                        <Typography variant="h6" gutterBottom sx={{ 
                          color: platform.id === 'google' ? '#4285F4' : 
                                platform.id === 'facebook' ? '#1877F2' : 
                                platform.id === 'yelp' ? '#D32323' : 'text.primary'
                        }}>
                          {platform.name}
                        </Typography>
                        
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                          <Grid item xs={4}>
                            <Typography variant="body2" color="text.secondary">Reviews</Typography>
                            <Typography variant="h6">{platform.count}</Typography>
                          </Grid>
                          <Grid item xs={4}>
                            <Typography variant="body2" color="text.secondary">Avg. Rating</Typography>
                            <Typography variant="h6">{platform.avgRating.toFixed(1)}</Typography>
                          </Grid>
                          <Grid item xs={4}>
                            <Typography variant="body2" color="text.secondary">Response Rate</Typography>
                            <Typography variant="h6">{platform.responseRate}%</Typography>
                          </Grid>
                        </Grid>
                        
                        <Box sx={{ mt: 3, display: 'flex', alignItems: 'center' }}>
                          <Box
                            sx={{
                              flexGrow: 1,
                              height: 8,
                              backgroundColor: 'background.paper',
                              position: 'relative',
                              borderRadius: 4,
                              overflow: 'hidden',
                              boxShadow: 'inset 0 0 5px rgba(0,0,0,0.1)',
                            }}
                          >
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                height: '100%',
                                width: `${(platform.count / displayKpis.totalReviews) * 100}%`,
                                backgroundColor: platform.id === 'google' ? '#4285F4' : 
                                              platform.id === 'facebook' ? '#1877F2' : 
                                              platform.id === 'yelp' ? '#D32323' : 'primary.main',
                              }}
                            />
                          </Box>
                          <Typography sx={{ ml: 1, fontSize: 14 }}>
                            {Math.round((platform.count / displayKpis.totalReviews) * 100)}%
                          </Typography>
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* Key Insights Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
            <Typography variant="h5" gutterBottom fontWeight="medium">
              Review Insights
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Key findings and recommendations based on your 5 reviews.
            </Typography>
            
            {loading ? (
              <Skeleton variant="rectangular" height={200} />
            ) : (
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 2, borderRadius: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
                    <Typography variant="subtitle1" fontWeight="bold">Key Findings</Typography>
                    <Divider sx={{ my: 1, borderColor: 'success.contrastText', opacity: 0.3 }} />
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      • 2 out of 5 reviews (40%) mention positive staff interactions
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      • 3 out of 5 reviews (60%) have been responded to
                    </Typography>
                    <Typography variant="body2">
                      • April had the highest review activity with 3 reviews
                    </Typography>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 2, borderRadius: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
                    <Typography variant="subtitle1" fontWeight="bold">Action Items</Typography>
                    <Divider sx={{ my: 1, borderColor: 'info.contrastText', opacity: 0.3 }} />
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      • Address wait time issues mentioned in 2 negative reviews
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      • Respond to the remaining 2 reviews to improve response rate
                    </Typography>
                    <Typography variant="body2">
                      • Focus on improving Facebook performance (50% response rate)
                    </Typography>
                  </Card>
                </Grid>
              </Grid>
            )}

            {/* Additional performance insights */}
            {!loading && (
              <Card sx={{ mt: 3, p: 2, borderRadius: 2, bgcolor: 'background.paper', boxShadow: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold" color="text.primary" gutterBottom>
                  Recent Performance
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <StarIcon sx={{ color: 'warning.main', mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        Average rating: <span style={{ fontWeight: 'bold' }}>{displayKpis.averageRating.toFixed(1)}</span>
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 4, fontSize: '0.85rem' }}>
                      {displayComparisonMetrics.ratingChange.trend === 'up' ? 'Improved by' : 'Decreased by'} {displayComparisonMetrics.ratingChange.absolute.toFixed(1)} stars recently
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CommentIcon sx={{ color: 'info.main', mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        Review sentiment: <span style={{ fontWeight: 'bold' }}>{displayKpis.sentimentScore}%</span> positive
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 4, fontSize: '0.85rem' }}>
                      40% 5-star, 20% 4-star, 40% 2-star or below
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <MessageIcon sx={{ color: 'success.main', mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        Response rate: <span style={{ fontWeight: 'bold' }}>{displayKpis.responseRate}%</span>
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 4, fontSize: '0.85rem' }}>
                      Google: 67% responded, Facebook: 50% responded
                    </Typography>
                  </Grid>
                </Grid>
              </Card>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Date Range Filter Menu */}
      <Menu
        anchorEl={filterMenuAnchor}
        open={Boolean(filterMenuAnchor)}
        onClose={handleFilterMenuClose}
        sx={{ '& .MuiPaper-root': { borderRadius: 2, boxShadow: 3 } }}
      >
        <MenuItem onClick={() => { handleDateRangeChange('7d'); handleFilterMenuClose(); }}>
          Last 7 days
        </MenuItem>
        <MenuItem onClick={() => { handleDateRangeChange('30d'); handleFilterMenuClose(); }}>
          Last 30 days
        </MenuItem>
        <MenuItem onClick={() => { handleDateRangeChange('90d'); handleFilterMenuClose(); }}>
          Last 90 days
        </MenuItem>
        <MenuItem onClick={() => { handleDateRangeChange('1y'); handleFilterMenuClose(); }}>
          Last year
        </MenuItem>
        <Divider />
        <Box sx={{ p: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Platform</InputLabel>
            <Select
              value={platformFilter}
              label="Platform"
              onChange={handlePlatformFilterChange}
              sx={{ borderRadius: 1 }}
            >
              <MenuItem value="all">All Platforms</MenuItem>
              <MenuItem value="google">Google</MenuItem>
              <MenuItem value="facebook">Facebook</MenuItem>
              <MenuItem value="yelp">Yelp</MenuItem>
              <MenuItem value="trustpilot">Trustpilot</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Menu>

      {/* Export Menu */}
      {/* <Menu
        anchorEl={exportMenuAnchor}
        open={Boolean(exportMenuAnchor)}
        onClose={handleExportMenuClose}
        sx={{ '& .MuiPaper-root': { borderRadius: 2, boxShadow: 3 } }}
      >
        <MenuItem onClick={() => handleExport('pdf')}>Export as PDF</MenuItem>
        <MenuItem onClick={() => handleExport('csv')}>Export as CSV</MenuItem>
        <MenuItem onClick={() => handleExport('excel')}>Export as Excel</MenuItem>
        <MenuItem onClick={() => handleExport('image')}>Export as Image</MenuItem>
      </Menu> */}
    </Container>
  );
};

export default ReviewAnalyticsModule;
