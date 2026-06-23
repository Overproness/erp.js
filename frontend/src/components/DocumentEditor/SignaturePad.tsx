import { CheckOutlined, ClearOutlined } from '@/components/icons';
import { Button, Divider, Typography } from '@/components/ui';
import { useEffect, useRef, useState } from 'react';

const SignaturePad = ({ onSignatureCapture }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState(null);

  useEffect(() => {
    // Initialize canvas
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Set canvas styles
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'black';

    // Clear canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    setContext(ctx);
  }, []);

  const startDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    context.beginPath();
    context.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;

    const { offsetX, offsetY } = nativeEvent;
    context.lineTo(offsetX, offsetY);
    context.stroke();
  };

  const endDrawing = () => {
    context.closePath();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const captureSignature = () => {
    // Convert canvas to base64 image
    const signatureData = canvasRef.current.toDataURL('image/png');
    onSignatureCapture(signatureData);
  };

  return (
    <div>
      <Typography.Title level={5}>Draw Your Signature</Typography.Title>
      <div style={{ border: '1px solid #d9d9d9', marginBottom: '10px' }}>
        <canvas
          ref={canvasRef}
          width={400}
          height={150}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          style={{ touchAction: 'none', cursor: 'crosshair' }}
        />
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <Button icon={<ClearOutlined />} onClick={clearCanvas}>
          Clear
        </Button>
        <Button type="primary" icon={<CheckOutlined />} onClick={captureSignature}>
          Use This Signature
        </Button>
      </div>
      <Divider />
      <Typography.Text type="secondary">
        Your signature will be captured as an image and applied to the document.
      </Typography.Text>
    </div>
  );
};

export default SignaturePad;
