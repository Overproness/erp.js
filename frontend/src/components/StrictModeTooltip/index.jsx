import { useRef, useState } from 'react';

const StrictModeTooltip = ({ title, children, placement = 'top', mouseEnterDelay = 0.5 }) => {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef(null);
  const timeoutRef = useRef(null);

  const handleMouseEnter = (e) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      const rect = e.currentTarget.getBoundingClientRect();
      let top, left;

      switch (placement) {
        case 'top':
          top = rect.top - 35;
          left = rect.left + rect.width / 2;
          break;
        case 'bottom':
          top = rect.bottom + 5;
          left = rect.left + rect.width / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2;
          left = rect.left - 10;
          break;
        case 'right':
          top = rect.top + rect.height / 2;
          left = rect.right + 10;
          break;
        default:
          top = rect.top - 35;
          left = rect.left + rect.width / 2;
      }

      setPosition({ top, left });
      setVisible(true);
    }, mouseEnterDelay * 1000);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setVisible(false);
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ display: 'inline-block' }}
    >
      {children}
      {visible && (
        <div
          style={{
            position: 'fixed',
            top: position.top,
            left: position.left,
            transform:
              placement === 'left'
                ? 'translate(-100%, -50%)'
                : placement === 'right'
                  ? 'translate(0, -50%)'
                  : 'translate(-50%, 0)',
            backgroundColor: '#1f2937',
            color: 'white',
            padding: '6px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            zIndex: 1060,
            pointerEvents: 'none',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          }}
        >
          {title}
        </div>
      )}
    </div>
  );
};

export default StrictModeTooltip;
