import React from 'react';
import { useParams } from 'react-router-dom';
import UrlRedirectModule from './UrlModule/UrlRedirectModule';

export default function RedirectHandler() {
  const { shortCode } = useParams();

  return <UrlRedirectModule shortCode={shortCode} />;
}
