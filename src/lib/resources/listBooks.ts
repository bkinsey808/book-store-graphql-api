import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

import { CommonDataSourceProps, CommonLambdaProps, Stage } from '../helpers';

/** list books endpoint */
export const listBooksResources = ({
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
  const listBooksLambda = new lambda.Function(
    scope,
    `ListBooksHandler_${stage}`,
    {
      ...commonLambdaProps,
      handler: 'listBooks.handler',
    },
  );

  booksTable.grantReadData(listBooksLambda);

  const listBooksDataSource = new appsync.CfnDataSource(
    scope,
    `ListBooksDataSource_${stage}`,
    {
      ...commonDataSourceProps,
      name: `ListBooksDataSource_${stage}`,
      lambdaConfig: {
        lambdaFunctionArn: listBooksLambda.functionArn,
      },
    },
  );

  if (deployResolvers) {
    const listBooksResolver = new appsync.CfnResolver(
      scope,
      `ListBooksResolver_${stage}`,
      {
        apiId: api.attrApiId,
        typeName: 'Query',
        fieldName: 'listBooks',
        dataSourceName: listBooksDataSource.name,
      },
    );
  }
};
