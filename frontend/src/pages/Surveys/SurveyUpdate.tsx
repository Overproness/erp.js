import SurveyForm from '@/forms/SurveyForm';
import apolloClient from '@/graphql/client';
import { GET_SURVEY, UPDATE_SURVEY } from '@/graphql/operations/survey';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Card, message, Spin, Typography } from '@/components/ui';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const { Title } = Typography;

export default function SurveyUpdate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [survey, setSurvey] = useState(null);

  useEffect(() => {
    loadSurvey();
  }, [id]);

  const loadSurvey = async () => {
    try {
      setLoading(true);
      const { data } = await apolloClient.query({ query: GET_SURVEY, variables: { id } });
      if (data.surveyRead?.success) {
        setSurvey(data.surveyRead.result);
      } else {
        message.error('Failed to load survey');
        navigate('/survey');
      }
    } catch (error) {
      message.error('Failed to load survey');
      navigate('/survey');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (surveyData) => {
    try {
      await apolloClient.mutate({ mutation: UPDATE_SURVEY, variables: { id, input: surveyData } });
      message.success('Survey updated successfully');
      navigate(`/survey/${id}`);
    } catch (error) {
      message.error('Failed to update survey');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <a
          onClick={() => navigate(`/survey/${id}`)}
          style={{ marginBottom: 16, display: 'inline-block' }}
        >
          <ArrowLeftOutlined /> Back to Survey
        </a>
        <Title level={2}>Edit Survey</Title>
      </div>

      <Card>
        <SurveyForm current={survey} onSubmit={handleSubmit} isUpdate={true} />
      </Card>
    </div>
  );
}
