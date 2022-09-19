export enum Stage {
  DEV = 'develop',
  PROD = 'production',
}

export interface BookStoreGraphqlApiStackContext {
  stage: Stage;
  deployResolvers: boolean;
}
