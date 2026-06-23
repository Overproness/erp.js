import useLanguage from '@/locale/useLanguage';
import CreateItem from '@/pages/ErpPanelModule/CreateItem';
import { selectCreatedItem } from '@/redux/erp/selectors'; // Changed from crud to erp
import { InboxOutlined } from '@/components/icons';
import { DatePicker, Form, Input, Select, Upload } from '@/components/ui';
import { useSelector } from 'react-redux';

const { Option } = Select;
const { TextArea } = Input;

export default function DocumentCreate() {
  const translate = useLanguage();
  const { isLoading, isSuccess } = useSelector(selectCreatedItem); // Changed from crud to erp selector

  const normFile = (e) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  // Document types
  const documentTypes = [
    'Invoice',
    'Contract',
    'Report',
    'Receipt',
    'Agreement',
    'Certificate',
    'Legal',
    'Financial',
    'Other',
  ];

  const CreateDocumentForm = ({ form }) => {
    return (
      <>
        <Form.Item
          name="title"
          label={translate('Title')}
          rules={[
            {
              required: true,
              message: translate('Please input the document title!'),
            },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="documentType"
          label={translate('Document Type')}
          rules={[
            {
              required: true,
              message: translate('Please select document type!'),
            },
          ]}
        >
          <Select placeholder={translate('Select document type')}>
            {documentTypes.map((type) => (
              <Option key={type} value={type}>
                {translate(type)}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="description" label={translate('Description')}>
          <TextArea rows={4} />
        </Form.Item>

        <Form.Item name="tags" label={translate('Tags')}>
          <Select
            mode="tags"
            placeholder={translate('Add tags')}
            tokenSeparators={[',']}
            style={{ width: '100%' }}
            notFoundContent={null}
          />
        </Form.Item>

        <Form.Item
          name="expiryDate"
          label={translate('Expiry Date')}
          // Remove required validation to make it optional
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="file"
          label={translate('Document File')}
          valuePropName="fileList"
          getValueFromEvent={normFile}
          rules={[
            {
              required: true,
              message: translate('Please upload a document file!'),
            },
          ]}
        >
          <Upload.Dragger
            name="file"
            beforeUpload={() => false}
            maxCount={1}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
          >
            <p className="upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="upload-text">
              {translate('Click or drag file to this area to upload')}
            </p>
            <p className="upload-hint">
              {translate('Support for PDF, Word, Excel, text and image files')}
            </p>
          </Upload.Dragger>
        </Form.Item>
      </>
    );
  };

  return (
    <CreateItem
      config={{
        entity: 'document',
        title: translate('New Document'),
      }}
      CreateForm={CreateDocumentForm}
    />
  );
}
