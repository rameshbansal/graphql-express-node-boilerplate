const { get, each } = require('lodash');
const { Schema } = require('mongoose');

const accessControl = {
  grantList: {},
  fields: {},
  addGrantList(grantList) {
    this.grantList = grantList;
  },
  verify({
    accessType, table, user,
  }) {
    const accessValues = get(this.grantList, `${user.role}.${table}.${accessType}`, false);
    if (accessValues) {
      accessValues.filter = JSON.parse(JSON.stringify(accessValues.filter || {}).replace('/=currentUser/g', user._id));
      if (accessType === 'update_any') {
        accessValues.filter_access = get(this.grantList, `${user.role}.${table}.read_any`, false);
      } else if (accessType === 'update_own') {
        accessValues.filter_access = get(this.grantList, `${user.role}.${table}.read_own`, false);
      }
      return {
        allowed: true,
        ...accessValues,
      };
    }
    return {
      allowed: false,
    };
  },

  configureAccessControlList() {
    each(Object.keys(this.fields), (table) => {
      each(Object.keys(this.grantList), (key) => {
        const tablePermissions = get(this.grantList, `${key}.${table}`, {});
        each(Object.keys(tablePermissions), (access) => {
          const permission = this.grantList[key][table][access];
          const fields = permissions({
            permission, table, allSchemaFields: this.fields, access, grantList: this.grantList, role: key,
          });
          this.grantList[key][table][access].fields = fields;
        });
      });
    });
    // console.log('grantList', JSON.stringify(this.grantList, null, 4));
  },
  addFields(schema, table) {
    const schemaKeys = getFields(schema);
    this.fields[table] = schemaKeys;
    // console.log('this.fields', this.fields);
  },
};
const convertToFieldsJSON = (schema, fields, appendKey = '', allSchemaFields, ref = false, access, grantList, role, level = 0) => {
  each(Object.keys(schema), (field) => {
    if (typeof schema[field] === 'string') {
      if (ref) {
        fields[appendKey] = fields[appendKey] || {};
        fields[appendKey][field] = 1;
      } else {
        fields[appendKey + field] = 1;
      }
    } else {
      const gotReferenceField = get(schema[field], 'ref', false);
      if (!gotReferenceField) {
        convertToFieldsJSON(schema[field], fields, `${appendKey}${field}.`, allSchemaFields);
      } else {
        // convertToFieldsJSON(allSchemaFields[gotReferenceField], fields, `${field}`, allSchemaFields, true);
        if (level > 5) {
          fields[appendKey + field] = 1;
          return;
        }
        const tablePermissions = get(grantList, `${role}.${gotReferenceField}.${access}`, {});
        const refFields = permissions({
          allSchemaFields, table: gotReferenceField, permission: tablePermissions, access, grantList, role, level: level + 1, ref: true,
        });
        if (refFields && Object.keys(refFields).length) {
          fields[appendKey + field] = refFields;
        }
      }
    }
  });
};

const permissions = ({
  permission, table, allSchemaFields, access, grantList, role, level = 0, ref = false,
}) => {
  // console.log('permission, table, allSchemaFields, access, grantList, role,', permission, table, access, role);
  const allowedFields = get(permission, 'allowedFields', []);
  const deniedFields = get(permission, 'deniedFields', []);
  const fields = {};

  if (allowedFields[0] === '*') {
    const schemaKeysCopy = JSON.parse(JSON.stringify(allSchemaFields[table]));
    each(deniedFields, (field) => {
      each(Object.keys(schemaKeysCopy), (schemaField) => {
        // console.log('schemaField', schemaField, field);
        if (schemaField.indexOf(field) === 0) {
          delete schemaKeysCopy[schemaField];
        }
      });
    });
    convertToFieldsJSON(schemaKeysCopy, fields, '', allSchemaFields, false, access, grantList, role, level);
    // console.log('schemaKeysCopy', schemaKeysCopy);
    each(deniedFields, (field) => {
      each(Object.keys(fields), (schemaField) => {
        // console.log('schemaField', schemaField, field);
        if (schemaField.indexOf(field) === 0) {
          delete fields[schemaField];
        }
      });
    });
  } else {
    each(allowedFields, (field) => {
      if (allSchemaFields[table][field]) {
        if (deniedFields.indexOf(field) === -1) {
          fields[field] = 1;
        }
      } else {
        throw new Error(`${field} not found in schema definition of table ${table}`);
      }
    });
  }
  if (ref) {
    return { ref: table, fields };
  }
  return fields;
};
const planeDataTypes = [String, Number, Date, Buffer, Boolean, Schema.Types.Mixed, Schema.Types.ObjectId, Schema.Types.Decimal128];
const checkTypes = (definition, field, fields) => {
  if (planeDataTypes.includes(definition.type) || planeDataTypes.includes(definition)) {
    if (definition.type && definition.ref) {
      fields[field] = { ref: definition.ref };
    } else {
      fields[field] = field;
    }
  } else if (Array.isArray(definition)) {
    checkTypes(definition[0], field, fields);
  } else if (typeof definition === 'object') {
    fields[field] = getFields(definition);
  }
};
const getFields = (model, fields = {}) => {
  const modelTopLevelFields = Object.keys(model);
  each(modelTopLevelFields, (field) => {
    checkTypes(model[field], field, fields);
  });
  return fields;
};


module.exports = {
  accessControl,
};
