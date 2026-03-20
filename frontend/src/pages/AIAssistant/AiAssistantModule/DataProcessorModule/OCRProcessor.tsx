import React, { useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { 
  Card, 
  Upload, 
  Button, 
  Progress, 
  Typography, 
  Space, 
  Row, 
  Col, 
  Alert, 
  List,
  Tag,
  Input,
  Select,
  message
} from 'antd';
import { 
  InboxOutlined, 
  ScanOutlined, 
  FileTextOutlined, 
  DownloadOutlined,
  EyeOutlined,
  CopyOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { processOCR, extractData } from '@/redux/ai/aiThunks';
import useLanguage from '@/locale/useLanguage';

const { Dragger } = Upload;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const OCRProcessor = () => {
  const dispatch = useDispatch();
  const translate = useLanguage();
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [processingMode, setProcessingMode] = useState('automatic');
  
  const uploadProps = {
    name: 'file',
    multiple: true,
    accept: '.pdf,.jpg,.jpeg,.png,.tiff,.bmp',
    beforeUpload: (file) => {
      const isValidType = ['image/jpeg', 'image/png', 'image/tiff', 'image/bmp', 'application/pdf'].includes(file.type);
      const isValidSize = file.size / 1024 / 1024 < 50; // 50MB limit
      
      if (!isValidType) {
        message.error(translate('Invalid file type. Please upload images or PDF files.'));
        return false;
      }
      
      if (!isValidSize) {
        message.error(translate('File size must be less than 50MB'));
        return false;
      }
      
      const newFile = {
        id: Date.now() + Math.random(),
        file,
        name: file.name,
        size: file.size,
        status: 'pending',
        progress: 0,
        extractedText: '',
        confidence: 0,
        metadata: {}
      };
      
      setFiles(prev => [...prev, newFile]);
      return false;
    },
    onDrop(e) {
      console.log('Dropped files', e.dataTransfer.files);
    },
  };

  const handleProcessFiles = async () => {
    if (files.length === 0) {
      message.warning(translate('Please upload files first'));
      return;
    }

    setProcessing(true);
    
    for (const fileItem of files) {
      try {
        // Update file status to processing
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id ? { ...f, status: 'processing' } : f
        ));

        // Simulate OCR processing with progress
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 200));
          setFiles(prev => prev.map(f => 
            f.id === fileItem.id ? { ...f, progress } : f
          ));
        }

        // Mock OCR result
        const mockResult = {
          extractedText: generateMockText(fileItem.name),
          confidence: Math.random() * 20 + 80, // 80-100% confidence
          metadata: {
            language: selectedLanguage,
            pageCount: Math.floor(Math.random() * 5) + 1,
            processingTime: Math.floor(Math.random() * 5000) + 1000,
            dataPoints: Math.floor(Math.random() * 50) + 10
          }
        };

        // Update file with results
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id 
            ? { 
                ...f, 
                status: 'completed',
                extractedText: mockResult.extractedText,
                confidence: mockResult.confidence,
                metadata: mockResult.metadata
              } 
            : f
        ));

        setResults(prev => [...prev, { 
          ...fileItem, 
          ...mockResult,
          processedAt: new Date().toISOString()
        }]);

      } catch (error) {
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id ? { ...f, status: 'error', error: error.message } : f
        ));
        message.error(`Failed to process ${fileItem.name}: ${error.message}`);
      }
    }
    
    setProcessing(false);
    message.success(translate('OCR processing completed'));
  };

  const generateMockText = (filename) => {
    const mockTexts = {
      'invoice': `INVOICE #INV-2024-001
Date: January 15, 2024
Bill To: ABC Corporation
123 Business St, City, State 12345

Items:
- Product A: $299.99
- Product B: $149.50
- Service Fee: $50.00

Subtotal: $499.49
Tax (8.5%): $42.46
Total: $541.95

Payment Terms: Net 30`,
      'receipt': `RECEIPT
Store: TechMart Electronics
Date: 2024-01-15 14:30:22
Transaction ID: TXN-789456

Items:
1x Laptop Computer - $899.99
2x USB Cable - $19.98
1x Mouse - $29.99

Subtotal: $949.96
Tax: $76.00
Total: $1,025.96

Payment: Credit Card ****1234
Thank you for your purchase!`,
      'contract': `SERVICE AGREEMENT
Agreement Date: January 15, 2024
Parties: Company A and Company B

Terms:
- Service Period: 12 months
- Monthly Fee: $2,500
- Support Level: Premium
- Response Time: 4 hours

This agreement is effective from the date signed by both parties.`,
    };

    const type = filename.toLowerCase().includes('invoice') ? 'invoice' :
                 filename.toLowerCase().includes('receipt') ? 'receipt' : 'contract';
    
    return mockTexts[type];
  };

  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
    message.success(translate('Text copied to clipboard'));
  };

  const handleExportResults = (fileItem) => {
    const data = {
      filename: fileItem.name,
      extractedText: fileItem.extractedText,
      confidence: fileItem.confidence,
      metadata: fileItem.metadata,
      processedAt: fileItem.processedAt
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ocr_result_${fileItem.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    setResults(prev => prev.filter(r => r.id !== fileId));
  };

  return (
    <div>
      <Alert
        message={translate('OCR Document Processing')}
        description={translate('Upload documents to extract text and data using advanced OCR technology. Supports PDF, images, and various document formats.')}
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Row gutter={[16, 16]}>
        <Col span={12}>
          {/* Upload Section */}
          <Card title={<><InboxOutlined /> {translate('Upload Documents')}</>}>
            <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Select
                    value={selectedLanguage}
                    onChange={setSelectedLanguage}
                    style={{ width: '100%' }}
                    placeholder={translate('Select Language')}
                  >
                    <Select.Option value="en">English</Select.Option>
                    <Select.Option value="es">Spanish</Select.Option>
                    <Select.Option value="fr">French</Select.Option>
                    <Select.Option value="de">German</Select.Option>
                    <Select.Option value="ar">Arabic</Select.Option>
                  </Select>
                </Col>
                <Col span={12}>
                  <Select
                    value={processingMode}
                    onChange={setProcessingMode}
                    style={{ width: '100%' }}
                    placeholder={translate('Processing Mode')}
                  >
                    <Select.Option value="automatic">Automatic</Select.Option>
                    <Select.Option value="enhanced">Enhanced Accuracy</Select.Option>
                    <Select.Option value="fast">Fast Processing</Select.Option>
                  </Select>
                </Col>
              </Row>
            </Space>

            <Dragger {...uploadProps} style={{ marginBottom: 16 }}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">
                {translate('Click or drag files to this area to upload')}
              </p>
              <p className="ant-upload-hint">
                {translate('Support for PDF, JPG, PNG, TIFF files. Maximum file size: 50MB')}
              </p>
            </Dragger>

            <Button 
              type="primary" 
              icon={<ScanOutlined />}
              onClick={handleProcessFiles}
              loading={processing}
              disabled={files.length === 0}
              block
            >
              {processing ? translate('Processing...') : translate('Start OCR Processing')}
            </Button>
          </Card>
        </Col>

        <Col span={12}>
          {/* File Queue */}
          <Card title={<><FileTextOutlined /> {translate('Processing Queue')}</>}>
            {files.length === 0 ? (
              <Text type="secondary">{translate('No files uploaded yet')}</Text>
            ) : (
              <List
                dataSource={files}
                renderItem={(fileItem) => (
                  <List.Item
                    actions={[
                      <Button 
                        key="remove" 
                        type="text" 
                        onClick={() => removeFile(fileItem.id)}
                        disabled={processing}
                      >
                        {translate('Remove')}
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      title={fileItem.name}
                      description={
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <div>
                            <Tag color={
                              fileItem.status === 'completed' ? 'green' :
                              fileItem.status === 'processing' ? 'blue' :
                              fileItem.status === 'error' ? 'red' : 'default'
                            }>
                              {translate(fileItem.status)}
                            </Tag>
                            {fileItem.confidence && (
                              <Tag color="orange">
                                {Math.round(fileItem.confidence)}% {translate('confidence')}
                              </Tag>
                            )}
                          </div>
                          {fileItem.status === 'processing' && (
                            <Progress percent={fileItem.progress} size="small" />
                          )}
                          {fileItem.error && (
                            <Text type="danger">{fileItem.error}</Text>
                          )}
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Results Section */}
      {results.length > 0 && (
        <Card 
          title={<><CheckCircleOutlined /> {translate('Extraction Results')}</>}
          style={{ marginTop: 16 }}
        >
          <List
            dataSource={results}
            renderItem={(result) => (
              <List.Item
                actions={[
                  <Button 
                    key="copy"
                    icon={<CopyOutlined />}
                    onClick={() => handleCopyText(result.extractedText)}
                  >
                    {translate('Copy')}
                  </Button>,
                  <Button 
                    key="export"
                    icon={<DownloadOutlined />}
                    onClick={() => handleExportResults(result)}
                  >
                    {translate('Export')}
                  </Button>
                ]}
              >
                <div style={{ width: '100%' }}>
                  <Title level={5}>{result.name}</Title>
                  <Space style={{ marginBottom: 12 }}>
                    <Tag color="green">{Math.round(result.confidence)}% Confidence</Tag>
                    <Tag color="blue">{result.metadata.language}</Tag>
                    <Tag color="orange">{result.metadata.dataPoints} Data Points</Tag>
                  </Space>
                  <TextArea 
                    value={result.extractedText}
                    rows={6}
                    readOnly
                    style={{ marginBottom: 8 }}
                  />
                  <Text type="secondary">
                    Processed: {new Date(result.processedAt).toLocaleString()} | 
                    Processing Time: {result.metadata.processingTime}ms
                  </Text>
                </div>
              </List.Item>
            )}
          />
        </Card>
      )}
    </div>
  );
};

export default OCRProcessor;
