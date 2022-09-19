#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { BookStoreGraphqlApiStack } from '../lib/book-store-graphql-api-stack';
import { Stage } from '../lib/helpers';

console.log('STAGE: ', process.env.STAGE);

const app = new cdk.App();

const stackProps: cdk.StackProps = {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
};

const createStacks = async () => {
  try {
    const stage = process.env.STAGE as Stage;

    if (!stage) {
      throw new Error('STAGE environment variable must be set');
    }

    if (!Object.values(Stage).includes(stage)) {
      throw new Error(
        `STAGE environment variable must be one of ${Object.values(Stage)}`,
      );
    }

    const context = {
      stage,
    };

    await new Promise((resolve) => setTimeout(resolve, 5000));

    // for some reason I don't understand, I have to deploy without resolvers first :(
    new BookStoreGraphqlApiStack(
      app,
      `BookStoreGraphqlApiStack-no-resolvers-${stage}`,
      stackProps,
      {
        ...context,
        deployResolvers: false,
      },
    );

    new BookStoreGraphqlApiStack(
      app,
      `BookStoreGraphqlApiStack-${stage}`,
      stackProps,
      {
        ...context,
        deployResolvers: true,
      },
    );
  } catch (e) {
    console.log('error: ', e);
  }
};
// app.synth();

createStacks();
