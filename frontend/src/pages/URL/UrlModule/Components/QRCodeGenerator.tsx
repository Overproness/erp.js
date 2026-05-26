import React, { useState, useEffect, useRef } from 'react';
import { 
  Modal, 
  Button, 
  Select, 
  Row, 
  Col, 
  Space,
  Typography,
  Card,
  message,
  Slider
} from '@/components/ui';
import {
  DownloadOutlined,
  CopyOutlined,
  QrcodeOutlined
} from '@ant-design/icons';
import QRCode from 'qrcode';
import useLanguage from '@/locale/useLanguage';

const { Option } = Select;
const { Title, Text } = Typography;

const QRCodeGenerator = ({ 
  visible, 
  url, 
  onClose,
  title = null 
}) => {
  const translate = useLanguage();
  const canvasRef = useRef(null);
  const [qrOptions, setQrOptions] = useState({
    size: 200,
    margin: 4,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    errorCorrectionLevel: 'M'
  });
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (visible && url) {
      generateQRCode();
    }
  }, [visible, url, qrOptions]);

  const generateQRCode = async () => {
    if (!url || !canvasRef.current) return;

    try {
      setIsGenerating(true);
      await QRCode.toCanvas(canvasRef.current, url, {
        width: qrOptions.size,
        margin: qrOptions.margin,
        color: qrOptions.color,
        errorCorrectionLevel: qrOptions.errorCorrectionLevel
      });
    } catch (error) {
      console.error('QR Code generation failed:', error);
      message.error(translate('Failed to generate QR code'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (format = 'png') => {
    if (!canvasRef.current) return;

    try {
      const canvas = canvasRef.current;
      const link = document.createElement('a');
      link.download = `qr-code-${Date.now()}.${format}`;
      
      if (format === 'svg') {
        // For SVG, we'd need a different approach
        message.info(translate('SVG export not yet supported. Using PNG instead.'));
        link.href = canvas.toDataURL('image/png');
      } else {
        const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
        link.href = canvas.toDataURL(mimeType);
      }
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      message.success(translate('QR code downloaded successfully'));
    } catch (error) {
      console.error('Download failed:', error);
      message.error(translate('Failed to download QR code'));
    }
  };

  const handleCopyImage = async () => {
    if (!canvasRef.current) return;

    try {
      const canvas = canvasRef.current;
      canvas.toBlob(async (blob) => {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          message.success(translate('QR code copied to clipboard'));
        } catch (error) {
          console.error('Copy failed:', error);
          message.error(translate('Failed to copy QR code'));
        }
      });
    } catch (error) {
      console.error('Copy operation failed:', error);
      message.error(translate('Failed to copy QR code'));
    }
  };

  const updateOption = (key, value) => {
    setQrOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateColorOption = (colorType, value) => {
    setQrOptions(prev => ({
      ...prev,
      color: {
        ...prev.color,
        [colorType]: value
      }
    }));
  };

  return (
    <Modal
      title={
        <Space>
          <QrcodeOutlined />
          {title || translate('QR Code Generator')}
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={600}
      footer={[
        <Button key="close" onClick={onClose}>
          {translate('Close')}
        </Button>,
        <Button
          key="copy"
          icon={<CopyOutlined />}
          onClick={handleCopyImage}
          disabled={isGenerating}
        >
          {translate('Copy')}
        </Button>,
        <Button
          key="download"
          type="primary"
          icon={<DownloadOutlined />}
          onClick={() => handleDownload('png')}
          disabled={isGenerating}
        >
          {translate('Download PNG')}
        </Button>
      ]}
    >
      <div style={{ minHeight: '400px' }}>
        <Row gutter={24}>
          {/* QR Code Preview */}
          <Col xs={24} md={12}>
            <Card title={translate('Preview')} size="small">
              <div style={{ 
                textAlign: 'center', 
                padding: '20px',
                background: '#f8f9fa',
                borderRadius: '8px'
              }}>
                <canvas
                  ref={canvasRef}
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                    border: '1px solid #e5e7eb'
                  }}
                />
                {isGenerating && (
                  <div style={{ marginTop: '10px' }}>
                    <Text type="secondary">{translate('Generating...')}</Text>
                  </div>
                )}
              </div>
            </Card>
          </Col>

          {/* Options */}
          <Col xs={24} md={12}>
            <Card title={translate('Options')} size="small">
              <div style={{ marginBottom: '16px' }}>
                <Text strong>{translate('Size')}</Text>
                <Slider
                  min={100}
                  max={500}
                  value={qrOptions.size}
                  onChange={(value) => updateOption('size', value)}
                  marks={{
                    100: '100px',
                    200: '200px',
                    300: '300px',
                    400: '400px',
                    500: '500px'
                  }}
                  style={{ marginTop: '8px' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <Text strong>{translate('Margin')}</Text>
                <Slider
                  min={0}
                  max={10}
                  value={qrOptions.margin}
                  onChange={(value) => updateOption('margin', value)}
                  marks={{
                    0: '0',
                    4: '4',
                    8: '8'
                  }}
                  style={{ marginTop: '8px' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <Text strong>{translate('Error Correction')}</Text>
                <Select
                  value={qrOptions.errorCorrectionLevel}
                  onChange={(value) => updateOption('errorCorrectionLevel', value)}
                  style={{ width: '100%', marginTop: '8px' }}
                >
                  <Option value="L">{translate('Low (7%)')}</Option>
                  <Option value="M">{translate('Medium (15%)')}</Option>
                  <Option value="Q">{translate('Quartile (25%)')}</Option>
                  <Option value="H">{translate('High (30%)')}</Option>
                </Select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <Text strong>{translate('Foreground Color')}</Text>
                <input
                  type="color"
                  value={qrOptions.color.dark}
                  onChange={(e) => updateColorOption('dark', e.target.value)}
                  style={{
                    width: '100%',
                    height: '32px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '6px',
                    marginTop: '8px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <Text strong>{translate('Background Color')}</Text>
                <input
                  type="color"
                  value={qrOptions.color.light}
                  onChange={(e) => updateColorOption('light', e.target.value)}
                  style={{
                    width: '100%',
                    height: '32px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '6px',
                    marginTop: '8px'
                  }}
                />
              </div>
            </Card>
          </Col>
        </Row>

        {/* URL Info */}
        {url && (
          <Card 
            title={translate('QR Code will link to')} 
            size="small" 
            style={{ marginTop: '16px' }}
          >
            <Text code copyable style={{ fontSize: '12px', wordBreak: 'break-all' }}>
              {url}
            </Text>
          </Card>
        )}

        {/* Download Options */}
        <Card 
          title={translate('Download Options')} 
          size="small" 
          style={{ marginTop: '16px' }}
        >
          <Space>
            <Button
              onClick={() => handleDownload('png')}
              disabled={isGenerating}
            >
              {translate('PNG')}
            </Button>
            <Button
              onClick={() => handleDownload('jpg')}
              disabled={isGenerating}
            >
              {translate('JPG')}
            </Button>
          </Space>
        </Card>
      </div>
    </Modal>
  );
};

export default QRCodeGenerator;
