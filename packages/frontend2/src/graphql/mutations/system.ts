/**
 * System GraphQL Mutations
 *
 * WHY: Mutations for system initialization and management.
 */

import { gql } from '@apollo/client';

/**
 * InitSystem Mutation
 *
 * WHY: Initialize the system with the first admin user.
 * This mutation creates the first user and marks the system as initialized.
 */
export const INIT_SYSTEM_MUTATION = gql`
  mutation InitSystem($email: String!, $adminPassword: String!) {
    initSystem(email: $email, adminPassword: $adminPassword) {
      id
      initialized
      createdAt
      updatedAt
    }
  }
`;
