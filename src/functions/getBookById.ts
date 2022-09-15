import { AppSyncResolverHandler } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { Book, QueryGetBookByIdArgs } from '../../types/books';

const documentClient = new DynamoDB.DocumentClient();

export const handler: AppSyncResolverHandler<
  QueryGetBookByIdArgs,
  Book | null
> = async (event) => {
  try {
    if (!process.env.BOOKS_TABLE) {
      throw new Error('BOOKS_TABLE environment variable not set');
    }

    const bookId = event.arguments.bookId;

    const { Item } = await documentClient
      .get({
        TableName: process.env.BOOKS_TABLE,
        Key: { id: bookId },
      })
      .promise();

    return Item as Book;
  } catch (err) {
    console.log('DynamoDB error: ', err);
    return null;
  }
};
