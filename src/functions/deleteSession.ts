import { AppSyncResolverHandler } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

import { MutationDeleteSessionArgs, Success } from '../../types/api';

const documentClient = new DynamoDB.DocumentClient();

export const handler: AppSyncResolverHandler<
  MutationDeleteSessionArgs,
  Success | null
> = async (event) => {
  try {
    if (!process.env.SESSION_TABLE) {
      throw new Error('SESSION_TABLE environment variable not set');
    }

    const id = event.arguments.sessionId;

    await documentClient
      .delete({
        TableName: process.env.SESSION_TABLE,
        Key: { id },
      })
      .promise();

    return { success: true };
  } catch (err) {
    console.log('DynamoDB error: ', err);
    return null;
  }
};
