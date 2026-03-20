import useLanguage from '@/locale/useLanguage';
import { getDocumentStatusColor } from '@/utils/documentTagColor';
import { Tag } from 'antd';

export function DocumentStatusTag({ status = 'draft' }) {
  const translate = useLanguage();
  const { color, icon } = getDocumentStatusColor(status);

  return (
    <Tag color={color}>
      {icon && <span style={{ marginRight: 5 }}>{icon}</span>}
      {translate(status)}
    </Tag>
  );
}

export function DocumentTypeTag({ type }) {
  const translate = useLanguage();
  const { color, icon } = getDocumentStatusColor(type);

  return (
    <Tag color={color}>
      {icon && <span style={{ marginRight: 5 }}>{icon}</span>}
      {translate(type)}
    </Tag>
  );
}

export function DocumentTagsList({ tags = [] }) {
  const translate = useLanguage();

  // Check if tags array is valid and not empty
  const hasTags = tags && Array.isArray(tags) && tags.filter(Boolean).length > 0;

  // Find the first available color from the tagColor array
  const getColorForTag = (index) => {
    const colors = [
      'magenta',
      'red',
      'volcano',
      'orange',
      'gold',
      'lime',
      'green',
      'cyan',
      'blue',
      'geekblue',
      'purple',
    ];
    return colors[index % colors.length];
  };

  if (!hasTags) {
    return <span className="document-tag-empty">{translate('No tags')}</span>;
  }

  return (
    <>
      {tags.filter(Boolean).map((tag, index) => (
        <Tag color={getColorForTag(index)} key={tag}>
          {translate(tag)}
        </Tag>
      ))}
    </>
  );
}
