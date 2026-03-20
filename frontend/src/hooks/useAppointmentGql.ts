import { useQuery, useMutation, type QueryHookOptions, type MutationHookOptions } from '@apollo/client/react';
import {
  GET_APPOINTMENTS,
  GET_APPOINTMENT,
  SEARCH_APPOINTMENTS,
  APPOINTMENT_AVAILABILITY,
  CREATE_APPOINTMENT,
  UPDATE_APPOINTMENT,
  DELETE_APPOINTMENT,
  CONFIRM_APPOINTMENT,
  CANCEL_APPOINTMENT,
  RESCHEDULE_APPOINTMENT,
  APPOINTMENT_REMINDER,
} from '../graphql/operations/appointment';

export const useAppointments = (options?: QueryHookOptions) =>
  useQuery(GET_APPOINTMENTS, options);

export const useAppointment = (id: string, options?: QueryHookOptions) =>
  useQuery(GET_APPOINTMENT, { ...options, variables: { id } });

export const useSearchAppointments = (q: string, options?: QueryHookOptions) =>
  useQuery(SEARCH_APPOINTMENTS, { ...options, variables: { q } });

export const useAppointmentAvailability = (date: string, staffId?: string, options?: QueryHookOptions) =>
  useQuery(APPOINTMENT_AVAILABILITY, { ...options, variables: { date, staffId } });

export const useCreateAppointment = (options?: MutationHookOptions) =>
  useMutation(CREATE_APPOINTMENT, options);

export const useUpdateAppointment = (options?: MutationHookOptions) =>
  useMutation(UPDATE_APPOINTMENT, options);

export const useDeleteAppointment = (options?: MutationHookOptions) =>
  useMutation(DELETE_APPOINTMENT, options);

export const useConfirmAppointment = (options?: MutationHookOptions) =>
  useMutation(CONFIRM_APPOINTMENT, options);

export const useCancelAppointment = (options?: MutationHookOptions) =>
  useMutation(CANCEL_APPOINTMENT, options);

export const useRescheduleAppointment = (options?: MutationHookOptions) =>
  useMutation(RESCHEDULE_APPOINTMENT, options);

export const useAppointmentReminder = (options?: MutationHookOptions) =>
  useMutation(APPOINTMENT_REMINDER, options);
