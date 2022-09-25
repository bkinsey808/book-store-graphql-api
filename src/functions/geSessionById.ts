import { AppSyncResolverHandler } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

import { Session, QueryGetSessionByIdArgs } from '../../types/api';

const documentClient = new DynamoDB.DocumentClient();

export const handler: AppSyncResolverHandler<
  QueryGetSessionByIdArgs,
  Session | null
> = async (event) => {
  try {
    if (!process.env.SESSION_TABLE) {
      throw new Error('SESSION_TABLE environment variable not set');
    }

    const sessionId = event.arguments.sessionId;

    const { Item } = await documentClient
      .get({
        TableName: process.env.SESSION_TABLE,
        Key: { id: sessionId },
      })
      .promise();

    return Item as Session;
  } catch (err) {
    console.log('DynamoDB error: ', err);
    return null;
  }
};
