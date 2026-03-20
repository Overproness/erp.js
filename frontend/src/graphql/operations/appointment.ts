import { gql } from '@apollo/client';

export const GET_APPOINTMENTS = gql`
  query GetAppointments($page: Int, $limit: Int, $sortBy: String, $sortValue: String) {
    appointmentList(page: $page, limit: $limit, sortBy: $sortBy, sortValue: $sortValue) {
      success result pagination { page count pages total } message
    }
  }
`;

export const GET_APPOINTMENT = gql`
  query GetAppointment($id: ID!) {
    appointmentRead(id: $id) { success result message }
  }
`;

export const SEARCH_APPOINTMENTS = gql`
  query SearchAppointments($q: String!, $fields: String) {
    appointmentSearch(q: $q, fields: $fields) { success result message }
  }
`;

export const APPOINTMENT_AVAILABILITY = gql`
  query AppointmentAvailability($date: String!, $staffId: ID) {
    appointmentAvailability(date: $date, staffId: $staffId) { success result message }
  }
`;

export const CREATE_APPOINTMENT = gql`
  mutation CreateAppointment($input: AppointmentCreateInput!) {
    appointmentCreate(input: $input) { success result message }
  }
`;

export const UPDATE_APPOINTMENT = gql`
  mutation UpdateAppointment($id: ID!, $input: AppointmentUpdateInput!) {
    appointmentUpdate(id: $id, input: $input) { success result message }
  }
`;

export const DELETE_APPOINTMENT = gql`
  mutation DeleteAppointment($id: ID!) {
    appointmentDelete(id: $id) { success result message }
  }
`;

export const CONFIRM_APPOINTMENT = gql`
  mutation ConfirmAppointment($id: ID!) {
    appointmentConfirm(id: $id) { success result message }
  }
`;

export const CANCEL_APPOINTMENT = gql`
  mutation CancelAppointment($id: ID!, $reason: String) {
    appointmentCancel(id: $id, reason: $reason) { success result message }
  }
`;

export const RESCHEDULE_APPOINTMENT = gql`
  mutation RescheduleAppointment($id: ID!, $input: JSON!) {
    appointmentReschedule(id: $id, input: $input) { success result message }
  }
`;

export const APPOINTMENT_REMINDER = gql`
  mutation AppointmentSendReminder($id: ID!) {
    appointmentSendReminder(id: $id) { success result message }
  }
`;
