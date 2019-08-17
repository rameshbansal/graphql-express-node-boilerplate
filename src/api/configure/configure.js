import { each } from 'lodash';
import { accessControl } from './accessControl';
import mongooseModel from './mongoose.model';
import API_STORE from './api.store';
import graphqlHTTP from 'express-graphql';
import getFieldNames from './getGQLFieldsList';
import { generateSchemaGQL, generateSchemaGQLInput } from './generateSchemaGQL';
import { GraphQLSchema, GraphQLObjectType, GraphQLList, GraphQLString, GraphQLNonNull, GraphQLInputObjectType, GraphQLInt } from 'graphql';
import { GraphQLJSONObject } from './deatultGQLTypes';
import { create, update, remove } from '../services/daffodil.services/daffo.service';
// import { update } from '../services/daffodil.services/daffo.controller';

const service = require('../services/daffodil.services/daffo.service');

const APIError = require('../utils/APIError');

const httpStatus = require('http-status');

const { graphAuthorize } = require('../middlewares/auth');


const removeResp = new GraphQLObjectType({ name: 'remove', fields: { ok: { type: GraphQLInt }, n: { type: GraphQLInt } } });

const configure = ({
  fields, grantList, roles, hooks = {}, methods = {}, actions = {}, app,
}) => {
  accessControl.addGrantList(grantList);


  let QueriesTypes = {};
  const typeQueryDefs = { Query: {}, Mutation: {} };
  const typeMutationDefs = 'type Mutation {';


  each(Object.keys(fields), (collection) => {
    console.log('collection', collection);
    QueriesTypes = generateSchemaGQL(fields[collection], collection, fields);
    typeQueryDefs.Mutation[collection] = generateSchemaGQLInput(fields[collection], collection, fields);
    typeQueryDefs.Query[collection] = QueriesTypes;
    mongooseModel.addCollection(collection, fields[collection], hooks[collection], methods[collection]);
    accessControl.addFields(fields[collection], collection);
  });
  const queryType = new GraphQLObjectType({
    name: 'Query',
    fields: () => {
      const queryfields = {};
      Object.keys(typeQueryDefs.Query).map((typedefName) => {
        queryfields[`${typedefName}Any`] = {
          type: new GraphQLList(typeQueryDefs.Query[typedefName]),
          args: {
            filter: { type: GraphQLJSONObject },
            perPage: { type: new GraphQLNonNull(GraphQLInt) },
            page: { type: GraphQLInt },
            sort: { type: GraphQLJSONObject },

          },
          resolve: (accessType => (root, args, context, ast) => {
          // const filter = JSON.parse(args.filter);
            const access = accessControl.verify({
              user: context.user, accessType, table: typedefName,
            });
            if (!access.allowed) {
              const apiError = new APIError({
                message: 'Unauthorized',
                status: httpStatus.UNAUTHORIZED,
                stack: undefined,
              });
              throw new Error(apiError);
            }
            console.log('access', access);
            console.log('args--->>>>>>>>111', root, args, context.user);
            const requiredFields = getFieldNames(ast);
            console.log('fields--->>>>>>>>', fields);
            const data = mongooseModel.queryMakerAndValidator({ access, user: context.user, reqParams: { ...args, fields: requiredFields } });
            console.log('dataVVVV', data);
            return mongooseModel.getCollection([typedefName]).get(data);
            // return data;
          })('read_any'),
        };
        queryfields[`${typedefName}Own`] = {
          type: new GraphQLList(typeQueryDefs.Query[typedefName]),
          args: {
            filter: { type: GraphQLJSONObject },
            limit: { type: new GraphQLNonNull(GraphQLInt) },
            skip: { type: GraphQLInt },
            sort: { type: GraphQLJSONObject },
          },
          resolve: (accessType => (root, args, context, ast) => {
          // const filter = JSON.parse(args.filter);
            const access = accessControl.verify({
              user: context.user, accessType, table: typedefName,
            });
            if (!access.allowed) {
              const apiError = new APIError({
                message: 'Unauthorized',
                status: httpStatus.UNAUTHORIZED,
                stack: undefined,
              });
              throw new Error(apiError);
            }
            console.log('access', access);
            console.log('args--->>>>>>>>111', root, args, context.user);
            const requiredFields = getFieldNames(ast);
            console.log('fields--->>>>>>>>', fields);
            const data = mongooseModel.queryMakerAndValidator({ access, user: context.user, reqParams: { ...args, fields: requiredFields } });
            console.log('dataVVVV', data);
            return mongooseModel.getCollection([typedefName]).get(data);
            // return data;
          })('read_own'),
        };
      });
      return queryfields;
    },
  });

  console.log('typeQueryDefs.Mutation', typeQueryDefs.Mutation);

  const mutationType = new GraphQLObjectType({
    name: 'Mutation',
    fields: () => {
      const queryfields = {};
      Object.keys(typeQueryDefs.Query).map((typedefName) => {
        console.log('typeQueryDefs.Mutation[typedefName]', typeQueryDefs.Mutation[typedefName]);
        queryfields[`${typedefName}Create`] = {
          type: typeQueryDefs.Query[typedefName],
          args: typeQueryDefs.Mutation[typedefName],
          resolve: (accessType => async (root, args, context, ast) => {
          // const filter = JSON.parse(args.filter);
            const access = accessControl.verify({
              user: context.user, accessType, table: typedefName,
            });
            if (!access.allowed) {
              const apiError = new APIError({
                message: 'Unauthorized',
                status: httpStatus.UNAUTHORIZED,
                stack: undefined,
              });
              throw new Error(apiError);
            }
            console.log('access', access);
            console.log('args--->>>>>>>>111', root, args, context.user);
            const requiredFields = getFieldNames(ast);
            console.log('fields--->>>>>>>>', fields);
            const data = await create({
              access, user: context.user, body: args, params: { fields: requiredFields, collection: typedefName },
            });
            return data;
          })('create_own'),
        };
        queryfields[`${typedefName}UpdateAny`] = {
          type: typeQueryDefs.Query[typedefName],
          args: {
            filter: { type: GraphQLJSONObject },
            setter: { type: GraphQLJSONObject },
          },
          resolve: (accessType => async (root, args, context, ast) => {
          // const filter = JSON.parse(args.filter);
            const access = accessControl.verify({
              user: context.user, accessType, table: typedefName,
            });
            console.log('access', access, context.user);
            if (!access.allowed) {
              const apiError = new APIError({
                message: 'Unauthorized',
                status: httpStatus.UNAUTHORIZED,
                stack: undefined,
              });
              throw new Error(apiError);
            }
            console.log('access', access);
            console.log('args--->>>>>>>>111', root, args, context.user);
            const requiredFields = getFieldNames(ast);
            console.log('fields--->>>>>>>>', fields);
            const data = await update({
              access, user: context.user, body: args, params: { fields: requiredFields, collection: typedefName },
            });
            return data;
          })('update_any'),
        };
        queryfields[`${typedefName}UpdateOwn`] = {
          type: typeQueryDefs.Query[typedefName],
          args: {
            filter: { type: GraphQLJSONObject },
            setter: { type: GraphQLJSONObject },
          },
          resolve: (accessType => async (root, args, context, ast) => {
          // const filter = JSON.parse(args.filter);
            const access = accessControl.verify({
              user: context.user, accessType, table: typedefName,
            });
            console.log('access', access, context.user);
            if (!access.allowed) {
              const apiError = new APIError({
                message: 'Unauthorized',
                status: httpStatus.UNAUTHORIZED,
                stack: undefined,
              });
              throw new Error(apiError);
            }
            console.log('access', access);
            console.log('args--->>>>>>>>111', root, args, context.user);
            const requiredFields = getFieldNames(ast);
            console.log('fields--->>>>>>>>', fields);
            const data = await update({
              access, user: context.user, body: args, params: { fields: requiredFields, collection: typedefName },
            });
            return data;
          })('update_own'),
        };
        queryfields[`${typedefName}RemoveOwn`] = {
          type: GraphQLJSONObject,
          args: {
            filter: { type: GraphQLJSONObject },
          },
          resolve: (accessType => async (root, args, context, ast) => {
          // const filter = JSON.parse(args.filter);
            const access = accessControl.verify({
              user: context.user, accessType, table: typedefName,
            });
            console.log('access', access, context.user);
            if (!access.allowed) {
              const apiError = new APIError({
                message: 'Unauthorized',
                status: httpStatus.UNAUTHORIZED,
                stack: undefined,
              });
              throw new Error(apiError);
            }
            console.log('access', access);
            console.log('args--->>>>>>>>111', root, args, context.user);
            const requiredFields = getFieldNames(ast);
            console.log('fields--->>>>>>>>', fields);
            const data = await remove({
              access, user: context.user, body: args, params: { fields: requiredFields, collection: typedefName },
            });
            return data;
          })('remove_own'),
        };
        queryfields[`${typedefName}RemoveAny`] = {
          type: GraphQLJSONObject,
          args: {
            filter: { type: GraphQLJSONObject },
          },
          resolve: (accessType => async (root, args, context, ast) => {
          // const filter = JSON.parse(args.filter);
            const access = accessControl.verify({
              user: context.user, accessType, table: typedefName,
            });
            console.log('access', access, context.user);
            if (!access.allowed) {
              const apiError = new APIError({
                message: 'Unauthorized',
                status: httpStatus.UNAUTHORIZED,
                stack: undefined,
              });
              throw new Error(apiError);
            }
            console.log('access', access);
            console.log('args--->>>>>>>>111', root, args, context.user);
            const requiredFields = getFieldNames(ast);
            console.log('fields--->>>>>>>>', fields);
            const data = await remove({
              access, user: context.user, body: args, params: { fields: requiredFields, collection: typedefName },
            });
            return data;
          })('remove_any'),
        };
      });
      return queryfields;
    },
  });
  console.log('typeQueryDefs>>>>>', mutationType);


  app.use('/graphql', graphAuthorize(), graphqlHTTP({
    schema: new GraphQLSchema({
      query: queryType,
      mutation: mutationType,
    }),
    graphiql: true, // Set this to false if you don't want graphiql in browser env
    // context: ({ req }) => ({
    //   currentUser: req.user,
    // }),

  }));


  each(Object.keys(actions), (action) => {
    API_STORE.setAction(actions[action], action);
  });
  accessControl.configureAccessControlList();
};


module.exports = configure;
