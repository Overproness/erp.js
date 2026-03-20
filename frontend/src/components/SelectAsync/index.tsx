import useFetch from '@/hooks/useFetch';
import useLanguage from '@/locale/useLanguage';
import apolloClient from '@/graphql/client';
import { getListQuery } from '@/graphql/operations/crudFactory';
import color from '@/utils/color';
import { Select, Tag } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generate as uniqueId } from 'shortid';

const SelectAsync = ({
  entity,
  displayLabels = ['name'],
  outputValue = '_id',
  redirectLabel = '',
  withRedirect = false,
  urlToRedirect = '/',
  placeholder = 'select',
  value,
  onChange,
}) => {
  const translate = useLanguage();
  const [selectOptions, setOptions] = useState([]);
  const [currentValue, setCurrentValue] = useState(undefined);

  const navigate = useNavigate();

  const asyncList = () => {
    return apolloClient.query({ query: getListQuery(entity) }).then(({ data }) => {
      const key = `${entity}List`;
      return data[key]?.result || [];
    });
  };
  const { result, isLoading: fetchIsLoading, isSuccess } = useFetch(asyncList);
  useEffect(() => {
    if (isSuccess && Array.isArray(result)) {
      setOptions(result);
    } else if (isSuccess && result) {
      // Handle case where result might be wrapped in an object
      setOptions([]);
    }
  }, [isSuccess, result]);

  const labels = (optionField) => {
    return optionField.name;
  };
  useEffect(() => {
    if (value !== undefined) {
      const val = value?.[outputValue] ?? value;
      setCurrentValue(val);
      onChange(val);
    }
  }, [value]);

  const handleSelectChange = (newValue) => {
    if (newValue === 'redirectURL') {
      navigate(urlToRedirect);
    } else {
      const val = newValue?.[outputValue] ?? newValue;
      setCurrentValue(newValue);
      onChange(val);
    }
  };

  const optionsList = () => {
    const list = [];

    // if (selectOptions.length === 0 && withRedirect) {
    //   const value = 'redirectURL';
    //   const label = `+ ${translate(redirectLabel)}`;
    //   list.push({ value, label });
    // }
    if (Array.isArray(selectOptions)) {
      selectOptions.map((optionField) => {
        const value = optionField[outputValue] ?? optionField;
        const label = labels(optionField);
        const currentColor = optionField[outputValue]?.color ?? optionField?.color;
        const labelColor = color.find((x) => x.color === currentColor);
        list.push({ value, label, color: labelColor?.color });
      });
    }

    return list;
  };

  return (
    <Select
      loading={fetchIsLoading}
      disabled={fetchIsLoading}
      value={currentValue}
      onChange={handleSelectChange}
      placeholder={placeholder}
    >
      {optionsList()?.map((option) => {
        return (
          <Select.Option key={`${uniqueId()}`} value={option.value}>
            <Tag bordered={false} color={option.color}>
              {option.label}
            </Tag>
          </Select.Option>
        );
      })}
      {withRedirect && (
        <Select.Option value={'redirectURL'}>{`+ ` + translate(redirectLabel)}</Select.Option>
      )}
    </Select>
  );
};

export default SelectAsync;
