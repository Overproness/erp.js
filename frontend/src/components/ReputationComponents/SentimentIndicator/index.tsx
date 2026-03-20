import React from 'react';
import PropTypes from 'prop-types';
import { Box, Tooltip, Typography, LinearProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  SentimentSatisfied as PositiveIcon,
  SentimentNeutral as NeutralIcon,
  SentimentDissatisfied as NegativeIcon
} from '@mui/icons-material';

const StyledSentimentBadge = styled(Box)(({ theme, sentiment }) => {
  const colors = {
    positive: {
      bg: theme.palette.success.light,
      color: theme.palette.success.dark,
      border: theme.palette.success.main
    },
    neutral: {
      bg: theme.palette.warning.light,
      color: theme.palette.warning.dark,
      border: theme.palette.warning.main
    },
    negative: {
      bg: theme.palette.error.light,
      color: theme.palette.error.dark,
      border: theme.palette.error.main
    },
  };
  
  const colorSet = colors[sentiment] || colors.neutral;
  
  return {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(0.25, 1),
    backgroundColor: colorSet.bg,
    color: colorSet.color,
    border: `1px solid ${colorSet.border}`,
    fontWeight: 500,
    fontSize: '0.75rem',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s ease-in-out',
  };
});

const StyledProgressBar = styled(LinearProgress)(({ theme, sentiment, value }) => {
  let color;
  if (sentiment === 'positive') {
    color = theme.palette.success;
  } else if (sentiment === 'negative') {
    color = theme.palette.error;
  } else {
    color = theme.palette.warning;
  }
  
  return {
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.palette.grey[200],
    '& .MuiLinearProgress-bar': {
      backgroundColor: color.main,
    }
  };
});

/**
 * Visual sentiment indicator with color coding and animated transitions
 */
const SentimentIndicator = ({
  sentiment = 'neutral',
  score = null,
  size = 'medium',
  showIcon = true,
  showLabel = true,
  showScore = false,
  showProgressBar = false,
  tooltipPlacement = 'top',
  animate = true,
  className,
  style
}) => {
  // Normalize sentiment (in case it's a string with different casing or a number)
  const normalizeSentiment = () => {
    if (typeof sentiment === 'number') {
      if (sentiment > 0.2) return 'positive';
      if (sentiment < -0.2) return 'negative';
      return 'neutral';
    }
    
    const sentimentLower = String(sentiment).toLowerCase();
    if (['positive', 'good', 'excellent', 'great'].includes(sentimentLower)) {
      return 'positive';
    } else if (['negative', 'bad', 'poor', 'terrible'].includes(sentimentLower)) {
      return 'negative';
    }
    return 'neutral';
  };
  
  const normalizedSentiment = normalizeSentiment();
  
  // Determine progress value for progress bar
  const getProgressValue = () => {
    if (score !== null) {
      // Convert from -1 to 1 range to 0 to 100
      return (score + 1) * 50;
    }
    
    // Default values when score is not provided
    if (normalizedSentiment === 'positive') return 75;
    if (normalizedSentiment === 'negative') return 25;
    return 50;
  };
  
  // Format score for display
  const getFormattedScore = () => {
    if (score === null) return null;
    // Convert from -1 to 1 range to 0 to 100 and round
    return `${Math.round((score + 1) * 50)}%`;
  };
  
  // Get the appropriate icon
  const getIcon = () => {
    const iconProps = { fontSize: size === 'small' ? 'small' : 'inherit' };
    
    switch (normalizedSentiment) {
      case 'positive':
        return <PositiveIcon {...iconProps} />;
      case 'negative':
        return <NegativeIcon {...iconProps} />;
      default:
        return <NeutralIcon {...iconProps} />;
    }
  };
  
  // Get label text
  const getLabelText = () => {
    const scoreText = getFormattedScore();
    if (showLabel && showScore && scoreText) {
      return `${normalizedSentiment} (${scoreText})`;
    } else if (showLabel) {
      return normalizedSentiment;
    } else if (showScore && scoreText) {
      return scoreText;
    }
    return null;
  };
  
  // Get size-specific styles
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          padding: '0px 6px',
          fontSize: '0.7rem',
          gap: 0.5
        };
      case 'large':
        return {
          padding: '4px 12px',
          fontSize: '0.875rem',
          gap: 1
        };
      case 'medium':
      default:
        return {
          padding: '2px 8px',
          fontSize: '0.75rem',
          gap: 0.75
        };
    }
  };
  
  // Get tooltip text
  const getTooltipText = () => {
    const scoreText = getFormattedScore();
    switch (normalizedSentiment) {
      case 'positive':
        return scoreText ? `Positive sentiment (${scoreText})` : 'Positive sentiment';
      case 'negative':
        return scoreText ? `Negative sentiment (${scoreText})` : 'Negative sentiment';
      default:
        return scoreText ? `Neutral sentiment (${scoreText})` : 'Neutral sentiment';
    }
  };
  
  // Apply animation props conditionally
  const animationProps = animate ? {
    sx: {
      animation: 'fadeIn 0.3s ease-in-out',
      '@keyframes fadeIn': {
        '0%': {
          opacity: 0,
          transform: 'scale(0.9)',
        },
        '100%': {
          opacity: 1,
          transform: 'scale(1)',
        },
      },
    }
  } : {};
  
  const sizeStyles = getSizeStyles();
  const indicator = (
    <Box
      className={className}
      style={style}
      {...animationProps}
    >
      <StyledSentimentBadge
        sentiment={normalizedSentiment}
        sx={{ 
          ...sizeStyles,
          display: 'inline-flex',
          alignItems: 'center', 
          gap: sizeStyles.gap
        }}
      >
        {showIcon && getIcon()}
        {(showLabel || showScore) && (
          <Typography 
            component="span" 
            sx={{ 
              fontSize: 'inherit',
              textTransform: 'capitalize',
              lineHeight: 1
            }}
          >
            {getLabelText()}
          </Typography>
        )}
      </StyledSentimentBadge>
      
      {showProgressBar && (
        <Box sx={{ mt: 0.5, width: '100%' }}>
          <StyledProgressBar
            variant="determinate"
            value={getProgressValue()}
            sentiment={normalizedSentiment}
          />
        </Box>
      )}
    </Box>
  );
  
  // Wrap with tooltip if needed
  return (
    <Tooltip title={getTooltipText()} placement={tooltipPlacement}>
      {indicator}
    </Tooltip>
  );
};

SentimentIndicator.propTypes = {
  /** Sentiment value ('positive', 'neutral', 'negative') */
  sentiment: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number
  ]),
  
  /** Sentiment score (-1 to 1) */
  score: PropTypes.number,
  
  /** Size of the indicator */
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  
  /** Whether to show the sentiment icon */
  showIcon: PropTypes.bool,
  
  /** Whether to show the sentiment label */
  showLabel: PropTypes.bool,
  
  /** Whether to show the sentiment score */
  showScore: PropTypes.bool,
  
  /** Whether to show a progress bar */
  showProgressBar: PropTypes.bool,
  
  /** Tooltip placement */
  tooltipPlacement: PropTypes.oneOf([
    'top', 'bottom', 'left', 'right',
    'top-start', 'top-end', 'bottom-start', 'bottom-end',
    'left-start', 'left-end', 'right-start', 'right-end'
  ]),
  
  /** Whether to animate the indicator when it appears */
  animate: PropTypes.bool,
  
  /** Additional CSS class */
  className: PropTypes.string,
  
  /** Inline style object */
  style: PropTypes.object
};

export default SentimentIndicator;
