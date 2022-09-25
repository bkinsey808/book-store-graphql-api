import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as nodejsLambda from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import * as path from 'path';

import { CommonDataSourceProps, CommonLambdaProps, Stage } from '../helpers';

/** create session endpoint */
export const updateSessionResources = ({
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
  const updateSessionLambda = new nodejsLambda.NodejsFunction(
    scope,
    `UpdateSessionHandler_${project}_${stage}`,
    {
      ...commonLambdaProps,
      handler: 'handler',
      entry: path.join(__dirname, '../../functions/updateSession.ts'),
    },
  );

  sessionTable.grantReadWriteData(updateSessionLambda);

  const updateSessionDataSource = new appsync.CfnDataSource(
    scope,
    `UpdateSessionDataSource_${project}_${stage}`,
    {
      ...commonDataSourceProps,
      name: `UpdateSessionDataSource_${project}_${stage}`,
      lambdaConfig: {
        lambdaFunctionArn: updateSessionLambda.functionArn,
      },
    },
  );

  if (deployResolvers) {
    const updateSessionResolver = new appsync.CfnResolver(
      scope,
      `UpdateSessionResolver_${project}_${stage}`,
      {
        apiId: api.attrApiId,
        typeName: 'Mutation',
        fieldName: 'updateSession',
        dataSourceName: updateSessionDataSource.name,
      },
    );
  }
};
