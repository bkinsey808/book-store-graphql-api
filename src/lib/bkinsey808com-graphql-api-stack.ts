import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';

import { SessionStoreGraphqlApiStackContext } from './helpers';
import { commonResources } from './resources/common';
import { listSessionsResources } from './resources/listSessions';
import { getSessionByIdResources } from './resources/getSessionById';
import { createSessionResources } from './resources/createSession';
import { updateSessionResources } from './resources/updateSession';
import { deleteSessionResources } from './resources/deleteSession';
import { authResources } from './resources/auth';

export class SessionStoreGraphqlApiStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: cdk.StackProps,
    context: SessionStoreGraphqlApiStackContext,
  ) {
    super(scope, id, props);

    const deployResolvers = context.deployResolvers;

    // applies a new tag to the given construct and all of its children.
    cdk.Tags.of(this).add('stage', context.stage);
    cdk.Tags.of(this).add('project', context.project);

    const {
      stage,
      project,
      commonLambdaProps,
      commonDataSourceProps,
      sessionTable,
      api,
    } = commonResources({
      scope: this,
      context,
    });

    listSessionsResources({
      scope: this,
      project,
      stage,
      commonLambdaProps,
      commonDataSourceProps,
      sessionTable,
      api,
      deployResolvers,
    });

    getSessionByIdResources({
      scope: this,
      project,
      stage,
      commonLambdaProps,
      commonDataSourceProps,
      sessionTable,
      api,
      deployResolvers,
    });

    authResources({
      scope: this,
      project,
      stage,
      commonLambdaProps,
      commonDataSourceProps,
      sessionTable,
      api,
      deployResolvers,
    });

    createSessionResources({
      scope: this,
      project,
      stage,
      commonLambdaProps,
      commonDataSourceProps,
      sessionTable,
      api,
      deployResolvers,
    });

    updateSessionResources({
      scope: this,
      project,
      stage,
      commonLambdaProps,
      commonDataSourceProps,
      sessionTable,
      api,
      deployResolvers,
    });

    deleteSessionResources({
      scope: this,
      project,
      stage,
      commonLambdaProps,
      commonDataSourceProps,
      sessionTable,
      api,
      deployResolvers,
    });
  }
}
