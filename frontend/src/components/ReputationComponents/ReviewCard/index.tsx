import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Card, CardContent, CardActions, Typography, Box, Avatar,
  Button, IconButton, Chip, Collapse, TextField, Tooltip,
  Divider, Menu, MenuItem
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Reply as ReplyIcon,
  MoreVert as MoreIcon,
  Flag as FlagIcon,
  CheckCircle as VerifiedIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Share as ShareIcon,
  Archive as ArchiveIcon
} from '@mui/icons-material';
import { formatDate } from '../../../utils/reputation/reviewUtils';
import ReviewStarRating from '../ReviewStarRating';
import SentimentIndicator from '../SentimentIndicator';

const StyledCard = styled(Card)(({ theme, sentiment }) => ({
  position: 'relative',
  borderLeft: '4px solid',
  borderLeftColor: sentiment === 'positive' 
    ? theme.palette.success.main 
    : sentiment === 'negative' 
      ? theme.palette.error.main 
      : theme.palette.warning.main,
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:hover': {
    boxShadow: theme.shadows[4],
    transform: 'translateY(-2px)'
  }
}));

const PlatformIcon = styled('img')({
  width: 20,
  height: 20,
  borderRadius: '50%',
  marginRight: 4
});

const SourceChip = styled(Chip)(({ theme }) => ({
  height: 22,
  '& .MuiChip-label': {
    fontSize: '0.7rem',
    padding: '0 8px'
  }
}));

/**
 * Individual review display card with rating stars, sentiment indicator, and response actions
 */
const ReviewCard = ({
  review,
  onReply,
  onDelete,
  onFlag,
  onShare,
  onEdit,
  onArchive,
  showActions = true,
  showResponse = true,
  expanded = false
}) => {
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [responseExpanded, setResponseExpanded] = useState(expanded);
  const [responseText, setResponseText] = useState('');
  
  const handleMenuOpen = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleActionClick = (action, event) => {
    handleMenuClose();
    switch (action) {
      case 'delete':
        if (onDelete) onDelete(review.id);
        break;
      case 'flag':
        if (onFlag) onFlag(review.id);
        break;
      case 'edit':
        if (onEdit) onEdit(review.id);
        break;
      case 'share':
        if (onShare) onShare(review.id);
        break;
      case 'archive':
        if (onArchive) onArchive(review.id);
        break;
      default:
        break;
    }
  };

  const handleReplySubmit = () => {
    if (onReply && responseText.trim()) {
      onReply(review.id, responseText.trim());
      setResponseText('');
      setResponseExpanded(false);
    }
  };

  const handleReplyCancel = () => {
    setResponseText('');
    setResponseExpanded(false);
  };

  const getPlatformIcon = (platform) => {
    const platformMap = {
      google: '/assets/icons/google.png',
      facebook: '/assets/icons/facebook.png',
      yelp: '/assets/icons/yelp.png',
      trustpilot: '/assets/icons/trustpilot.png',
      custom: '/assets/icons/custom.png',
    };
    
    return platformMap[platform.toLowerCase()] || platformMap.custom;
  };

  return (
    <StyledCard variant="outlined" sentiment={review.sentiment}>
      <CardContent>
        {/* Header with Rating, Date, and Source */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box>
            <ReviewStarRating 
              value={review.rating} 
              readOnly 
              size="small" 
              precision={1}
            />
            <Box sx={{ display: 'flex', mt: 0.5, alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                {formatDate(review.createdAt)}
              </Typography>
              {review.verified && (
                <Tooltip title="Verified Review">
                  <VerifiedIcon sx={{ fontSize: 14, ml: 1, color: 'success.main' }} />
                </Tooltip>
              )}
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SourceChip 
              size="small"
              variant="outlined"
              color="default"
              icon={<PlatformIcon src={getPlatformIcon(review.platform)} alt={review.platform} />}
              label={review.platform}
            />
            {showActions && (
              <IconButton 
                size="small" 
                onClick={handleMenuOpen}
                sx={{ ml: 0.5 }}
                aria-label="more actions"
              >
                <MoreIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Box>
        
        {/* Author Info */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
          <Avatar 
            alt={review.author || 'Anonymous'} 
            src={review.authorImage || ''} 
            sx={{ width: 32, height: 32, mr: 1.5 }}
          >
            {(review.author || 'A')[0].toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" sx={{ lineHeight: 1.2 }}>
              {review.author || 'Anonymous'}
            </Typography>
            {review.location && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {review.location}
              </Typography>
            )}
          </Box>
        </Box>
        
        {/* Review Content */}
        <Box sx={{ mb: 1.5 }}>
          {review.title && (
            <Typography variant="subtitle1" component="h3" gutterBottom sx={{ fontWeight: 500 }}>
              {review.title}
            </Typography>
          )}
          
          <Typography variant="body2" color="text.primary">
            {review.content}
          </Typography>
        </Box>
        
        {/* Sentiment and Tags */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
          <Box>
            <SentimentIndicator 
              sentiment={review.sentiment} 
              score={review.sentimentScore} 
              size="small" 
            />
          </Box>
          
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {review.tags?.map(tag => (
              <Chip 
                key={tag}
                label={tag} 
                size="small" 
                variant="outlined" 
                sx={{ height: 20, fontSize: '0.7rem' }}
              />
            ))}
          </Box>
        </Box>
      </CardContent>
      
      {/* Response Section */}
      {showResponse && (
        <>
          {review.responded ? (
            <Box sx={{ px: 2, py: 1.5, bgcolor: 'action.hover', borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                Response from {review.responseName || 'Management'}
              </Typography>
              <Typography variant="body2">
                {review.responseContent}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                {formatDate(review.responseDate)}
              </Typography>
            </Box>
          ) : (
            <CardActions sx={{ pt: 0, justifyContent: 'flex-end' }}>
              <Button
                size="small"
                startIcon={<ReplyIcon />}
                onClick={() => setResponseExpanded(!responseExpanded)}
              >
                Respond
              </Button>
            </CardActions>
          )}
        </>
      )}
      
      {/* Response Form */}
      <Collapse in={responseExpanded}>
        <Divider />
        <Box sx={{ p: 2 }}>
          <TextField
            label="Your response"
            multiline
            rows={3}
            fullWidth
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            placeholder="Write your response here..."
            variant="outlined"
            size="small"
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button 
              size="small" 
              onClick={handleReplyCancel}
            >
              Cancel
            </Button>
            <Button 
              size="small" 
              variant="contained"
              onClick={handleReplySubmit}
              disabled={!responseText.trim()}
            >
              Submit Response
            </Button>
          </Box>
        </Box>
      </Collapse>
      
      {/* Actions Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleActionClick('edit')}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          Edit
        </MenuItem>
        <MenuItem onClick={() => handleActionClick('share')}>
          <ListItemIcon>
            <ShareIcon fontSize="small" />
          </ListItemIcon>
          Share
        </MenuItem>
        <MenuItem onClick={() => handleActionClick('flag')}>
          <ListItemIcon>
            <FlagIcon fontSize="small" />
          </ListItemIcon>
          Flag
        </MenuItem>
        <MenuItem onClick={() => handleActionClick('archive')}>
          <ListItemIcon>
            <ArchiveIcon fontSize="small" />
          </ListItemIcon>
          Archive
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleActionClick('delete')}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <Typography color="error">Delete</Typography>
        </MenuItem>
      </Menu>
    </StyledCard>
  );
};

ReviewCard.propTypes = {
  /** Review data */
  review: PropTypes.shape({
    id: PropTypes.string.isRequired,
    author: PropTypes.string,
    authorImage: PropTypes.string,
    rating: PropTypes.number.isRequired,
    title: PropTypes.string,
    content: PropTypes.string.isRequired,
    createdAt: PropTypes.string.isRequired,
    platform: PropTypes.string.isRequired,
    sentiment: PropTypes.string,
    sentimentScore: PropTypes.number,
    responded: PropTypes.bool,
    responseName: PropTypes.string,
    responseContent: PropTypes.string,
    responseDate: PropTypes.string,
    verified: PropTypes.bool,
    location: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string)
  }).isRequired,
  
  /** Callback when replying to a review */
  onReply: PropTypes.func,
  
  /** Callback when deleting a review */
  onDelete: PropTypes.func,
  
  /** Callback when flagging a review */
  onFlag: PropTypes.func,
  
  /** Callback when sharing a review */
  onShare: PropTypes.func,
  
  /** Callback when editing a review */
  onEdit: PropTypes.func,
  
  /** Callback when archiving a review */
  onArchive: PropTypes.func,
  
  /** Whether to show action buttons */
  showActions: PropTypes.bool,
  
  /** Whether to show response section */
  showResponse: PropTypes.bool,
  
  /** Whether to expand response section by default */
  expanded: PropTypes.bool
};

export default ReviewCard;
