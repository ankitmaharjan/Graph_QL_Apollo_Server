// src/GraphQL/TypeDef/index.ts

import userType from './userType';
import postType from './postType';
import commentType from './commentType';
import replyType from './replyType';
import { gql } from 'apollo-server-express';

const typeDefs = gql`
  ${userType}
  ${postType}
  ${commentType}
  ${replyType}
`;

export default typeDefs;
