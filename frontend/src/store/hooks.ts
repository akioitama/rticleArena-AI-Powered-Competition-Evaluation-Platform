import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../index';

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: <TSelected>(
    selector: (state: RootState) => TSelected
) => TSelected = useSelector;
