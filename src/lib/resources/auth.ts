import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as nodejsLambda from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import * as path from 'path';

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
  const authLambda = new nodejsLambda.NodejsFunction(
    scope,
    `AuthHandler_${project}_${stage}`,
    {
      ...commonLambdaProps,
      handler: 'handler',
      entry: path.join(__dirname, '../../functions/auth.ts'),
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
