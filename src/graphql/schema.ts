const gql = String.raw;

// GraphQL schema
export const schema = gql`
  scalar Decimal

  type Category {
    id: String!
    name: String!
    budget: Decimal
    category_type: String!
    category_color: String!
  }

  type CategoryColor {
    id: String!
    name: String!
    hex_code: String!
  }

  type LinkedAccount {
    item_id: String!
    name: String!
    alias_name: String
    created_at: String!
    linked_sub_accounts: [LinkedSubAccount!]!
  }

  type LinkedSubAccount {
    account_id: String!
    name: String!
    alias_name: String
    balance: Decimal
  }

  type Transaction {
    id: String!
    name: String!
    amount: Decimal!
    date: Int!
    pending: Boolean!
    currency: String!
    category: Category
    linked_sub_account: LinkedSubAccount!
  }

  type Query {
    getCategoryColors: [CategoryColor!]!
    getCategories(userId: String!): [Category!]!
    getLinkedAccounts(userId: String!): [LinkedAccount!]!
    getTransactions(userId: String!): [Transaction!]!
  }
`;
