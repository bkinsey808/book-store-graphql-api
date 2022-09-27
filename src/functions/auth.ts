import { AppSyncResolverHandler } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { OAuth2Client } from 'google-auth-library';

import { MutationAuthArgs, Success } from '../../types/api';

const documentClient = new DynamoDB.DocumentClient();

export const handler: AppSyncResolverHandler<
  MutationAuthArgs,
  Success | null
> = async (event) => {
  try {
    const { authType, data } = event.arguments.authInput;
    const parsedData = JSON.parse(data);
    const { clientId, credential } = parsedData;

    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: clientId, // Specify the CLIENT_ID of the app that accesses the backend
      // Or, if multiple clients access the backend:
      //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
    });
    const payload = ticket.getPayload();
    // const userId = payload?.['sub'];
    // If request specified a G Suite domain:
    // const domain = payload['hd'];

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
        payload,
      }),
    };
  } catch (err) {
    console.log('DynamoDB error: ', err);
    return null;
  }
};
