import { AppSyncResolverHandler } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import dynoexpr from '@tuplo/dynoexpr';

import { Book, MutationUpdateBookArgs } from '../../types/books';

const documentClient = new DynamoDB.DocumentClient();

export const handler: AppSyncResolverHandler<
  MutationUpdateBookArgs,
  Book | null
> = async (event) => {
  try {
    if (!process.env.BOOKS_TABLE) {
      throw new Error('BOOKS_TABLE environment variable not set');
    }

    const book = event.arguments.book;

    const params = dynoexpr<DynamoDB.DocumentClient.UpdateItemInput>({
      TableName: process.env.BOOKS_TABLE,
      Key: {
        id: book.id,
      },
      ReturnValues: 'ALL_NEW',
      Update: {
        // can't change the key
        // ...(book.id !== undefined ? { id: book.id } : {}),
        ...(book.title !== undefined ? { title: book.title } : {}),
        ...(book.rating !== undefined ? { rating: book.rating } : {}),
        ...(book.completed !== undefined ? { completed: book.completed } : {}),
        ...(book.reviews !== undefined ? { reviews: book.reviews } : {}),
      },
      // don't understand why this cast is necessary here. Only needed when reviews is included in set of mutable fields
    } as any);

    const result = await documentClient.update(params).promise();
    return result.Attributes as Book;
  } catch (err) {
    console.log('DynamoDB error: ', err);
    return null;
  }
};
