import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as nodejsLambda from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import * as path from 'path';

import { CommonDataSourceProps, CommonLambdaProps, Stage } from '../helpers';

/** create book endpoint */
export const updateBookResources = ({
  scope,
  stage,
  commonLambdaProps,
  commonDataSourceProps,
  booksTable,
  api,
  deployResolvers,
}: {
  scope: Construct;
  stage: Stage;
  commonLambdaProps: CommonLambdaProps;
  commonDataSourceProps: CommonDataSourceProps;
  booksTable: dynamodb.Table;
  api: appsync.CfnGraphQLApi;
  deployResolvers: boolean;
}) => {
  const updateBookLambda = new nodejsLambda.NodejsFunction(
    scope,
    `UpdateBookHandler_${stage}`,
    {
      ...commonLambdaProps,
      handler: 'handler',
      entry: path.join(__dirname, '../../functions/updateBook.ts'),
    },
  );

  booksTable.grantReadWriteData(updateBookLambda);

  const updateBookDataSource = new appsync.CfnDataSource(
    scope,
    `UpdateBookDataSource_${stage}`,
    {
      ...commonDataSourceProps,
      name: `UpdateBookDataSource_${stage}`,
      lambdaConfig: {
        lambdaFunctionArn: updateBookLambda.functionArn,
      },
    },
  );

  if (deployResolvers) {
    const updateBookResolver = new appsync.CfnResolver(
      scope,
      `UpdateBookResolver_${stage}`,
      {
        apiId: api.attrApiId,
        typeName: 'Mutation',
        fieldName: 'updateBook',
        dataSourceName: updateBookDataSource.name,
      },
    );
  }
};
