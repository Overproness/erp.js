import React from 'react';
import { PageHeader } from '@ant-design/pro-layout';
import ABTestModule from './UrlModule/ABTestModule';
import useLanguage from '@/locale/useLanguage';

export default function ABTesting() {
  const translate = useLanguage();

  return (
      <ABTestModule />
  );
}
