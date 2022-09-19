import { readFileSync } from 'fs';
import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as nodejsLambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';

import { BookStoreGraphqlApiStackContext } from './helpers';

// for a reason I don't understand sometimes I have to do a first pass with this as false, then a second pass with it as true

export class BookStoreGraphqlApiStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: cdk.StackProps,
    context: BookStoreGraphqlApiStackContext,
  ) {
    super(scope, id, props);

    const constructStack = async () => {
      // common stuff not related to particular endpoints

      const stage = context.stage;
      const deployResolvers = context.deployResolvers;

      const api = new appsync.CfnGraphQLApi(this, `BookApi_${stage}`, {
        name: `book-api_${stage}`,
        authenticationType: 'API_KEY',
      });

      const schema = new appsync.CfnGraphQLSchema(this, `BookSchema_${stage}`, {
        apiId: api.attrApiId,
        definition: readFileSync('./graphql/schema.graphql', 'utf8'),
      });

      const apiKey = new appsync.CfnApiKey(this, `BookApiKey_${stage}`, {
        apiId: api.attrApiId,
        description: `API key for book-api (${stage})`,
        // 365 days seems to be the limit imposed by AWS for API keys.
        // One possible workaround is to have the lambda function handle authentication
        expires: cdk.Expiration.after(cdk.Duration.days(365)).toEpoch(),
      });

      const lambdaRole = new iam.Role(this, `LambdaRole_${stage}`, {
        assumedBy: new iam.ServicePrincipal('appsync.amazonaws.com'),
      });

      lambdaRole.addManagedPolicy(
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSLambda_FullAccess'),
      );

      const booksTable = new dynamodb.Table(this, `BooksTable_${stage}`, {
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
          STAGE: stage,
        },
      };

      const commonDataSourceProps: Omit<appsync.CfnDataSourceProps, 'name'> = {
        apiId: api.attrApiId,
        type: 'AWS_LAMBDA',
        serviceRoleArn: lambdaRole.roleArn,
      };

      // list books endpoint

      const listBooksLambda = new lambda.Function(
        this,
        `ListBooksHandler_${stage}`,
        {
          ...commonLambdaProps,
          handler: 'listBooks.handler',
        },
      );

      booksTable.grantReadData(listBooksLambda);

      const listBooksDataSource = new appsync.CfnDataSource(
        this,
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
          this,
          `ListBooksResolver_${stage}`,
          {
            apiId: api.attrApiId,
            typeName: 'Query',
            fieldName: 'listBooks',
            dataSourceName: listBooksDataSource.name,
          },
        );
      }

      // get book by id endpoint

      const getBookByIdLambda = new lambda.Function(
        this,
        `GetBookByIdHandler_${stage}`,
        {
          ...commonLambdaProps,
          handler: 'getBookById.handler',
        },
      );

      booksTable.grantReadData(getBookByIdLambda);

      const getBookByIdDataSource = new appsync.CfnDataSource(
        this,
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
          this,
          `GetBookByIdResolver_${stage}`,
          {
            apiId: api.attrApiId,
            typeName: 'Query',
            fieldName: 'getBookById',
            dataSourceName: getBookByIdDataSource.name,
          },
        );
      }

      // create book endpoint

      const createBookLambda = new lambda.Function(
        this,
        `CreateBookHandler_${stage}`,
        {
          ...commonLambdaProps,
          handler: 'createBook.handler',
        },
      );

      booksTable.grantReadWriteData(createBookLambda);

      const createBookDataSource = new appsync.CfnDataSource(
        this,
        `CreateBookDataSource_${stage}`,
        {
          ...commonDataSourceProps,
          name: `CreateBookDataSource_${stage}`,
          lambdaConfig: {
            lambdaFunctionArn: createBookLambda.functionArn,
          },
        },
      );

      if (deployResolvers) {
        const createBookResolver = new appsync.CfnResolver(
          this,
          `CreateBookResolver_${stage}`,
          {
            apiId: api.attrApiId,
            typeName: 'Mutation',
            fieldName: 'createBook',
            dataSourceName: createBookDataSource.name,
          },
        );
      }

      // update book endpoint

      const updateBookLambda = new nodejsLambda.NodejsFunction(
        this,
        `UpdateBookHandler_${stage}`,
        {
          ...commonLambdaProps,
          handler: 'handler',
          entry: path.join(__dirname, '../functions/updateBook.ts'),
        },
      );

      booksTable.grantReadWriteData(updateBookLambda);

      const updateBookDataSource = new appsync.CfnDataSource(
        this,
        `UpdateBookDataSource_${stage}`,
        {
          ...commonDataSourceProps,
          name: `UpdateBookDataSource_${stage}`,
          lambdaConfig: {
            lambdaFunctionArn: updateBookLambda.functionArn,
          },
        },
      );

      await new Promise((resolve) => setTimeout(resolve, 10000));

      if (deployResolvers) {
        const updateBookResolver = new appsync.CfnResolver(
          this,
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
    constructStack();
  }
}
