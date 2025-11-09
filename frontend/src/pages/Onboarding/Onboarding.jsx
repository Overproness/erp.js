import React from 'react';
import { Helmet } from 'react-helmet-async';
import useLanguage from '@/locale/useLanguage';
import OnboardingModule from './OnboardingModule';

const OnboardingPage = () => {
  const translate = useLanguage();

  return (
    <>
      <Helmet>
        <title>{translate('Company Setup')} | ERP System</title>
      </Helmet>
      <OnboardingModule />
    </>
  );
};

export default OnboardingPage;
