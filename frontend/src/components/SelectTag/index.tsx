import { Select, Tag } from '@/components/ui';
import { generate as uniqueId } from 'shortid';

export default function SelectTag({ options, defaultValue }) {
  return (
    <Select
      defaultValue={defaultValue}
      style={{
        width: '100%',
      }}
    >
      {options?.map((option) => {
        if (typeof option === 'object' && option.value !== undefined)
          return (
            <Select.Option key={option.value} value={option.value}>
              {option.label}
            </Select.Option>
          );
        else
          return (
            <Select.Option key={option} value={option}>
              {option}
            </Select.Option>
          );
      })}
    </Select>
  );
}
