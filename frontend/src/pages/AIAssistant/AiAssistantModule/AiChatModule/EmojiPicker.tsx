import { SmileOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { useEffect, useRef, useState } from 'react';

const EmojiPicker = ({ onEmojiSelect, disabled }) => {
  const [visible, setVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('smileys');
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const panelRef = useRef(null);

  const emojiCategories = {
    smileys: {
      name: 'Smileys',
      emojis: [
        '😀',
        '😃',
        '😄',
        '😁',
        '😆',
        '😅',
        '🤣',
        '😂',
        '🙂',
        '🙃',
        '😉',
        '😊',
        '😇',
        '🥰',
        '😍',
        '🤩',
        '😘',
        '😗',
        '😚',
        '😙',
        '😋',
        '😛',
        '😜',
        '🤪',
        '😝',
        '🤑',
        '🤗',
        '🤭',
        '🤫',
        '🤔',
        '🤐',
        '🤨',
        '😐',
        '😑',
        '😶',
        '😏',
        '😒',
        '🙄',
        '😬',
        '🤥',
      ],
    },
    nature: {
      name: 'Animals',
      emojis: [
        '🐶',
        '🐱',
        '🐭',
        '🐹',
        '🐰',
        '🦊',
        '🐻',
        '🐼',
        '🐨',
        '🐯',
        '🦁',
        '🐮',
        '🐷',
        '🐽',
        '🐸',
        '🐵',
        '🙈',
        '🙉',
        '🙊',
        '🐒',
        '🐔',
        '🐧',
        '🐦',
        '🐤',
        '🐣',
        '🐥',
        '🦆',
        '🦅',
        '🦉',
        '🦇',
        '🐺',
        '🐗',
        '🐴',
        '🦄',
        '🐝',
        '🐛',
        '🦋',
        '🐌',
        '🐞',
        '🐜',
      ],
    },
    food: {
      name: 'Food',
      emojis: [
        '🍎',
        '🍐',
        '🍊',
        '🍋',
        '🍌',
        '🍉',
        '🍇',
        '🍓',
        '🍈',
        '🍒',
        '🍑',
        '🥭',
        '🍍',
        '🥥',
        '🥝',
        '🍅',
        '🍆',
        '🥑',
        '🥦',
        '🥒',
        '🌶️',
        '🌽',
        '🥕',
        '🥔',
        '🍠',
        '🥐',
        '🍞',
        '🥖',
        '🥨',
        '🧀',
        '🥚',
        '🍳',
        '🥞',
        '🥓',
        '🥩',
        '🍗',
        '🍖',
        '🌭',
        '🍔',
        '🍟',
      ],
    },
    activities: {
      name: 'Activities',
      emojis: [
        '⚽',
        '🏀',
        '🏈',
        '⚾',
        '🥎',
        '🎾',
        '🏐',
        '🏉',
        '🥏',
        '🎱',
        '🏓',
        '🏸',
        '🥅',
        '🏒',
        '🏑',
        '🥍',
        '🏏',
        '⛳',
        '🏹',
        '🎣',
        '🥊',
        '🥋',
        '🎽',
        '⛸️',
        '🥌',
        '🛷',
        '🛹',
        '🏂',
        '⛷️',
        '🏇',
        '🏊',
        '🤽',
        '🚣',
        '🧗',
        '🚴',
        '🚵',
        '🎮',
        '🕹️',
        '🎲',
        '🎭',
      ],
    },
    objects: {
      name: 'Objects',
      emojis: [
        '⌚',
        '📱',
        '📲',
        '💻',
        '⌨️',
        '🖥️',
        '🖨️',
        '🖱️',
        '🖲️',
        '🕹️',
        '💽',
        '💾',
        '💿',
        '📀',
        '📼',
        '📷',
        '📸',
        '📹',
        '📽️',
        '🎞️',
        '📞',
        '☎️',
        '📟',
        '📠',
        '📺',
        '📻',
        '🎙️',
        '🎚️',
        '🎛️',
        '⏰',
        '🕰️',
        '⏱️',
        '⏲️',
        '🔋',
        '🔌',
        '💡',
        '🔦',
        '🕯️',
        '🗑️',
        '🛒',
      ],
    },
    symbols: {
      name: 'Symbols',
      emojis: [
        '❤️',
        '🧡',
        '💛',
        '💚',
        '💙',
        '💜',
        '🤎',
        '🖤',
        '🤍',
        '💔',
        '❣️',
        '💕',
        '💞',
        '💓',
        '💗',
        '💖',
        '💘',
        '💝',
        '💟',
        '☮️',
        '✨',
        '⭐',
        '🌟',
        '⚡',
        '☄️',
        '💫',
        '🔥',
        '💧',
        '🌊',
        '✅',
        '❌',
        '❎',
        '✔️',
        '☑️',
        '❇️',
        '✳️',
        '🌀',
        '➿',
        '👍',
        '👎',
      ],
    },
  };

  const handleEmojiClick = (emoji) => {
    onEmojiSelect(emoji);
    setVisible(false);
  };

  const handleButtonClick = () => {
    if (disabled) return;

    if (!visible && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top - 350, // Position above the button
        left: Math.max(10, rect.left - 150), // Center horizontally, but not off-screen
      });
    }
    setVisible(!visible);
  };

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        visible &&
        panelRef.current &&
        !panelRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setVisible(false);
      }
    };

    if (visible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [visible]);

  return (
    <>
      <Button
        ref={buttonRef}
        type="text"
        icon={<SmileOutlined />}
        onClick={handleButtonClick}
        disabled={disabled}
        size="small"
        style={{
          color: visible ? '#1890ff' : '#666',
          backgroundColor: visible ? '#f0f7ff' : 'transparent',
          transition: 'all 0.2s ease',
        }}
      />

      {visible && (
        <div
          ref={panelRef}
          className="fixed z-50 bg-white border rounded-lg shadow-lg"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            width: '340px',
            maxHeight: '380px',
          }}
        >
          <div className="px-3 py-2 border-b">
            <h4 className="text-sm font-medium text-gray-700">Choose an emoji</h4>
          </div>

          <div className="p-2">
            {/* Category Tabs */}
            <div className="flex flex-wrap gap-1 mb-3 pb-2 border-b">
              {Object.entries(emojiCategories).map(([key, category]) => (
                <Button
                  key={key}
                  type={selectedCategory === key ? 'primary' : 'text'}
                  size="small"
                  onClick={() => setSelectedCategory(key)}
                  className="text-xs px-2 py-1 min-w-[60px] flex-1"
                >
                  {category.name}
                </Button>
              ))}
            </div>

            {/* Emoji Grid */}
            <div className="grid grid-cols-10 gap-1 max-h-60 overflow-y-auto p-1">
              {emojiCategories[selectedCategory].emojis.map((emoji, index) => (
                <Button
                  key={index}
                  type="text"
                  size="small"
                  onClick={() => handleEmojiClick(emoji)}
                  className="w-7 h-7 p-0 text-base hover:bg-gray-100 flex items-center justify-center border-none rounded transition-colors"
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EmojiPicker;
