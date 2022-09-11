import { readFileSync } from 'fs';
import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';

export class BookStoreGraphqlApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const api = new appsync.CfnGraphQLApi(this, 'BookApi', {
      name: 'book-api',
      authenticationType: 'API_KEY',
    });

    const schema = new appsync.CfnGraphQLSchema(this, 'BookSchema', {
      apiId: api.attrApiId,
      definition: readFileSync('./graphql/schema.graphql', 'utf8'),
    });

    const apiKey = new appsync.CfnApiKey(this, 'BookApiKey', {
      apiId: api.attrApiId,
      description: 'API key for book-api',
      // 365 days seems to be the limit imposed by AWS for API keys.
      // One possible workaround is to have the lambda function handle authentication
      expires: cdk.Expiration.after(cdk.Duration.days(365)).toEpoch(),
    });

    const listBooksLambda = new lambda.Function(this, 'ListBooksHandler', {
      code: lambda.Code.fromAsset('dist/functions'),
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'listBooks.handler',
    });

    const lambdaRole = new iam.Role(this, 'LambdaRole', {
      assumedBy: new iam.ServicePrincipal('appsync.amazonaws.com'),
    });

    lambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AWSLambda_FullAccess'),
    );

    const listBooksDataSource = new appsync.CfnDataSource(
      this,
      'ListBooksDataSource',
      {
        apiId: api.attrApiId,
        name: 'ListBooksDataSource',
        type: 'AWS_LAMBDA',
        lambdaConfig: {
          lambdaFunctionArn: listBooksLambda.functionArn,
        },
        serviceRoleArn: lambdaRole.roleArn,
      },
    );

    const listBooksResolver = new appsync.CfnResolver(
      this,
      'ListBooksResolver',
      {
        apiId: api.attrApiId,
        typeName: 'Query',
        fieldName: 'listBooks',
        dataSourceName: listBooksDataSource.name,
      },
    );
  }
}
