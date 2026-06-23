import SurveyForm from '@/forms/SurveyForm';
import apolloClient from '@/graphql/client';
import { CREATE_SURVEY } from '@/graphql/operations/survey';
import { ArrowLeftOutlined } from '@/components/icons';
import { Card, Typography, message } from '@/components/ui';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

export default function SurveyCreate() {
  const navigate = useNavigate();

  const handleSubmit = async (surveyData) => {
    try {
      await apolloClient.mutate({ mutation: CREATE_SURVEY, variables: { input: surveyData } });
      message.success('Survey created successfully');
      navigate('/survey');
    } catch (error) {
      message.error('Failed to create survey');
      console.error(error);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <a
          onClick={() => navigate('/survey')}
          style={{ marginBottom: 16, display: 'inline-block' }}
        >
          <ArrowLeftOutlined /> Back to Surveys
        </a>
        <Title level={2}>Create New Survey</Title>
      </div>

      <Card>
        <SurveyForm onSubmit={handleSubmit} />
      </Card>
    </div>
  );
}
