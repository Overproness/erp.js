import React from 'react';
import { Helmet } from 'react-helmet-async';
import DashboardModule from './DashboardModule';
import useLanguage from '@/locale/useLanguage';

export default function Dashboard() {
  const translate = useLanguage();
  
  return (
    <>
      <Helmet>
        <title>{translate('dashboard')} | ERP System</title>
      </Helmet>
      <DashboardModule />
    </>
  );
}
