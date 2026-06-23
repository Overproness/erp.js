import React from 'react';
import PropTypes from 'prop-types';
import { Rate } from '@/components/ui';
import { StarFilled, StarOutlined } from '@/components/icons';
import './ReviewStarRating.css';

const ReviewStarRating = ({ 
  value,
  onChange,
  readOnly = true,
  size = 'default',
  showValue = true,
  maxValue = 5,
  allowHalf = true,
  color = '#FFCA28'
}) => {
  const renderValue = () => {
    if (!showValue) return null;
    
    return (
      <span className="review-star-value" style={{ fontSize: size === 'large' ? '18px' : size === 'small' ? '12px' : '14px' }}>
        {value || 0}
      </span>
    );
  };
  
  return (
    <div className="review-star-rating">
      <Rate
        value={value}
        onChange={onChange}
        disabled={readOnly}
        allowHalf={allowHalf}
        count={maxValue}
        character={<StarFilled style={{ color }} />}
        className={`review-stars review-stars-${size}`}
      />
      {renderValue()}
    </div>
  );
};

ReviewStarRating.propTypes = {
  /** The rating value */
  value: PropTypes.number,
  
  /** Callback when rating changes */
  onChange: PropTypes.func,
  
  /** Whether the rating is read-only */
  readOnly: PropTypes.bool,
  
  /** Size of the stars: small, default, or large */
  size: PropTypes.oneOf(['small', 'default', 'large']),
  
  /** Whether to show the numeric value */
  showValue: PropTypes.bool,
  
  /** Maximum rating value */
  maxValue: PropTypes.number,
  
  /** Whether to allow half-star ratings */
  allowHalf: PropTypes.bool,
  
  /** Color of the filled stars */
  color: PropTypes.string
};

export default ReviewStarRating;