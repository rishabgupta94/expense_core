/* eslint-disable @typescript-eslint/naming-convention */
import express from 'express';
import { RemovedTransaction, Transaction, TransactionsSyncRequest } from 'plaid';
import { plaidClient } from '../../config/plaid-config';
import { getAccessTokenAndCursorFromItemId } from '../../controller/linkedAccount';
import { UserInfoRequest } from '../../utils/express-types';

const router = express.Router();

type TransactionsAllData = {
  added: Transaction[];
  modified: Transaction[];
  removed: RemovedTransaction[];
  nextCursor: string | undefined;
};

// Fetch all transactions data for an item
const fetchTransactionsData = async (
  accessToken: string,
  initialCursor: string | null,
  retriesLeft = 3
): Promise<TransactionsAllData> => {
  const allData: TransactionsAllData = {
    added: [],
    modified: [],
    removed: [],
    nextCursor: initialCursor ?? undefined,
  };

  if (retriesLeft <= 0) {
    console.error('Too many retries!');
    return allData;
  }
  try {
    let hasMore = true;
    // Iterate through each page of new transaction updates for item
    while (hasMore) {
      const transactionsRequest: TransactionsSyncRequest = {
        access_token: accessToken,
        cursor: allData.nextCursor,
      };
      const transactions = await plaidClient.transactionsSync(transactionsRequest);
      const newData = transactions.data;

      allData.added = allData.added.concat(newData.added);
      allData.modified = allData.modified.concat(newData.modified);
      allData.removed = allData.removed.concat(newData.removed);
      allData.nextCursor = newData.next_cursor;
      hasMore = newData.has_more;
    }

    return allData;
  } catch (error) {
    console.log(`Oh no! Error! ${JSON.stringify(error)} Let's try again from the beginning!`);
    return fetchTransactionsData(accessToken, initialCursor, retriesLeft - 1);
  }
};

// Extracts the necessary fields from a transaction object
const getSimpleTransactionObject = (transaction: Transaction) => {
  const {
    transaction_id,
    account_id,
    iso_currency_code,
    amount,
    merchant_name,
    name,
    authorized_date,
    date,
    pending,
    pending_transaction_id,
  } = transaction;

  return {
    transactionId: transaction_id,
    accountId: account_id,
    isoCurrencyCode: iso_currency_code,
    amount,
    name: merchant_name ?? name,
    date: authorized_date ?? date,
    pending,
    pendingTransactionId: pending_transaction_id,
  };
};

// Retrieve Transactions for an Item
router.get('/transactions/:item_id', async (request: UserInfoRequest, response, next) => {
  const { item_id: itemId } = request.params;
  const userUid = request.userUid;
  try {
    // If user ID is not preset, return an error
    if (!userUid) {
      return response.status(400).json({
        message: 'User ID is not present. Ensure that you are logged in to the application',
      });
    }
    // Get the access token
    const itemInfo = await getAccessTokenAndCursorFromItemId(itemId, userUid);
    if (!itemInfo) {
      return response.status(400).json({
        message: 'No linked account found for the given item ID',
      });
    }
    if (!itemInfo.access_token) {
      return response.status(400).json({
        message: 'Access token is not present for the given Item ID. Please try again',
      });
    }

    const allData = await fetchTransactionsData(itemInfo.access_token, itemInfo.last_cursor);
    return response.status(200).json(allData);
  } catch (error) {
    console.error('Error getting transactions:', error);
    next();
  }
});

module.exports = router;