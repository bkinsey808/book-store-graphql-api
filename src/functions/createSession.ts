import { AppSyncResolverHandler } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

import { Session, MutationCreateSessionArgs } from '../../types/api';

const documentClient = new DynamoDB.DocumentClient();

export const handler: AppSyncResolverHandler<
  MutationCreateSessionArgs,
  Session | null
> = async (event) => {
  try {
    if (!process.env.SESSION_TABLE) {
      throw new Error('SESSION_TABLE environment variable not set');
    }

    const session = event.arguments.session;

    await documentClient
      .put({
        TableName: process.env.SESSION_TABLE,
        Item: session,
      })
      .promise();

    return session;
  } catch (err) {
    console.log('DynamoDB error: ', err);
    return null;
  }
};
