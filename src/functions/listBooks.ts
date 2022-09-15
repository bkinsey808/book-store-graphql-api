import { AppSyncResolverHandler } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

import { Book } from '../../types/books';

const documentClient = new DynamoDB.DocumentClient();

export const handler: AppSyncResolverHandler<
  null,
  Book[] | null
> = async () => {
  try {
    if (!process.env.BOOKS_TABLE) {
      throw new Error('BOOKS_TABLE environment variable not set');
    }

    const result = await documentClient
      .scan({ TableName: process.env.BOOKS_TABLE })
      .promise();

    return result.Items as Book[];
  } catch (err) {
    console.log('DynamoDB error: ', err);
    return null;
  }
};
