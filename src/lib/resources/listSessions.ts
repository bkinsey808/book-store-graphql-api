import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

import { CommonDataSourceProps, CommonLambdaProps, Stage } from '../helpers';

/** list sessions endpoint */
export const listSessionsResources = ({
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
  const listSessionsLambda = new lambda.Function(
    scope,
    `ListSessionsHandler_${project}_${stage}`,
    {
      ...commonLambdaProps,
      handler: 'listSessions.handler',
    },
  );

  sessionTable.grantReadData(listSessionsLambda);

  const listSessionsDataSource = new appsync.CfnDataSource(
    scope,
    `ListSessionsDataSource_${project}_${stage}`,
    {
      ...commonDataSourceProps,
      name: `ListSessionsDataSource_${project}_${stage}`,
      lambdaConfig: {
        lambdaFunctionArn: listSessionsLambda.functionArn,
      },
    },
  );

  if (deployResolvers) {
    const listSessionsResolver = new appsync.CfnResolver(
      scope,
      `ListSessionsResolver_${project}_${stage}`,
      {
        apiId: api.attrApiId,
        typeName: 'Query',
        fieldName: 'listSessions',
        dataSourceName: listSessionsDataSource.name,
      },
    );
  }
};
