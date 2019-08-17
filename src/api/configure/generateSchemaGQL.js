
import { GraphQLObjectType, GraphQLInt, GraphQLFloat, GraphQLString, GraphQLBoolean, GraphQLID, GraphQLList, GraphQLInputObjectType } from 'graphql';

const { each } = require('lodash');
const { Schema } = require('mongoose');


/**
 * @summary
 * Convert the primitive object Mongoose instance
 * name to the GraphQL type instance.
 */
const convertPrimitiveObjectInstanceToGraphQLType = (instanceName) => {
  console.log('instanceName', instanceName);
  switch (instanceName) {
    case Schema.Types.ObjectId:
      return GraphQLID;
    case String:
    case Schema.Types.Mixed:
      return GraphQLString;
    case Date:
      return GraphQLString;
    case Boolean:
    case Buffer:
      return GraphQLBoolean;
    case Schema.Types.Decimal128:
    case Number:
      return GraphQLInt;
    default:
      throw new Error(`unknown primitive object instance name: "${instanceName}"`);
  }
};

const types = {};
const planeDataTypes = [String, Number, Date, Buffer, Boolean, Schema.Types.Mixed, Schema.Types.ObjectId, Schema.Types.Decimal128];

const getFieldsDefinitions = (model, fields = {}) => {
  const modelTopLevelFields = Object.keys(model);
  const newfields = {};
  each(modelTopLevelFields, (field) => {
    newfields[field] = checkTypes(model[field], field, fields);
  });
  return newfields;
};

const getFieldsDefinitionsForInputTypes = (model, fields = {}) => {
  const modelTopLevelFields = Object.keys(model);
  const newfields = {};
  each(modelTopLevelFields, (field) => {
    newfields[field] = checkTypesForInputTypes(model[field], field, fields);
  });
  return newfields;
};

const checkTypesForInputTypes = (definition, field, fields, list) => {
  let newfields = {};
  if (planeDataTypes.includes(definition.type) || planeDataTypes.includes(definition)) {
    if (definition.type && definition.ref) {
      newfields = { type: convertPrimitiveObjectInstanceToGraphQLType(definition.type || definition) };
      // newfields = { type: types[definition.ref] };
    } else {
      newfields = { type: convertPrimitiveObjectInstanceToGraphQLType(definition.type || definition) };
    }
  } else if (Array.isArray(definition)) {
    newfields = { type: new GraphQLList(checkTypesForInputTypes(definition[0], field, fields, true).type) };
  } else if (typeof definition === 'object') {
    if (!types[`${field}Input`]) {
      const newType = new GraphQLInputObjectType({
        name: `${field}Input`,
        description: `scheam for ${field}`,
        fields: () => getFieldsDefinitionsForInputTypes(definition),
      });
      types[`${field}Input`] = newType;
      newfields = { type: newType };
    } else {
      newfields = { type: types[`${field}Input`] };
    }
  }
  return newfields;
};


const checkTypes = (definition, field, fields, list) => {
  let newfields = {};
  if (planeDataTypes.includes(definition.type) || planeDataTypes.includes(definition)) {
    if (definition.type && definition.ref) {
      newfields = { type: types[definition.ref] };
    } else {
      newfields = { type: convertPrimitiveObjectInstanceToGraphQLType(definition.type || definition) };
    }
  } else if (Array.isArray(definition)) {
    newfields = { type: new GraphQLList(checkTypes(definition[0], field, fields, true).type) };
  } else if (typeof definition === 'object') {
    if (!types[field]) {
      const newType = new GraphQLObjectType({
        name: field,
        description: `scheam for ${field}`,
        fields: () => getFieldsDefinitions(definition),
      });
      types[field] = newType;
      newfields = { type: newType };
    } else {
      newfields = { type: types[field] };
    }
  }
  return newfields;
};

const generateSchemaGQL = (fields, table) => {
  types[table] = new GraphQLObjectType({
    name: table,
    description: `${table} schema`,
    fields: () => ({ _id: { type: GraphQLID }, ...getFieldsDefinitions(fields) }),
  });
  return types[table];
};

const generateSchemaGQLInput = (fields, table) =>
  // types[`${table}Input`] = new GraphQLInputObjectType({
  //   name: `${table}Input`,
  //   description: `${table} schema`,
  //   fields: () => ({ ...getFieldsDefinitions(fields) }),
  // });
  ({ ...getFieldsDefinitionsForInputTypes(fields) });
module.exports = {
  // generateSchemaGQL,
  generateSchemaGQL,
  generateSchemaGQLInput,
};
