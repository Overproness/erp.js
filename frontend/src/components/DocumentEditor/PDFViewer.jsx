import {
  FontColorsOutlined,
  HighlightOutlined,
  LeftOutlined,
  RightOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from '@ant-design/icons';
import { Button, message, Space, Spin, Tooltip } from 'antd';
import { useEffect, useRef, useState } from 'react';

// Check if we need to load the PDF.js worker
const pdfjsLib = window.pdfjsLib;
if (!pdfjsLib) {
  // If PDF.js is not loaded, load it from CDN
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.min.js';
  script.async = true;
  document.head.appendChild(script);

  // Also load the worker
  const workerScript = document.createElement('script');
  workerScript.src = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.worker.min.js';
  workerScript.async = true;
  document.head.appendChild(workerScript);
}

const PDFViewer = ({ pdfBase64, onAnnotationsChange }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [pdf, setPdf] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const [annotations, setAnnotations] = useState([]);
  const [activeAnnotation, setActiveAnnotation] = useState(null);
  const [annotationMode, setAnnotationMode] = useState(null); // 'highlight', 'text', 'note'
  const [annotationColor, setAnnotationColor] = useState('#ffff00'); // Default yellow

  // Initialize PDF
  useEffect(() => {
    if (!pdfBase64 || !window.pdfjsLib) return;

    const loadPDF = async () => {
      try {
        setLoading(true);

        // Configure PDF.js worker
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.worker.min.js';

        // Load the PDF
        const loadingTask = window.pdfjsLib.getDocument({
          data: atob(pdfBase64.replace(/^data:application\/pdf;base64,/, '')),
        });

        const pdfDoc = await loadingTask.promise;
        setPdf(pdfDoc);
        setNumPages(pdfDoc.numPages);
        setCurrentPage(1);
        setLoading(false);
      } catch (error) {
        console.error('Error loading PDF:', error);
        message.error('Failed to load PDF document');
        setLoading(false);
      }
    };

    loadPDF();
  }, [pdfBase64]);

  // Render PDF page
  useEffect(() => {
    if (!pdf || !canvasRef.current) return;

    const renderPage = async () => {
      try {
        const page = await pdf.getPage(currentPage);
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport,
        };

        await page.render(renderContext).promise;

        // Draw annotations for the current page
        drawAnnotations(context, viewport);
      } catch (error) {
        console.error('Error rendering PDF page:', error);
        message.error('Failed to render PDF page');
      }
    };

    renderPage();
  }, [pdf, currentPage, scale, annotations]);

  // Drawing annotations on canvas
  const drawAnnotations = (context, viewport) => {
    const pageAnnotations = annotations.filter((anno) => anno.page === currentPage);

    pageAnnotations.forEach((annotation) => {
      context.save();

      switch (annotation.type) {
        case 'highlight':
          context.globalAlpha = 0.3;
          context.fillStyle = annotation.color || '#ffff00';
          context.fillRect(
            annotation.x * viewport.width,
            annotation.y * viewport.height,
            annotation.width * viewport.width,
            annotation.height * viewport.height
          );
          break;
        case 'text':
          context.font = '16px Arial';
          context.fillStyle = annotation.color || '#000000';
          context.fillText(
            annotation.text,
            annotation.x * viewport.width,
            annotation.y * viewport.height
          );
          break;
        // Additional annotation types can be added here
      }

      context.restore();
    });
  };

  // Handle canvas interaction for annotations
  const handleCanvasClick = (e) => {
    if (!annotationMode || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / canvas.width;
    const y = (e.clientY - rect.top) / canvas.height;

    if (annotationMode === 'highlight') {
      // Simple implementation - creates a fixed-size highlight
      const newAnnotation = {
        id: Date.now(),
        type: 'highlight',
        page: currentPage,
        x: x - 0.05, // Offset to center the highlight around the click
        y: y - 0.05,
        width: 0.1,
        height: 0.1,
        color: annotationColor,
      };

      const updatedAnnotations = [...annotations, newAnnotation];
      setAnnotations(updatedAnnotations);
      if (onAnnotationsChange) {
        onAnnotationsChange(updatedAnnotations);
      }
    } else if (annotationMode === 'text') {
      const text = prompt('Enter text:');
      if (text) {
        const newAnnotation = {
          id: Date.now(),
          type: 'text',
          page: currentPage,
          x: x,
          y: y,
          text: text,
          color: annotationColor,
        };

        const updatedAnnotations = [...annotations, newAnnotation];
        setAnnotations(updatedAnnotations);
        if (onAnnotationsChange) {
          onAnnotationsChange(updatedAnnotations);
        }
      }
    }
  };

  // Navigation functions
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < numPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Zoom functions
  const zoomIn = () => {
    setScale((prevScale) => Math.min(prevScale + 0.2, 3));
  };

  const zoomOut = () => {
    setScale((prevScale) => Math.max(prevScale - 0.2, 0.5));
  };

  return (
    <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" tip="Loading PDF..." />
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
            <Space>
              <Button
                icon={<LeftOutlined />}
                onClick={goToPreviousPage}
                disabled={currentPage <= 1}
              >
                Previous
              </Button>
              <Button
                icon={<RightOutlined />}
                onClick={goToNextPage}
                disabled={currentPage >= numPages}
              >
                Next
              </Button>
              <span>
                Page {currentPage} of {numPages}
              </span>
            </Space>

            <Space>
              <Tooltip title="Zoom Out">
                <Button icon={<ZoomOutOutlined />} onClick={zoomOut} />
              </Tooltip>
              <span>{Math.round(scale * 100)}%</span>
              <Tooltip title="Zoom In">
                <Button icon={<ZoomInOutlined />} onClick={zoomIn} />
              </Tooltip>

              <Tooltip title="Highlight">
                <Button
                  icon={<HighlightOutlined />}
                  type={annotationMode === 'highlight' ? 'primary' : 'default'}
                  onClick={() =>
                    setAnnotationMode(annotationMode === 'highlight' ? null : 'highlight')
                  }
                />
              </Tooltip>

              <Tooltip title="Add Text">
                <Button
                  icon={<FontColorsOutlined />}
                  type={annotationMode === 'text' ? 'primary' : 'default'}
                  onClick={() => setAnnotationMode(annotationMode === 'text' ? null : 'text')}
                />
              </Tooltip>

              {/* Color picker for annotations */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span>Color:</span>
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    backgroundColor: annotationColor,
                    marginLeft: '8px',
                    border: '1px solid #d9d9d9',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    const colors = ['#ffff00', '#ff0000', '#00ff00', '#0000ff', '#ff00ff'];
                    const currentIndex = colors.indexOf(annotationColor);
                    const nextIndex = (currentIndex + 1) % colors.length;
                    setAnnotationColor(colors[nextIndex]);
                  }}
                />
              </div>
            </Space>
          </div>

          <div
            style={{
              overflow: 'auto',
              maxHeight: '600px',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              textAlign: 'center',
            }}
          >
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              style={{ display: 'inline-block' }}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default PDFViewer;
