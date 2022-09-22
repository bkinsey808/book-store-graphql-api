import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as nodejsLambda from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import * as path from 'path';

import { CommonDataSourceProps, CommonLambdaProps, Stage } from '../helpers';

/** create book endpoint */
export const updateBookResources = ({
  scope,
  project,
  stage,
  commonLambdaProps,
  commonDataSourceProps,
  booksTable,
  api,
  deployResolvers,
}: {
  scope: Construct;
  project: string;
  stage: Stage;
  commonLambdaProps: CommonLambdaProps;
  commonDataSourceProps: CommonDataSourceProps;
  booksTable: dynamodb.Table;
  api: appsync.CfnGraphQLApi;
  deployResolvers: boolean;
}) => {
  const updateBookLambda = new nodejsLambda.NodejsFunction(
    scope,
    `UpdateBookHandler_${project}_${stage}`,
    {
      ...commonLambdaProps,
      handler: 'handler',
      entry: path.join(__dirname, '../../functions/updateBook.ts'),
    },
  );

  booksTable.grantReadWriteData(updateBookLambda);

  const updateBookDataSource = new appsync.CfnDataSource(
    scope,
    `UpdateBookDataSource_${project}_${stage}`,
    {
      ...commonDataSourceProps,
      name: `UpdateBookDataSource_${project}_${stage}`,
      lambdaConfig: {
        lambdaFunctionArn: updateBookLambda.functionArn,
      },
    },
  );

  if (deployResolvers) {
    const updateBookResolver = new appsync.CfnResolver(
      scope,
      `UpdateBookResolver_${project}_${stage}`,
      {
        apiId: api.attrApiId,
        typeName: 'Mutation',
        fieldName: 'updateBook',
        dataSourceName: updateBookDataSource.name,
      },
    );
  }
};
