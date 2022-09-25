import { AppSyncResolverHandler } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

import { Session } from '../../types/api';

const documentClient = new DynamoDB.DocumentClient();

export const handler: AppSyncResolverHandler<
  null,
  Session[] | null
> = async () => {
  try {
    if (!process.env.SESSION_TABLE) {
      throw new Error('SESSION_TABLE environment variable not set');
    }

    const result = await documentClient
      .scan({ TableName: process.env.SESSION_TABLE })
      .promise();

    return result.Items as Session[];
  } catch (err) {
    console.log('DynamoDB error: ', err);
    return null;
  }
};
