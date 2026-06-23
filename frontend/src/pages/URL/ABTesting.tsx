import React from 'react';
import { PageHeader } from '@/components/ui';
import ABTestModule from './UrlModule/ABTestModule';
import useLanguage from '@/locale/useLanguage';

export default function ABTesting() {
  const translate = useLanguage();

  return (
      <ABTestModule />
  );
}
