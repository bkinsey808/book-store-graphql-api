import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';

import { BookStoreGraphqlApiStackContext } from './helpers';
import { commonResources } from './resources/common';
import { listBooksResources } from './resources/listBooks';
import { getBookByIdResources } from './resources/getBookById';
import { createBookResources } from './resources/createBook';
import { updateBookResources } from './resources/updateBook';
import { deleteBookResources } from './resources/deleteBook';

export class BookStoreGraphqlApiStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: cdk.StackProps,
    context: BookStoreGraphqlApiStackContext,
  ) {
    super(scope, id, props);

    const deployResolvers = context.deployResolvers;

    const { stage, commonLambdaProps, commonDataSourceProps, booksTable, api } =
      commonResources({
        scope: this,
        context,
      });

    listBooksResources({
      scope: this,
      stage,
      commonLambdaProps,
      commonDataSourceProps,
      booksTable,
      api,
      deployResolvers,
    });

    getBookByIdResources({
      scope: this,
      stage,
      commonLambdaProps,
      commonDataSourceProps,
      booksTable,
      api,
      deployResolvers,
    });

    createBookResources({
      scope: this,
      stage,
      commonLambdaProps,
      commonDataSourceProps,
      booksTable,
      api,
      deployResolvers,
    });

    updateBookResources({
      scope: this,
      stage,
      commonLambdaProps,
      commonDataSourceProps,
      booksTable,
      api,
      deployResolvers,
    });

    deleteBookResources({
      scope: this,
      stage,
      commonLambdaProps,
      commonDataSourceProps,
      booksTable,
      api,
      deployResolvers,
    });
  }
}
