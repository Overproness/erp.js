import React from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from '@/components/ui';
import { PageHeader } from '@/components/ui';
import CreateUrlModule from './UrlModule/CreateUrlModule';
import useLanguage from '@/locale/useLanguage';
import { request } from '@/request';

export default function CreateUrl() {
  const translate = useLanguage();
  const navigate = useNavigate();

  const handleUrlCreate = async (formData) => {
    try {
      // Make sure we don't send category or customDomain in the request
      const { category, customDomain, ...dataToSend } = formData;
      
      const response = await request.create({
        entity: 'url',
        jsonData: dataToSend
      });

      if (response.success) {
        message.success(translate('URL created successfully'));
        navigate('/url');
      } else {
        message.error(response.message || translate('Failed to create URL'));
      }
    } catch (error) {
      console.error('Create URL error:', error);
      message.error(translate('An error occurred while creating the URL'));
    }
  };

  return (
    <PageHeader
      title={translate('Create Short URL')}
      subTitle={translate('Generate a new shortened URL with advanced settings')}
    >
      <div style={{ padding: '0' }}>
        <CreateUrlModule onSubmit={handleUrlCreate} />
      </div>
    </PageHeader>
  );
}
