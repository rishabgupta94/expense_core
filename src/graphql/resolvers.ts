import db from '../db/database';

// Root resolver
export const resolvers = {
  Query: {
    getCategories: async (_: any, { userId }: { userId: string }) => {
      try {
        if (!userId) {
          throw new Error(
            'User ID is not present. Ensure that you are logged in to the application'
          );
        }
        const categories = await db.query(
          'SELECT name FROM categories WHERE user_uid = ?',
          [userId]
        );
        return categories[0];
      } catch (error) {
        throw new Error((error as Error).message);
      }
    },
  },
};
