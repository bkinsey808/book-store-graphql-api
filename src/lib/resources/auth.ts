import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

import { CommonDataSourceProps, CommonLambdaProps, Stage } from '../helpers';

/** create session endpoint */
export const authResources = ({
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
  const authLambda = new lambda.Function(
    scope,
    `AuthHandler_${project}_${stage}`,
    {
      ...commonLambdaProps,
      handler: 'auth.handler',
    },
  );

  sessionTable.grantReadWriteData(authLambda);

  const authDataSource = new appsync.CfnDataSource(
    scope,
    `AuthDataSource_${project}_${stage}`,
    {
      ...commonDataSourceProps,
      name: `AuthDataSource_${project}_${stage}`,
      lambdaConfig: {
        lambdaFunctionArn: authLambda.functionArn,
      },
    },
  );

  if (deployResolvers) {
    const authResolver = new appsync.CfnResolver(
      scope,
      `AuthResolver_${project}_${stage}`,
      {
        apiId: api.attrApiId,
        typeName: 'Mutation',
        fieldName: 'auth',
        dataSourceName: authDataSource.name,
      },
    );
  }
};
