import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

import { CommonDataSourceProps, CommonLambdaProps, Stage } from '../helpers';

/** create session endpoint */
export const createSessionResources = ({
  scope,
  project,
  stage,
  commonLambdaProps,
  commonDataSourceProps,
  sessionTable,
  api,
  deployResolvers,
}: {
  scope: Construct;
  project: string;
  stage: Stage;
  commonLambdaProps: CommonLambdaProps;
  commonDataSourceProps: CommonDataSourceProps;
  sessionTable: dynamodb.Table;
  api: appsync.CfnGraphQLApi;
  deployResolvers: boolean;
}) => {
  const createSessionLambda = new lambda.Function(
    scope,
    `CreateSessionHandler_${project}_${stage}`,
    {
      ...commonLambdaProps,
      handler: 'createSession.handler',
    },
  );

  sessionTable.grantReadWriteData(createSessionLambda);

  const createSessionDataSource = new appsync.CfnDataSource(
    scope,
    `CreateSessionDataSource_${project}_${stage}`,
    {
      ...commonDataSourceProps,
      name: `CreateSessionDataSource_${project}_${stage}`,
      lambdaConfig: {
        lambdaFunctionArn: createSessionLambda.functionArn,
      },
    },
  );

  if (deployResolvers) {
    const createSessionResolver = new appsync.CfnResolver(
      scope,
      `CreateSessionResolver_${project}_${stage}`,
      {
        apiId: api.attrApiId,
        typeName: 'Mutation',
        fieldName: 'createSession',
        dataSourceName: createSessionDataSource.name,
      },
    );
  }
};
