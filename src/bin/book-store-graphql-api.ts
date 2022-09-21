#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { BookStoreGraphqlApiStack } from '../lib/book-store-graphql-api-stack';
import { Stage } from '../lib/helpers';

console.log('STAGE:', process.env.STAGE);
console.log('DEPLOY_RESOLVERS:', process.env.DEPLOY_RESOLVERS);

const app = new cdk.App();

const stackProps: cdk.StackProps = {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
};

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

  new BookStoreGraphqlApiStack(
    app,
    `BookStoreGraphqlApiStack-${stage}`,
    stackProps,
    {
      ...context,
      deployResolvers: process.env.DEPLOY_RESOLVERS === 'true',
    },
  );
} catch (e) {
  console.log('error: ', e);
}

app.synth();
