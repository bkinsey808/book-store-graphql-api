import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

import { CommonDataSourceProps, CommonLambdaProps, Stage } from '../helpers';

/** create session endpoint */
export const deleteSessionResources = ({
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
  const deleteSessionLambda = new lambda.Function(
    scope,
    `DeleteSessionHandler_${project}_${stage}`,
    {
      ...commonLambdaProps,
      handler: 'deleteSession.handler',
    },
  );

  sessionTable.grantReadWriteData(deleteSessionLambda);

  const deleteSessionDataSource = new appsync.CfnDataSource(
    scope,
    `DeleteSessionDataSource_${project}_${stage}`,
    {
      ...commonDataSourceProps,
      name: `DeleteSessionDataSource_${project}_${stage}`,
      lambdaConfig: {
        lambdaFunctionArn: deleteSessionLambda.functionArn,
      },
    },
  );

  if (deployResolvers) {
    const deleteSessionResolver = new appsync.CfnResolver(
      scope,
      `DeleteSessionResolver_${project}_${stage}`,
      {
        apiId: api.attrApiId,
        typeName: 'Mutation',
        fieldName: 'deleteSession',
        dataSourceName: deleteSessionDataSource.name,
      },
    );
  }
};
