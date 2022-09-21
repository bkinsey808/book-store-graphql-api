import { AppSyncResolverHandler } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

import { MutationDeleteBookArgs, Success } from '../../types/books';

const documentClient = new DynamoDB.DocumentClient();

export const handler: AppSyncResolverHandler<
  MutationDeleteBookArgs,
  Success | null
> = async (event) => {
  try {
    if (!process.env.BOOKS_TABLE) {
      throw new Error('BOOKS_TABLE environment variable not set');
    }

    const id = event.arguments.bookId;

    await documentClient
      .delete({
        TableName: process.env.BOOKS_TABLE,
        Key: { id },
      })
      .promise();

    return { success: true };
  } catch (err) {
    console.log('DynamoDB error: ', err);
    return null;
  }
};
