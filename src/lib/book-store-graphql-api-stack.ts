import { readFileSync } from 'fs';
import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

import * as nodejsLambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';

export class BookStoreGraphqlApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // common stuff not related to particular endpoints

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

    const lambdaRole = new iam.Role(this, 'LambdaRole', {
      assumedBy: new iam.ServicePrincipal('appsync.amazonaws.com'),
    });

    lambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AWSLambda_FullAccess'),
    );

    const booksTable = new dynamodb.Table(this, 'BooksTable', {
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const commonLambdaProps: Omit<lambda.FunctionProps, 'handler'> = {
      runtime: lambda.Runtime.NODEJS_14_X,
      // not supported by us-west-1 yet
      // architecture: lambda.Architecture.ARM_64,
      code: lambda.Code.fromAsset('dist/functions'),
      environment: {
        BOOKS_TABLE: booksTable.tableName,
      },
    };

    const commonDataSourceProps: Omit<appsync.CfnDataSourceProps, 'name'> = {
      apiId: api.attrApiId,
      type: 'AWS_LAMBDA',
      serviceRoleArn: lambdaRole.roleArn,
    };

    // list books endpoint

    const listBooksLambda = new lambda.Function(this, 'ListBooksHandler', {
      ...commonLambdaProps,
      handler: 'listBooks.handler',
    });

    booksTable.grantReadData(listBooksLambda);

    const listBooksDataSource = new appsync.CfnDataSource(
      this,
      'ListBooksDataSource',
      {
        ...commonDataSourceProps,
        name: 'ListBooksDataSource',
        lambdaConfig: {
          lambdaFunctionArn: listBooksLambda.functionArn,
        },
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

    // get book by id endpoint

    const getBookByIdLambda = new lambda.Function(this, 'GetBookByIdHandler', {
      ...commonLambdaProps,
      handler: 'getBookById.handler',
    });

    booksTable.grantReadData(getBookByIdLambda);

    const getBookByIdDataSource = new appsync.CfnDataSource(
      this,
      'GetBookByIdDataSource',
      {
        ...commonDataSourceProps,
        name: 'GetBookByIdDataSource',
        lambdaConfig: {
          lambdaFunctionArn: getBookByIdLambda.functionArn,
        },
      },
    );

    const getBookByIdResolver = new appsync.CfnResolver(
      this,
      'GetBookByIdResolver',
      {
        apiId: api.attrApiId,
        typeName: 'Query',
        fieldName: 'getBookById',
        dataSourceName: getBookByIdDataSource.name,
      },
    );

    // create book endpoint

    const createBookLambda = new lambda.Function(this, 'CreateBookHandler', {
      ...commonLambdaProps,
      handler: 'createBook.handler',
    });

    booksTable.grantReadWriteData(createBookLambda);

    const createBookDataSource = new appsync.CfnDataSource(
      this,
      'CreateBookDataSource',
      {
        ...commonDataSourceProps,
        name: 'CreateBookDataSource',
        lambdaConfig: {
          lambdaFunctionArn: createBookLambda.functionArn,
        },
      },
    );

    const createBookResolver = new appsync.CfnResolver(
      this,
      'CreateBookResolver',
      {
        apiId: api.attrApiId,
        typeName: 'Mutation',
        fieldName: 'createBook',
        dataSourceName: createBookDataSource.name,
      },
    );

    // update book endpoint

    const updateBookLambda = new nodejsLambda.NodejsFunction(
      this,
      'UpdateBookHandler',
      {
        ...commonLambdaProps,
        handler: 'handler',
        entry: path.join(__dirname, '../functions/updateBook.ts'),
      },
    );

    booksTable.grantReadWriteData(updateBookLambda);

    const updateBookDataSource = new appsync.CfnDataSource(
      this,
      'UpdateBookDataSource',
      {
        ...commonDataSourceProps,
        name: 'UpdateBookDataSource',
        lambdaConfig: {
          lambdaFunctionArn: updateBookLambda.functionArn,
        },
      },
    );

    const updateBookResolver = new appsync.CfnResolver(
      this,
      'UpdateBookResolver',
      {
        apiId: api.attrApiId,
        typeName: 'Mutation',
        fieldName: 'updateBook',
        dataSourceName: updateBookDataSource.name,
      },
    );
  }
}
