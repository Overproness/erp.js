import React from 'react';
import { ReadTeamModule } from './TeamModule/ReadTeamModule';
import { TEAM_ENTITY } from './TeamModule/TeamDataTableModule/config';
import useLanguage from '@/locale/useLanguage';

const TeamRead = () => {
  const translate = useLanguage();
  
  const config = {
    entity: TEAM_ENTITY,
    ENTITY_NAME: translate('team'),
    READ_ENTITY: translate('team_details')
  };

  return <ReadTeamModule config={config} />;
};

export default TeamRead;
