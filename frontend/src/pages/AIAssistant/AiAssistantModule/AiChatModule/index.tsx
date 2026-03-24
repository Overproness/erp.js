import { ErpLayout } from '@/layout';
import { selectAssistantsList, selectAssistantsLoading } from '@/redux/ai/aiSelectors';
import { setCurrentAssistant } from '@/redux/ai/aiSlice';
import { fetchAssistants } from '@/redux/ai/aiThunks';
import { Col, Layout, Row, Spin } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import ChatInterface from './ChatInterface';
import ConversationHistory from './ConversationHistory';

const { Content } = Layout;

const AiChatModule = () => {
  const { assistantId } = useParams();
  const dispatch = useDispatch();
  const assistants = useSelector(selectAssistantsList);
  const isLoading = useSelector(selectAssistantsLoading);
  const [selectedAssistant, setSelectedAssistant] = useState(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    dispatch(fetchAssistants());
  }, [dispatch]);

  useEffect(() => {
    if (assistantId && assistants.length > 0) {
      const assistant = assistants.find((a) => a._id === assistantId);
      if (assistant) {
        setSelectedAssistant(assistant);
        dispatch(setCurrentAssistant(assistant));
      }
    } else if (assistants.length > 0 && !assistantId) {
      setSelectedAssistant(assistants[0]);
      dispatch(setCurrentAssistant(assistants[0]));
    }
  }, [assistantId, assistants, dispatch]);

  if (isLoading) {
    return (
      <ErpLayout>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '70vh',
          }}
        >
          <Spin size="large" />
        </div>
      </ErpLayout>
    );
  }

  return (
    <ErpLayout>
      <div
        style={{
          height: 'calc(100vh - 140px)',
          backgroundColor: '#f0f2f5',
          padding: '16px',
          overflow: 'hidden',
        }}
      >
        <Row gutter={16} style={{ height: '100%' }}>
          <Col span={6} style={{ height: '100%' }}>
            <div
              style={{
                height: '100%',
                backgroundColor: '#fff',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <ConversationHistory
                assistants={assistants}
                selectedAssistant={selectedAssistant}
                onSelectAssistant={setSelectedAssistant}
              />
            </div>
          </Col>
          <Col span={18} style={{ height: '100%' }}>
            <div
              style={{
                height: '100%',
                backgroundColor: '#fff',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <ChatInterface assistant={selectedAssistant} />
            </div>
          </Col>
        </Row>
      </div>
    </ErpLayout>
  );
};

export default AiChatModule;
