#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SessionStoreGraphqlApiStack } from '../lib/bkinsey808com-graphql-api-stack';
import { Stage } from '../lib/helpers';

console.log('PROJECT:', process.env.PROJECT);
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

  const project = process.env.PROJECT as string;

  if (!project) {
    throw new Error('PROJECT environment variable must be set');
  }

  const context = {
    stage,
    project,
  };

  new SessionStoreGraphqlApiStack(app, `${project}-${stage}`, stackProps, {
    ...context,
    deployResolvers: process.env.DEPLOY_RESOLVERS === 'true',
  });
} catch (e) {
  console.log('error: ', e);
}

app.synth();
