const colors = [
  { value: 'default', label: 'default', icon: '🌟' },
  { value: 'draft', label: 'draft', icon: '📝' },
  { value: 'pending', label: 'pending', color: 'magenta', icon: '⏳' },
  { value: 'cancelled', label: 'cancelled', color: 'volcano', icon: '❌' },
  { value: 'sent', label: 'sent', color: 'gold', icon: '✉️' },
  { value: 'refunded', label: 'refunded', color: 'purple', icon: '💰' },
  { value: 'on hold', label: 'On hold', color: 'blue', icon: '🛑' },

  { value: 'accepted', label: 'accepted', color: 'green', icon: '✅' },
  { value: 'declined', label: 'declined', color: 'volcano', icon: '❎' },
  { value: 'rejected', label: 'rejected', color: 'red', icon: '🚫' },
  { value: 'expired', label: 'expired', color: 'orange', icon: '⏰' },

  { value: 'success', label: 'success', color: 'green', icon: '✨' },
  { value: 'failed', label: 'failed', color: 'red', icon: '❌' },
  { value: 'error', label: 'error', color: 'volcano', icon: '⚠️' },

  { value: 'arrived', label: 'arrived', color: 'blue', icon: '🚚' },

  { value: 'unpaid', label: 'unpaid', color: 'volcano', icon: '💵' },
  { value: 'paid', label: 'paid', color: 'green', icon: '💳' },
  { value: 'partially', label: 'partially paid', color: 'purple', icon: '💰' },
  { value: 'overdue', label: 'overdue', color: 'red', icon: '💰' },

  { value: 'processing', label: 'processing', color: 'geekblue', icon: '⌛' },
  { value: 'packing', label: 'packing', color: 'orange', icon: '📦' },
  { value: 'shipped', label: 'shipped', color: 'purple', icon: '✈️' },

  { value: 'not started', label: 'not started', icon: '🚫' },
  { value: 'in progress', label: 'in progress', color: 'geekblue', icon: '🔄' },
  { value: 'delayed', label: 'delayed', color: 'orange', icon: '⏰' },
  { value: 'completed', label: 'completed', color: 'green', icon: '✅' },
  { value: 'delivered', label: 'delivered', color: 'magenta', icon: '📦' },
  { value: 'returned', label: 'returned', color: 'red', icon: '🔙' },

  { value: 'new', label: 'new', color: 'blue', icon: '🚀' },
  { value: 'premium', label: 'premium', color: 'gold', icon: '🏆' },
  { value: 'free', label: 'free', color: 'green', icon: '💡' },
];

const statusTagColorList = (tags = []) => {
  // Make sure we have an array
  if (!Array.isArray(tags)) {
    return [];
  }

  // If array is empty, return empty array
  if (tags.length === 0) {
    return [];
  }

  // Process each tag
  return tags.map((tag) => {
    // Define color mappings for various statuses
    const colorMap = {
      // Payment statuses
      unpaid: 'orange',
      paid: 'green',
      partially: 'blue',
      overdue: 'red',

      // Document statuses
      draft: 'default',
      pending: 'processing',
      approved: 'success',
      rejected: 'error',
      archived: 'default',

      // General statuses
      active: 'green',
      inactive: 'gray',
      deleted: 'red',
    };

    // Return tag with color
    return {
      text: tag,
      color: colorMap[tag.toLowerCase()] || 'default',
    };
  });
};

const tagColor = (status) => {
  const element = colors.find((obj) => obj?.value?.toLowerCase() === status?.toLowerCase());
  if (element) return element;
  else return { value: status, label: status };
};

export { statusTagColorList, tagColor };
