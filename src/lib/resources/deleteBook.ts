import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

import { CommonDataSourceProps, CommonLambdaProps, Stage } from '../helpers';

/** create book endpoint */
export const deleteBookResources = ({
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
  const deleteBookLambda = new lambda.Function(
    scope,
    `DeleteBookHandler_${project}_${stage}`,
    {
      ...commonLambdaProps,
      handler: 'deleteBook.handler',
    },
  );

  booksTable.grantReadWriteData(deleteBookLambda);

  const deleteBookDataSource = new appsync.CfnDataSource(
    scope,
    `DeleteBookDataSource_${project}_${stage}`,
    {
      ...commonDataSourceProps,
      name: `DeleteBookDataSource_${project}_${stage}`,
      lambdaConfig: {
        lambdaFunctionArn: deleteBookLambda.functionArn,
      },
    },
  );

  if (deployResolvers) {
    const deleteBookResolver = new appsync.CfnResolver(
      scope,
      `DeleteBookResolver_${project}_${stage}`,
      {
        apiId: api.attrApiId,
        typeName: 'Mutation',
        fieldName: 'deleteBook',
        dataSourceName: deleteBookDataSource.name,
      },
    );
  }
};
