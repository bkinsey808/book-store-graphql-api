import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as appsync from 'aws-cdk-lib/aws-appsync';

export enum Stage {
  DEV = 'develop',
  PROD = 'production',
}

export interface BookStoreGraphqlApiStackContext {
  stage: Stage;
  project: string;
  deployResolvers: boolean;
}

export type CommonLambdaProps = Omit<lambda.FunctionProps, 'handler'>;

export type CommonDataSourceProps = Omit<appsync.CfnDataSourceProps, 'name'>;
