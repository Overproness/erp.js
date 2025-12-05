import { DislikeOutlined, LikeOutlined, MessageOutlined, StarOutlined } from '@ant-design/icons';
import { Button, Input, message, Modal, Rate, Space, Typography } from 'antd';
import { useState } from 'react';
import { recordAIFeedback } from '../../services/aiEnhancedService';

const { TextArea } = Input;
const { Text } = Typography;

/**
 * AI Feedback Component
 * Allows users to rate and provide feedback on AI responses
 */
export default function AIFeedback({ learningId, messageId, onFeedbackSubmitted }) {
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [wasHelpful, setWasHelpful] = useState(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleQuickFeedback = async (helpful) => {
    setWasHelpful(helpful);
    await submitFeedback({ wasHelpful: helpful, rating: helpful ? 5 : 2 });
  };

  const handleDetailedFeedback = () => {
    setFeedbackModalVisible(true);
  };

  const submitFeedback = async (feedbackData) => {
    if (!learningId) {
      message.warning('Cannot submit feedback: Learning ID not available');
      return;
    }

    setSubmitting(true);
    try {
      const response = await recordAIFeedback(learningId, {
        rating: feedbackData.rating || rating,
        wasHelpful: feedbackData.wasHelpful !== undefined ? feedbackData.wasHelpful : wasHelpful,
        userComment: feedbackData.userComment || comment,
      });

      if (response.success) {
        message.success('Thank you for your feedback!');
        setFeedbackModalVisible(false);
        if (onFeedbackSubmitted) {
          onFeedbackSubmitted(feedbackData);
        }
      } else {
        message.error('Failed to submit feedback');
      }
    } catch (error) {
      console.error('Submit feedback error:', error);
      message.error('Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitDetailedFeedback = async () => {
    if (rating === 0) {
      message.warning('Please provide a rating');
      return;
    }

    await submitFeedback({
      rating,
      wasHelpful: rating >= 3,
      userComment: comment,
    });
  };

  return (
    <>
      <Space size="small" style={{ marginTop: '8px' }}>
        <Button
          type="text"
          size="small"
          icon={<LikeOutlined />}
          onClick={() => handleQuickFeedback(true)}
          style={{ color: wasHelpful === true ? '#52c41a' : undefined }}
        />
        <Button
          type="text"
          size="small"
          icon={<DislikeOutlined />}
          onClick={() => handleQuickFeedback(false)}
          style={{ color: wasHelpful === false ? '#ff4d4f' : undefined }}
        />
        <Button
          type="text"
          size="small"
          icon={<MessageOutlined />}
          onClick={handleDetailedFeedback}
        >
          Feedback
        </Button>
      </Space>

      <Modal
        title={
          <Space>
            <StarOutlined style={{ color: '#faad14' }} />
            <span>Rate this Response</span>
          </Space>
        }
        open={feedbackModalVisible}
        onCancel={() => {
          setFeedbackModalVisible(false);
          setRating(0);
          setComment('');
        }}
        onOk={handleSubmitDetailedFeedback}
        confirmLoading={submitting}
        okText="Submit Feedback"
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div style={{ textAlign: 'center' }}>
            <Text>How would you rate this response?</Text>
            <div style={{ marginTop: '16px' }}>
              <Rate
                value={rating}
                onChange={setRating}
                style={{ fontSize: '32px' }}
                character={<StarOutlined />}
              />
            </div>
          </div>

          <div>
            <Text>Additional Comments (optional)</Text>
            <TextArea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us more about your experience..."
              rows={4}
              style={{ marginTop: '8px' }}
            />
          </div>
        </Space>
      </Modal>
    </>
  );
}
