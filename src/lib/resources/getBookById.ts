import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

import { CommonDataSourceProps, CommonLambdaProps, Stage } from '../helpers';

/** get book by id endpoint */
export const getBookByIdResources = ({
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
  const getBookByIdLambda = new lambda.Function(
    scope,
    `GetBookByIdHandler_${stage}`,
    {
      ...commonLambdaProps,
      handler: 'getBookById.handler',
    },
  );

  booksTable.grantReadData(getBookByIdLambda);

  const getBookByIdDataSource = new appsync.CfnDataSource(
    scope,
    `GetBookByIdDataSource_${stage}`,
    {
      ...commonDataSourceProps,
      name: `GetBookByIdDataSource_${stage}`,
      lambdaConfig: {
        lambdaFunctionArn: getBookByIdLambda.functionArn,
      },
    },
  );

  if (deployResolvers) {
    const getBookByIdResolver = new appsync.CfnResolver(
      scope,
      `GetBookByIdResolver_${stage}`,
      {
        apiId: api.attrApiId,
        typeName: 'Query',
        fieldName: 'getBookById',
        dataSourceName: getBookByIdDataSource.name,
      },
    );
  }
};
