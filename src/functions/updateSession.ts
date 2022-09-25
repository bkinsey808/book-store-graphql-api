import { AppSyncResolverHandler } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import dynoexpr from '@tuplo/dynoexpr';

import { Session, MutationUpdateSessionArgs } from '../../types/api';

const documentClient = new DynamoDB.DocumentClient();

export const handler: AppSyncResolverHandler<
  MutationUpdateSessionArgs,
  Session | null
> = async (event) => {
  try {
    if (!process.env.SESSION_TABLE) {
      throw new Error('SESSION_TABLE environment variable not set');
    }

    const session = event.arguments.session;

    const params = dynoexpr<DynamoDB.DocumentClient.UpdateItemInput>({
      TableName: process.env.SESSION_TABLE,
      Key: {
        id: session.id,
      },
      ReturnValues: 'ALL_NEW',
      Update: {
        // can't change the key
        // ...(session.id !== undefined ? { id: session.id } : {}),
        ...(session.title !== undefined ? { title: session.title } : {}),
        ...(session.rating !== undefined ? { rating: session.rating } : {}),
        ...(session.completed !== undefined
          ? { completed: session.completed }
          : {}),
        ...(session.reviews !== undefined ? { reviews: session.reviews } : {}),
        ...(session.data !== undefined ? { data: session.data } : {}),
      },
      // don't understand why this cast is necessary here. Only needed when reviews is included in set of mutable fields
    } as any);

    const result = await documentClient.update(params).promise();
    return result.Attributes as Session;
  } catch (err) {
    console.log('DynamoDB error: ', err);
    return null;
  }
};
