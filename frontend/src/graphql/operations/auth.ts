import { gql } from '@apollo/client';

// Queries
export const VERIFY_TOKEN = gql`
  query VerifyToken {
    verifyToken { success result { _id email name surname role photo companyName companyID hasCompanySetup onboardingComplete } message }
  }
`;

export const GET_ADMIN = gql`
  query GetAdmin($id: ID!) {
    adminRead(id: $id) { success result message }
  }
`;

export const GET_ADMIN_LIST = gql`
  query GetAdminList($page: Int, $limit: Int, $sortBy: String, $sortValue: String) {
    adminList(page: $page, limit: $limit, sortBy: $sortBy, sortValue: $sortValue) {
      success result pagination { page count pages total } message
    }
  }
`;

export const GET_USER = gql`
  query GetUser($id: ID!) {
    userRead(id: $id) { success result message }
  }
`;

export const GET_USER_LIST = gql`
  query GetUserList($page: Int, $limit: Int, $sortBy: String, $sortValue: String) {
    userList(page: $page, limit: $limit, sortBy: $sortBy, sortValue: $sortValue) {
      success result pagination { page count pages total } message
    }
  }
`;

export const SEARCH_USERS = gql`
  query SearchUsers($q: String!, $fields: String) {
    userSearch(q: $q, fields: $fields) { success result message }
  }
`;

// Mutations
export const LOGIN = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) { success result { token admin { _id email name surname role photo companyName companyID hasCompanySetup onboardingComplete } } message }
  }
`;

export const REGISTER = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) { success result { token admin { _id email name } } message }
  }
`;

export const LOGOUT = gql`
  mutation Logout {
    logout { success message }
  }
`;

export const FORGOT_PASSWORD = gql`
  mutation ForgotPassword($input: ForgetPasswordInput!) {
    forgetPassword(input: $input) { success message }
  }
`;

export const RESET_PASSWORD = gql`
  mutation ResetPassword($input: ResetPasswordInput!) {
    resetPassword(input: $input) { success result { token admin { _id email name } } message }
  }
`;

export const UPDATE_ADMIN = gql`
  mutation UpdateAdmin($id: ID!, $input: AdminUpdateInput!) {
    adminUpdate(id: $id, input: $input) { success result message }
  }
`;

export const COMPLETE_SETUP = gql`
  mutation CompleteSetup($input: JSON!) {
    adminCompleteSetup(input: $input) { success result message }
  }
`;

export const CREATE_USER = gql`
  mutation CreateUser($input: UserCreateInput!) {
    userCreate(input: $input) { success result message }
  }
`;

export const UPDATE_USER = gql`
  mutation UpdateUser($id: ID!, $input: UserUpdateInput!) {
    userUpdate(id: $id, input: $input) { success result message }
  }
`;

export const DELETE_USER = gql`
  mutation DeleteUser($id: ID!) {
    userDelete(id: $id) { success result message }
  }
`;

export const USER_PROFILE = gql`
  query UserProfile {
    userProfile { success result message }
  }
`;

export const USER_PERMISSIONS = gql`
  query UserPermissions {
    userPermissions { success result message }
  }
`;

export const ADMIN_PASSWORD_UPDATE = gql`
  mutation AdminPasswordUpdate($id: ID!, $input: JSON!) {
    adminPasswordUpdate(id: $id, input: $input) { success result message }
  }
`;

export const UPDATE_PROFILE_PASSWORD = gql`
  mutation UpdateProfilePassword($input: JSON!) {
    updateProfilePassword(input: $input) { success result message }
  }
`;

export const UPDATE_PROFILE = gql`
  mutation UpdateProfile($input: JSON!) {
    updateProfile(input: $input) { success result message }
  }
`;
