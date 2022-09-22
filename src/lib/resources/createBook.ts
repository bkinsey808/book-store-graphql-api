import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

import { CommonDataSourceProps, CommonLambdaProps, Stage } from '../helpers';

/** create book endpoint */
export const createBookResources = ({
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
  const createBookLambda = new lambda.Function(
    scope,
    `CreateBookHandler_${project}_${stage}`,
    {
      ...commonLambdaProps,
      handler: 'createBook.handler',
    },
  );

  booksTable.grantReadWriteData(createBookLambda);

  const createBookDataSource = new appsync.CfnDataSource(
    scope,
    `CreateBookDataSource_${project}_${stage}`,
    {
      ...commonDataSourceProps,
      name: `CreateBookDataSource_${project}_${stage}`,
      lambdaConfig: {
        lambdaFunctionArn: createBookLambda.functionArn,
      },
    },
  );

  if (deployResolvers) {
    const createBookResolver = new appsync.CfnResolver(
      scope,
      `CreateBookResolver_${project}_${stage}`,
      {
        apiId: api.attrApiId,
        typeName: 'Mutation',
        fieldName: 'createBook',
        dataSourceName: createBookDataSource.name,
      },
    );
  }
};
