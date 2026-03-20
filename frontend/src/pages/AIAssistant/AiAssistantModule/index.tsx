import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Spin } from 'antd';

// Lazy load components for better performance
const AiAssistantDataTableModule = React.lazy(() => import('./AiAssistantDataTableModule'));
const CreateAiAssistantModule = React.lazy(() => import('./CreateAiAssistantModule'));
const ReadAiAssistantModule = React.lazy(() => import('./ReadAiAssistantModule'));
const UpdateAiAssistantModule = React.lazy(() => import('./UpdateAiAssistantModule'));
const AiChatModule = React.lazy(() => import('./AiChatModule'));
const AiAnalyticsModule = React.lazy(() => import('./AiAnalyticsModule'));
const AiSuggestionsModule = React.lazy(() => import('./AiSuggestionsModule'));
const AiSettingsModule = React.lazy(() => import('./AiSettingsModule'));
const DataProcessorModule = React.lazy(() => import('./DataProcessorModule'));

const LoadingSpinner = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '200px' 
  }}>
    <Spin size="large" />
  </div>
);

const AiAssistantModule = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<AiAssistantDataTableModule />} />
        <Route path="/create" element={<CreateAiAssistantModule />} />
        <Route path="/read/:id" element={<ReadAiAssistantModule />} />
        <Route path="/update/:id" element={<UpdateAiAssistantModule />} />
        <Route path="/chat/:assistantId?" element={<AiChatModule />} />
        <Route path="/data-processor" element={<DataProcessorModule />} />
        <Route path="/analytics" element={<AiAnalyticsModule />} />
        <Route path="/suggestions" element={<AiSuggestionsModule />} />
        <Route path="/settings" element={<AiSettingsModule />} />
      </Routes>
    </Suspense>
  );
};

export default AiAssistantModule;