import { RemovedTransaction } from 'plaid';
import { prisma } from '../config/database';
import { SimpleTransaction } from '../routes/plaid/transactions';

// Transforms the transaction data into the database format
const mapTransactionForDb = (txn: SimpleTransaction) => {
  return {
    id: txn.transactionId,
    user_id: txn.userId,
    linked_sub_account_id: txn.accountId,
    currency: txn.currencyCode,
    amount: txn.amount,
    name: txn.name,
    date: txn.date,
    pending: txn.pending,
  };
};

const handlePendingToPostedTransaction = async (
  transactionData: SimpleTransaction,
  removedTransactions: RemovedTransaction[]
) => {
  try {
    if (!transactionData.pendingTransactionId) {
      throw new Error('Pending transaction ID not found');
    }

    // Check if the pending transaction is in the removed transactions
    const pendingTxnInRemoved = removedTransactions.find(
      (item) => item.transaction_id === transactionData.pendingTransactionId
    );

    // If the pending transaction is not in the removed transactions, throw an error
    if (!pendingTxnInRemoved) {
      const errorMsg = `Pending transaction with transaction ID: ${transactionData.transactionId} not found in removed transactions`;
      throw new Error(errorMsg);
    }

    const pendingTransaction = await prisma.transaction.findUnique({
      where: {
        id: transactionData.pendingTransactionId,
      },
    });

    if (!pendingTransaction) {
      const errorMsg = `Pending transaction with transaction ID: ${transactionData.pendingTransactionId} not found in database`;
      throw new Error(errorMsg);
    }

    // Create a new transaction with the pending transaction's data
    const dbRes = await prisma.transaction.create({
      data: {
        id: transactionData.transactionId,
        user_id: transactionData.userId,
        linked_sub_account_id: pendingTransaction.linked_sub_account_id,
        currency: pendingTransaction.currency,
        amount: pendingTransaction.amount,
        name: pendingTransaction.name,
        date: pendingTransaction.date,
        pending: false,
      },
    });

    if (dbRes.id === transactionData.transactionId) {
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error handling pending to posted transaction:', error);
    return false;
  }
};

export const addNewTransaction = async (
  transactionData: SimpleTransaction,
  removedTransactions: RemovedTransaction[]
) => {
  try {
    // If transction is moved from pending to posted
    if (!transactionData.pending && transactionData.pendingTransactionId) {
      return await handlePendingToPostedTransaction(transactionData, removedTransactions);
    }

    // Add the transaction to the database
    const dbRes = await prisma.transaction.create({
      data: mapTransactionForDb(transactionData),
    });

    if (dbRes.id === transactionData.transactionId) {
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error adding transaction to database:', error);
    return false;
  }
};

export const modifyTransaction = async (transactionsData: SimpleTransaction) => {
  try {
    // Update the transaction in the database
    const dbRes = await prisma.transaction.update({
      where: {
        id: transactionsData.transactionId,
        user_id: transactionsData.userId,
      },
      data: mapTransactionForDb(transactionsData),
    });

    if (dbRes.id === transactionsData.transactionId) {
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error modifying transaction in database:', error);
    return false;
  }
};
