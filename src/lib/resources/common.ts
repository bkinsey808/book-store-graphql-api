import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { readFileSync } from 'fs';

import {
  BookStoreGraphqlApiStackContext,
  CommonDataSourceProps,
  CommonLambdaProps,
} from '../helpers';

export const commonResources = ({
  scope,
  context,
}: {
  scope: Construct;
  context: BookStoreGraphqlApiStackContext;
}) => {
  // common stuff not related to particular endpoints

  const stage = context.stage;

  const api = new appsync.CfnGraphQLApi(scope, `BookApi_${stage}`, {
    name: `book-api-${stage}`,
    authenticationType: 'API_KEY',
  });

  // output the GraphQL URL
  new cdk.CfnOutput(scope, 'GraphQlUrl', {
    value: api.attrGraphQlUrl ?? 'UNDEFINED',
    exportName: 'graphql-url',
  });

  const schema = new appsync.CfnGraphQLSchema(scope, `BookSchema_${stage}`, {
    apiId: api.attrApiId,
    definition: readFileSync('./graphql/schema.graphql', 'utf8'),
  });

  const apiKey = new appsync.CfnApiKey(scope, `BookApiKey_${stage}`, {
    apiId: api.attrApiId,
    description: `API key for book-api-${stage}`,
    // 365 days seems to be the limit imposed by AWS for API keys.
    // One possible workaround is to have the lambda function handle authentication
    expires: cdk.Expiration.after(cdk.Duration.days(365)).toEpoch(),
  });

  // output the API key
  new cdk.CfnOutput(scope, 'ApiKey', {
    value: apiKey.attrApiKey ?? 'UNDEFINED',
    exportName: 'api-key',
  });

  const lambdaRole = new iam.Role(scope, `LambdaRole_${stage}`, {
    assumedBy: new iam.ServicePrincipal('appsync.amazonaws.com'),
  });

  lambdaRole.addManagedPolicy(
    iam.ManagedPolicy.fromAwsManagedPolicyName('AWSLambda_FullAccess'),
  );

  const booksTable = new dynamodb.Table(scope, `BooksTable_${stage}`, {
    partitionKey: {
      name: 'id',
      type: dynamodb.AttributeType.STRING,
    },
    billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    removalPolicy: cdk.RemovalPolicy.DESTROY,
  });

  const commonLambdaProps: CommonLambdaProps = {
    runtime: lambda.Runtime.NODEJS_14_X,
    // not supported by us-west-1 yet
    // architecture: lambda.Architecture.ARM_64,
    code: lambda.Code.fromAsset('dist/functions'),
    environment: {
      BOOKS_TABLE: booksTable.tableName,
      STAGE: stage,
    },
  };

  const commonDataSourceProps: CommonDataSourceProps = {
    apiId: api.attrApiId,
    type: 'AWS_LAMBDA',
    serviceRoleArn: lambdaRole.roleArn,
  };

  return {
    stage,
    commonLambdaProps,
    commonDataSourceProps,
    booksTable,
    api,
  };
};
