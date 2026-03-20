import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Popover, Input, Space, Button } from 'antd';
import { 
  CheckOutlined, 
  CloseOutlined,
  BgColorsOutlined
} from '@ant-design/icons';

/**
 * A simple color picker component with preset colors and custom input
 */
const ColorPicker = ({ value = '#1890ff', onChange, presetColors = [] }) => {
  const [color, setColor] = useState(value || '#1890ff');
  const [open, setOpen] = useState(false);
  
  // Update internal state when value prop changes
  useEffect(() => {
    if (value !== color) {
      setColor(value);
    }
  }, [value]);
  
  // Default preset colors if none provided
  const defaultPresets = [
    '#1890ff', // Blue
    '#52c41a', // Green
    '#fa8c16', // Orange
    '#f5222d', // Red
    '#722ed1', // Purple
    '#13c2c2', // Cyan
    '#2f54eb', // Geekblue
    '#eb2f96', // Magenta
    '#faad14', // Gold
    '#fadb14', // Yellow
    '#a0d911', // Lime
    '#1d39c4', // Daybreak Blue
    '#531dab', // Dark Purple
    '#08979c', // Dark Cyan
    '#d4380d', // Volcano
    '#434343', // Dark Grey
    '#595959', // Grey
    '#8c8c8c', // Light Grey
    '#d9d9d9', // Lighter Grey
    '#f5f5f5', // Lightest Grey
    '#ffffff', // White
    '#000000'  // Black
  ];
  
  const availablePresets = presetColors.length > 0 ? presetColors : defaultPresets;
  
  // Handle color selection
  const handleColorChange = (e) => {
    const newColor = e.target.value;
    setColor(newColor);
    
    // Only trigger onChange if it's a valid color
    if (isValidColor(newColor) && onChange) {
      onChange(newColor);
    }
  };
  
  // Handle preset color selection
  const selectPresetColor = (presetColor) => {
    setColor(presetColor);
    if (onChange) {
      onChange(presetColor);
    }
    setOpen(false);
  };
  
  // Check if a color is valid
  const isValidColor = (colorValue) => {
    const style = new Option().style;
    style.color = colorValue;
    return style.color !== '';
  };
  
  const colorPickerContent = (
    <div style={{ width: 220 }}>
      <Input
        value={color}
        onChange={handleColorChange}
        addonBefore="#"
        style={{ marginBottom: 8 }}
      />
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
        {availablePresets.map((presetColor, index) => (
          <div
            key={index}
            onClick={() => selectPresetColor(presetColor)}
            style={{
              width: 24,
              height: 24,
              backgroundColor: presetColor,
              cursor: 'pointer',
              border: '1px solid #d9d9d9',
              borderRadius: 4,
              position: 'relative'
            }}
          >
            {color === presetColor && (
              <CheckOutlined
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: isLightColor(presetColor) ? '#000' : '#fff'
                }}
              />
            )}
          </div>
        ))}
      </div>
      
      <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
        <Space>
          <Button
            size="small"
            icon={<CloseOutlined />}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<CheckOutlined />}
            onClick={() => setOpen(false)}
          >
            OK
          </Button>
        </Space>
      </div>
    </div>
  );
  
  // Determine if a color is light or dark
  const isLightColor = (colorValue) => {
    // Extract RGB values
    let r, g, b;
    
    if (colorValue.startsWith('#')) {
      const hex = colorValue.substring(1);
      
      if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
      } else if (hex.length === 6) {
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
      } else {
        return true; // Default to light if invalid format
      }
    } else {
      return true; // Default to light for non-hex colors
    }
    
    // Calculate luminance using the YIQ formula
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return yiq >= 128; // >= 128 is light, < 128 is dark
  };
  
  return (
    <Popover
      content={colorPickerContent}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          cursor: 'pointer',
          border: '1px solid #d9d9d9',
          borderRadius: 2,
          padding: '4px 8px',
          height: 32
        }}
        onClick={() => setOpen(true)}
      >
        <div
          style={{
            width: 16,
            height: 16,
            backgroundColor: color,
            marginRight: 8,
            border: '1px solid #d9d9d9',
            borderRadius: 2
          }}
        />
        <span>{color}</span>
        <BgColorsOutlined style={{ marginLeft: 8 }} />
      </div>
    </Popover>
  );
};

ColorPicker.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  presetColors: PropTypes.array
};
export { ColorPicker };
export default ColorPicker;
