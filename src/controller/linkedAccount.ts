import { prisma } from '../config/database';

type LinkAccountData = {
  userUid: string;
  itemId: string;
  accessToken: string;
  institutionName: string;
};

export const saveRecordToLinkedAccounts = async (linkAccountData: LinkAccountData) => {
  const { userUid, itemId, accessToken, institutionName } = linkAccountData;

  try {
    // Add the linked account to the database
    await prisma.linkedAccount.create({
      data: {
        item_id: itemId,
        access_token: accessToken,
        user_id: userUid,
        name: institutionName,
      },
    });

    return itemId;
  } catch (error) {
    console.error('Error adding linked account to database:', error);
  }
};

// Ques: How to throw an error here that is caught by the catch block in the route?
// Additionally, put the logic for checking !linkedAccount in here
export const getAccessTokenFromItemId = async (itemId: string) => {
  try {
    const linkedAccount = await prisma.linkedAccount.findUnique({
      where: {
        item_id: itemId,
      },
      select: {
        access_token: true,
      },
    });
    if (!linkedAccount) {
      console.error('No access token found for the given item ID');
      return;
    }
    return linkedAccount.access_token;
  } catch (error) {
    console.error('Error getting access token:', error);
  }
};

export const updateAliasAccountName = async (itemId: string, aliasAccountName: string) => {
  try {
    const res = await prisma.linkedAccount.update({
      where: {
        item_id: itemId,
      },
      data: {
        alias_name: aliasAccountName,
      },
    });
    return res.item_id;
  } catch (error) {
    console.error('Error updating alias account name:', error);
  }
};

// Removes the item ID and all associated data from the database
export const removeItemId = async (itemId: string) => {
  try {
    const res = await prisma.linkedAccount.delete({
      where: {
        item_id: itemId,
      },
    });
    return res.item_id;
  } catch (error) {
    console.error(`Error deleting the item with item ID: ${itemId}`, error);
  }
};
