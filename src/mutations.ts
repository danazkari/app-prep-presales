import { gql } from '@apollo/client';

export const CREATE_PURCHASE = gql`
  mutation CreatePurchase($data: PurchaseCreateInput!) {
    createPurchase(data: $data) {
      id
      status
      createdAt
    }
  }
`;
