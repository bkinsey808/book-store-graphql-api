import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

import { CommonDataSourceProps, CommonLambdaProps, Stage } from '../helpers';

/** get session by id endpoint */
export const getSessionByIdResources = ({
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
  const getSessionByIdLambda = new lambda.Function(
    scope,
    `GetSessionByIdHandler_${project}_${stage}`,
    {
      ...commonLambdaProps,
      handler: 'getSessionById.handler',
    },
  );

  sessionTable.grantReadData(getSessionByIdLambda);

  const getSessionByIdDataSource = new appsync.CfnDataSource(
    scope,
    `GetSessionByIdDataSource_${project}_${stage}`,
    {
      ...commonDataSourceProps,
      name: `GetSessionByIdDataSource_${project}_${stage}`,
      lambdaConfig: {
        lambdaFunctionArn: getSessionByIdLambda.functionArn,
      },
    },
  );

  if (deployResolvers) {
    const getSessionByIdResolver = new appsync.CfnResolver(
      scope,
      `GetSessionByIdResolver_${project}_${stage}`,
      {
        apiId: api.attrApiId,
        typeName: 'Query',
        fieldName: 'getSessionById',
        dataSourceName: getSessionByIdDataSource.name,
      },
    );
  }
};
