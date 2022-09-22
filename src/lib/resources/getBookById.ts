import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

import { CommonDataSourceProps, CommonLambdaProps, Stage } from '../helpers';

/** get book by id endpoint */
export const getBookByIdResources = ({
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
  const getBookByIdLambda = new lambda.Function(
    scope,
    `GetBookByIdHandler_${project}_${stage}`,
    {
      ...commonLambdaProps,
      handler: 'getBookById.handler',
    },
  );

  booksTable.grantReadData(getBookByIdLambda);

  const getBookByIdDataSource = new appsync.CfnDataSource(
    scope,
    `GetBookByIdDataSource_${project}_${stage}`,
    {
      ...commonDataSourceProps,
      name: `GetBookByIdDataSource_${project}_${stage}`,
      lambdaConfig: {
        lambdaFunctionArn: getBookByIdLambda.functionArn,
      },
    },
  );

  if (deployResolvers) {
    const getBookByIdResolver = new appsync.CfnResolver(
      scope,
      `GetBookByIdResolver_${project}_${stage}`,
      {
        apiId: api.attrApiId,
        typeName: 'Query',
        fieldName: 'getBookById',
        dataSourceName: getBookByIdDataSource.name,
      },
    );
  }
};
