import { erp } from '@/redux/erp/actions';
import { selectCurrentItem } from '@/redux/erp/selectors';
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { TEAM_ENTITY } from '../TeamDataTableModule/config';
import { ReadItem } from './components/ReadItem';

const ReadTeamModule = () => {
  const dispatch = useDispatch();
  const { id } = useParams();

  const { result: currentResult } = useSelector(selectCurrentItem);
  const loadedRef = useRef('');

  useEffect(() => {
    if (id && loadedRef.current !== id) {
      loadedRef.current = id;
      dispatch(erp.read({ entity: TEAM_ENTITY, id }));
    }
  }, [id, dispatch]);

  return <ReadItem config={{ TEAM_ENTITY: TEAM_ENTITY }} />;
};

export { ReadTeamModule };
