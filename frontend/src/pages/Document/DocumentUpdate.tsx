import DocumentAnalyzer from '@/components/AiAssist/DocumentAnalyzer';
import DocumentForm from '@/forms/DocumentForm';
import useLanguage from '@/locale/useLanguage';
import { erp } from '@/redux/erp/actions';
import { App, Button, Card, Form, Spin, Tabs } from '@/components/ui';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

export default function DocumentUpdate() {
  const { id } = useParams();
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const translate = useLanguage();
  const { isLoading, isSuccess, result: currentDocument } = useSelector((state) => state.erp.read);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('1');
  const { message } = App.useApp();

  // Check if we should show the AI analyzer (passed in location state)
  const showAiAnalyzer = location.state?.showAiAnalyzer || false;
  const loadedRef = useRef('');

  useEffect(() => {
    if (loadedRef.current === id) return;
    loadedRef.current = id;
    dispatch(erp.read({ entity: 'document', id }));
  }, [dispatch, id]);

  useEffect(() => {
    if (isSuccess && currentDocument) {
      form.setFieldsValue(currentDocument);

      // If showAiAnalyzer flag is true, switch to the AI tab
      if (showAiAnalyzer) {
        setActiveTab('2');
      }
    }
  }, [isSuccess, currentDocument, form, showAiAnalyzer]);

  const onFinish = (values) => {
    dispatch(erp.update({ entity: 'document', id, jsonData: values }));
    message.success('Document updated successfully');
    navigate('/document');
  };

  // Handler to apply AI suggestions to the form
  const handleApplySuggestions = (suggestions) => {
    const currentValues = form.getFieldsValue();

    // Merge current form values with AI suggestions
    const updatedValues = {
      ...currentValues,
      documentType: suggestions.documentType || currentValues.documentType,
      description: suggestions.description || currentValues.description,
      // For tags, we want to combine existing tags with AI suggestions but avoid duplicates
      tags: [...new Set([...(currentValues.tags || []), ...(suggestions.tags || [])])],
    };

    // Update form with new values
    form.setFieldsValue(updatedValues);

    // Switch back to the form tab
    setActiveTab('1');
  };

  if (isLoading) {
    return (
      <div
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}
      >
        <Spin size="large" />
      </div>
    );
  }

  // Use items prop for Tabs instead of TabPane children
  const tabItems = [
    {
      key: '1',
      label: translate('Document Metadata'),
      children: (
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <DocumentForm isUpdateForm={true} form={form} />
          <Form.Item>
            <Button type="primary" htmlType="submit">
              {translate('Update')}
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: '2',
      label: translate('AI Analysis'),
      children: (
        <DocumentAnalyzer
          documentId={id}
          onApplySuggestions={handleApplySuggestions}
          autoApply={showAiAnalyzer} // Auto-apply if we came from the AI button
        />
      ),
    },
  ];

  return (
    <Card title={translate('Update Document')}>
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
    </Card>
  );
}
