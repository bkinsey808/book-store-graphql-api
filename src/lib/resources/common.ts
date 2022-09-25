import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { readFileSync } from 'fs';

import {
  SessionStoreGraphqlApiStackContext,
  CommonDataSourceProps,
  CommonLambdaProps,
} from '../helpers';

/** common stuff not related to particular endpoints */
export const commonResources = ({
  scope,
  context,
}: {
  scope: Construct;
  context: SessionStoreGraphqlApiStackContext;
}) => {
  const stage = context.stage;
  const project = context.project;

  const api = new appsync.CfnGraphQLApi(scope, `${project}_${stage}`, {
    name: `session-api-${stage}`,
    authenticationType: 'API_KEY',
  });

  // output the GraphQL URL
  new cdk.CfnOutput(scope, `GraphQlUrl`, {
    value: api.attrGraphQlUrl ?? 'UNDEFINED',
    exportName: `graphql-url-${project}-${stage}`,
  });

  const schema = new appsync.CfnGraphQLSchema(
    scope,
    `Schema_${project}_${stage}`,
    {
      apiId: api.attrApiId,
      definition: readFileSync('./graphql/schema.graphql', 'utf8'),
    },
  );

  const apiKey = new appsync.CfnApiKey(scope, `ApiKey_${project}_${stage}`, {
    apiId: api.attrApiId,
    description: `API key for api-key-${project}-${stage}`,
    // 365 days seems to be the limit imposed by AWS for API keys.
    // One possible workaround is to have the lambda function handle authentication
    expires: cdk.Expiration.after(cdk.Duration.days(365)).toEpoch(),
  });

  // output the API key
  new cdk.CfnOutput(scope, `ApiKey`, {
    value: apiKey.attrApiKey ?? 'UNDEFINED',
    exportName: `api-key-${project}-${stage}`,
  });

  const adminRole = new iam.Role(scope, `Role_${project}_${stage}`, {
    assumedBy: new iam.ServicePrincipal('appsync.amazonaws.com'),
  });

  const adminGroup = new iam.Group(scope, `Group_${project}_${stage}`, {});

  const adminPolicy = new iam.Policy(scope, `Policy_${project}_${stage}`, {
    statements: [
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['appsync:*'],
        resources: ['*'],
        conditions: {
          StringEquals: {
            'aws:ResourceTag/stage': stage,
            'aws:ResourceTag/project': project,
          },
        },
      }),
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['appsync:ListGraphqlApis'],
        resources: ['*'],
      }),
    ],
  });

  adminPolicy.attachToRole(adminRole);
  adminPolicy.attachToGroup(adminGroup);

  const lambdaRole = new iam.Role(scope, `Lambda_${project}_${stage}`, {
    assumedBy: new iam.ServicePrincipal('appsync.amazonaws.com'),
  });

  lambdaRole.addManagedPolicy(
    iam.ManagedPolicy.fromAwsManagedPolicyName('AWSLambda_FullAccess'),
  );

  const sessionTable = new dynamodb.Table(
    scope,
    `SessionsTable_${project}_${stage}`,
    {
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    },
  );

  const commonLambdaProps: CommonLambdaProps = {
    runtime: lambda.Runtime.NODEJS_14_X,
    // not supported by us-west-1 yet
    // architecture: lambda.Architecture.ARM_64,
    code: lambda.Code.fromAsset('dist/functions'),
    environment: {
      SESSION_TABLE: sessionTable.tableName,
      STAGE: stage,
    },
  };

  const commonDataSourceProps: CommonDataSourceProps = {
    apiId: api.attrApiId,
    type: 'AWS_LAMBDA',
    serviceRoleArn: lambdaRole.roleArn,
  };

  return {
    project,
    stage,
    commonLambdaProps,
    commonDataSourceProps,
    sessionTable,
    api,
  };
};
