import { AppSyncResolverHandler } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { Book, MutationUpdateBookArgs } from '../../types/books';
import dynoexpr from '@tuplo/dynoexpr';

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
        ...(book.title !== undefined ? { title: book.title } : {}),
        ...(book.rating !== undefined ? { rating: book.rating } : {}),
        ...(book.completed !== undefined ? { completed: book.completed } : {}),
        ...(book.reviews !== undefined ? { reviews: book.reviews } : {}),
      },
      // don't understand why this cast in necessary here. Only needed when reviews is included in set of mutable fields
    } as any);

    const result = await documentClient.update(params).promise();
    return result.Attributes as Book;
  } catch (err) {
    console.log('DynamoDB error: ', err);
    return null;
  }
};
