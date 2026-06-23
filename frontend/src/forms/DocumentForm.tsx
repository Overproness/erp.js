import React, { useEffect, useState } from 'react';
import { Button, Form, Input, Select, Upload, message } from '@/components/ui';
import { InboxOutlined } from '@/components/icons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import useLanguage from '@/locale/useLanguage';
import { erp } from '@/redux/erp/actions'; // Changed from crud to erp
import { selectCreatedItem } from '@/redux/erp/selectors'; // Changed from crud to erp
import { formatSuggestedTags } from '@/utils/nlpUtils';

const { Option } = Select;

// Acceptable file types
const acceptableFileTypes = '.pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.jpg,.jpeg,.png,.md,.json,.html';

// Document type options
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

const DocumentForm = ({ isUpdateForm = false, form }) => {
  const translate = useLanguage();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isLoading, isSuccess, current } = useSelector(selectCreatedItem); // Changed from crud to erp selector
  const [fileList, setFileList] = useState([]);
  const [tags, setTags] = useState([]);
  const entity = 'document';

  const { Dragger } = Upload;
  const { TextArea } = Input;

  // Normalization function for tags
  const normalizeTags = (tags) => {
    if (!tags) return [];
    return formatSuggestedTags(Array.isArray(tags) ? tags : tags.split(','));
  };

  // File upload normalization
  const normFile = (e) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  useEffect(() => {
    if (isSuccess) {
      form.resetFields();
      setFileList([]);
      if (!isUpdateForm) {
        dispatch(erp.resetAction({ actionType: 'create' })); // Changed from crud to erp
      } else {
        dispatch(erp.resetAction({ actionType: 'update' })); // Changed from crud to erp
      }
    }
  }, [isSuccess]);

  // Load current data when in update mode
  useEffect(() => {
    if (isUpdateForm && current) {
      const { name, description, documentType, tags = [] } = current;

      form.setFieldsValue({
        name,
        description,
        documentType,
        tags,
      });

      setTags(tags);
    }
  }, [current, isUpdateForm]);

  // Initialize tags when component loads or is updated
  useEffect(() => {
    const formTags = form?.getFieldValue('tags');
    if (formTags && Array.isArray(formTags) && formTags.length > 0) {
      setTags(formTags.filter(Boolean));
    }
  }, [form]);

  const onFinish = (values) => {
    if (isUpdateForm) {
      const id = current._id;

      // For update we don't need to send the file again
      const updatedValues = {
        name: values.name,
        description: values.description,
        documentType: values.documentType,
        tags: values.tags,
      };

      dispatch(erp.update({ entity, id, jsonData: updatedValues })); // Changed from crud to erp
    } else {
      if (fileList.length === 0) {
        message.error('Please upload a document file');
        return;
      }

      // For create, we need to prepare form data with the file
      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('description', values.description || '');
      formData.append('documentType', values.documentType);
      if (values.tags && values.tags.length > 0) {
        values.tags.forEach((tag) => {
          formData.append('tags', tag);
        });
      }

      formData.append('file', fileList[0].originFileObj);

      dispatch(erp.create({ entity, jsonData: formData }));
    }
  };

  const uploadProps = {
    onRemove: () => {
      setFileList([]);
    },
    beforeUpload: (file) => {
      // Validate file size (max 50MB)
      const MAX_FILE_SIZE = 50 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        message.error(
          `File must be smaller than 50MB. Your file is ${(file.size / (1024 * 1024)).toFixed(
            2
          )}MB.`
        );
        return Upload.LIST_IGNORE;
      }

      setFileList([file]);
      return false; // Prevent auto upload
    },
    fileList,
    multiple: false,
  };

  const handleTagChange = (selectedTags) => {
    setTags(selectedTags);
    form.setFieldsValue({ tags: selectedTags });
  };

  return (
    // Changed from Form to div to prevent nested form issue
    <>
      {/* <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ documentType: 'Other' }}
      > */}
      <Form.Item
        name="name"
        label={translate('Document Name')}
        rules={[
          {
            required: true,
            message: translate('Please enter document name'),
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
            message: translate('Please select document type'),
          },
        ]}
      >
        <Select>
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
          style={{ width: '100%' }}
          placeholder={translate('Add tags')}
          onChange={handleTagChange}
        >
          {tags.map((tag) => (
            <Option key={tag}>{tag}</Option>
          ))}
        </Select>
      </Form.Item>

      {!isUpdateForm && (
        <Form.Item
          name="upload"
          label={translate('Upload Document')}
          rules={[
            {
              required: true,
              message: translate('Please upload a document'),
            },
          ]}
        >
          <Dragger {...uploadProps}>
            <p className="upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="upload-text">
              {translate('Click or drag file to this area to upload')}
            </p>
            <p className="upload-hint">
              {translate('Support for a single file upload. Max file size: 10MB.')}
            </p>
          </Dragger>
        </Form.Item>
      )}

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={isLoading} block>
          {isUpdateForm ? translate('Update') : translate('Upload')}
        </Button>
      </Form.Item>
      {/* </Form> */}
    </>
  );
};

export default DocumentForm;
