import { AppSyncResolverHandler } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

import { MutationAuthArgs, Success } from '../../types/api';

const documentClient = new DynamoDB.DocumentClient();

export const handler: AppSyncResolverHandler<
  MutationAuthArgs,
  Success | null
> = async (event) => {
  try {
    const { authType, data } = event.arguments.authInput;

    // if (!process.env.SESSION_TABLE) {
    //   throw new Error('SESSION_TABLE environment variable not set');
    // }

    // const session = event.arguments.session;

    // await documentClient
    //   .put({
    //     TableName: process.env.SESSION_TABLE,
    //     Item: session,
    //   })
    //   .promise();

    // return session;

    console.log({ event, authType, data });
    return {
      success: true,
      data: JSON.stringify({
        authType,
        data,
      }),
    };
  } catch (err) {
    console.log('DynamoDB error: ', err);
    return null;
  }
};
