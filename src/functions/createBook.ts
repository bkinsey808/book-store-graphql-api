import { AppSyncResolverHandler } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

import { Book, MutationCreateBookArgs } from '../../types/books';

const documentClient = new DynamoDB.DocumentClient();

export const handler: AppSyncResolverHandler<
  MutationCreateBookArgs,
  Book | null
> = async (event) => {
  try {
    if (!process.env.BOOKS_TABLE) {
      throw new Error('BOOKS_TABLE environment variable not set');
    }

    const book = event.arguments.book;

    await documentClient
      .put({
        TableName: process.env.BOOKS_TABLE,
        Item: book,
      })
      .promise();

    return book;
  } catch (err) {
    console.log('DynamoDB error: ', err);
    return null;
  }
};
