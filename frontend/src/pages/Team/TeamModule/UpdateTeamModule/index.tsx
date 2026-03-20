import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import { erp } from '@/redux/erp/actions';
import { selectCurrentItem } from '@/redux/erp/selectors';
import { TEAM_ENTITY } from '../TeamDataTableModule/config';
import UpdateForm from './components/UpdateTeamForm';

const UpdateTeamModule = () => {
  const dispatch = useDispatch();
  const { id } = useParams();

  const { result: currentResult, isLoading: isLoadingItem } = useSelector(selectCurrentItem);
  const { item } = currentResult || {};

  useEffect(() => {
    dispatch(erp.read({ entity: TEAM_ENTITY, id }));
  }, [id]);

  return <UpdateForm config={{ TEAM_ENTITY, id }} dataItem={item} isLoading={isLoadingItem} />;
};

export { UpdateTeamModule };
