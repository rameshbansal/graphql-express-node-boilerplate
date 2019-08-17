const express = require('express');
const validate = require('express-validation');
const controller = require('./daffo.controller');
const { authorize } = require('../../middlewares/auth');
const {
  count, get, update, deleteDocument, getFile,
} = require('./daffo.validation');
// const ROLES = require('../../../config/roles');

const router = express.Router();

/**
 * Load user when API with userId route parameter is hit
 */
// router.param('userId', controller.load);


router
  .route('/:collection/get')
  /**
   * @api {all} v1/daffo/:collection/get Read Any documents
   * @apiDescription Get a list of any permitted collection's documents.
   * @apiVersion 1.0.0
   * @apiName readAnyCollection
   * @apiGroup CRUD
   * @apiPermission Any permitted role.
   *
   * @apiHeader {String} Authorization  User's access token
   *
   * @apiParam  {Number{1-}}       [page=1]      List page
   * @apiParam  {Number{1-100}}    [perPage=1]   Records Per page
   * @apiParam  {Object}           [filter]      Collection filter same as mongodb syntax.For ex : {filter : {"age" : {$gte : 20 }}}
   * @apiParam  {Object}           [fields]      Fields need to provide in format like {name: 1, "service.password": 1}
   * @apiParam  {Object}           [sort]        Sort on allowed fields same as mongodb syntax
   *
   * @apiSuccess {Object[]}                      Records List of records.
   *
   * @apiError (Forbidden 403)     Forbidden     You will need permission in grant list to access the data.
   */
  .post(authorize('read_any'), validate(get), controller.list);

router
  .route('/:collection/getOwn')
/**
   * @api {all} v1/daffo/:collection/getOwn Read Own documents
   * @apiDescription Read only own referenced documents from collection.
   * @apiVersion 1.0.0
   * @apiName readOwnRefrencedCollection
   * @apiGroup CRUD
   * @apiPermission Any Permitted Role.
   *
   * @apiHeader {String} Authorization  User's access token
   *
   * @apiParam  {Number{1-}}      [page=1]     List page
   * @apiParam  {Number{1-100}}   [perPage=1]  Per page
   * @apiParam  {Object}          [filter]     Collection filter same as mongodb syntax.For ex : {filter : {"age" : {$gte : 20 }}}
   * @apiParam  {Object}          [fields]     Fields need to provide in format like {name: 1, "service.password": 1}
   * @apiParam  {Object}          [sort]       Sort on allowed fields same as mongodb syntax
   *
   * @apiError (Forbidden 403)    Forbidden    You will need permission in grant list to access the data.
   * @apiError (Conflict  409)    Conflict     You will need to give current user id in filter.
   */
  .post(authorize('read_own'), validate(get), controller.get);

router
  .route('/:collection/count')
  /**
   * @api {post} v1/daffo/:collection/count Count documents
   * @apiDescription Get a count of any permitted collection's documents.
   * @apiVersion 1.0.0
   * @apiName count
   * @apiGroup CRUD
   * @apiPermission Any permitted role.
   *
   * @apiHeader {String} Authorization  User's access token
   *
   * @apiParam  {Object}           [filter]      Collection filter same as mongodb syntax.For ex : {filter : {"age" : {$gte : 20 }}}
   *
   * @apiSuccess {Object}          count         Number of documents
   *
   * @apiError (Forbidden 403)     Forbidden     You will need permission in grant list to access the data.
   */
  .post(authorize('read_any'), validate(count), controller.count);

router
  .route('/:collection/create')
  /**
   * @api {post} v1/daffo/:collection/create Create Own documents
   * @apiDescription Create own collection's documents
   * @apiVersion 1.0.0
   * @apiName createCollection
   * @apiGroup CRUD
   * @apiPermission Any Permitted Role.
   *
   * @apiHeader {String}                  Authorization        User's access token
   *
   * @apiParam  {String}                  any_required_string  Give the required string field in body params
   * @apiParam  {Number}                  any_required_number  Give the required number field in body params
   * @apiParam  {Object}                  any_required_object  Give the required object field in body params
   *
   * @apiSuccess (Created 201) {String}   id                   Returns the Id of created document
   * @apiSuccess (Created 201) {String}   any_created_string   Returns the created string field
   * @apiSuccess (Created 201) {Number}   any_created_number   Returns the created number field
   * @apiSuccess (Created 201) {Object}   any_created_object   Returns the created object field
   *
   * @apiError (Forbidden 403)                 Forbidden       You will need permission to create the data.
   * @apiError (Internal Server Error 500)     Required_Fields You will need to give required fields in the body params or the given required fields have existing values.
   */
  .post(authorize('create_own'), controller.create);

router
  .route('/:collection/update')
/**
   * @api {patch} v1/daffo/:collection/update Update Any documents
   * @apiDescription Update permitted fields of any collection's documents.
   * @apiVersion 1.0.0
   * @apiName update
   * @apiGroup CRUD
   * @apiPermission Any Permitted Role.
   *
   * @apiHeader {String}                   Authorization    User's access token
   *
   * @apiParam  {Object}   setter          Update query same as mongodb syntax.For ex : {setter : { $push : "grades" : 20 }}
   * @apiParam  {Object}   [filter]        Collection filter same as mongodb syntax.For ex : {filter : {"age" : {$gte : 20 }}}
   *
   * @apiSuccess (No Content 204)          Success          Successfully updated the records.
   *
   * @apiError (Forbidden 403)             Forbidden        You will need permission to update the data.
   * @apiError (Internal Server Error 500) Undefined        You will need to give the setter in body params.
   */
  .patch(authorize('update_any'), validate(update), controller.update);

router
  .route('/:collection/updateOwn')
/**
   * @api {patch} v1/daffo/:collection/updateOwn Update Own documents
   * @apiDescription Update own referenced collection's documents.
   * @apiVersion 1.0.0
   * @apiName UpdateUser
   * @apiGroup CRUD
   * @apiPermission Any Permitted Role.
   *
   * @apiHeader {String}                    Authorization   User's access token
   *
   * @apiParam  {Object}   setter           Update query same as mongodb syntax.For ex : {setter : { $push : "grades" : 20 }}
   * @apiParam  {Object}   [filter]         Collection filter same as mongodb syntax.For ex : {filter : {"age" : {$gte : 20 }}}
   *
   * @apiSuccess (No Content 204)           Success         Successfully updated the records.
   *
   * @apiError (Forbidden 403)              Forbidden       You will need permission to update the data.
   * @apiError (Internal Server Error 500)  Undefined       You will need to give the setter in body params.
   */
  .patch(authorize('update_own'), validate(update), controller.update);

router
  .route('/:collection/deleteOwn')
/**
   * @api {delete} v1/daffo/:collection/deleteOwn Delete Own documents
   * @apiDescription Delete own referenced collection's documents.
   * @apiVersion 1.0.0
   * @apiName DeleteOwnCollection
   * @apiGroup CRUD
   * @apiPermission Any Permitted Role.
   *
   * @apiHeader {String}                  Authorization  User's access token
   *
   * @apiParam  {Object}   [filter]       Collection filter same as mongodb syntax.For ex : {filter : {"age" : {$gte : 20 }}}
   *
   * @apiSuccess (No Content 204)         Success        Successfully deleted the records.
   *
   * @apiError (Forbidden 403)            Forbidden      You will need permission to remove the data.
   */
  .delete(authorize('remove_own'), validate(deleteDocument), controller.remove);

router
  .route('/:collection/delete')
/**
   * @api {delete} v1/daffo/:collection/delete Delete Any documents
   * @apiDescription Delete Any collection's documents.
   * @apiVersion 1.0.0
   * @apiName deleteAnyCollection
   * @apiGroup CRUD
   * @apiPermission Any permitted role.
   *
   * @apiHeader {String}                  Authorization  User's access token
   *
   * @apiParam  {Object}   [filter]       Collection filter same as mongodb syntax.For ex : {filter : {"age" : {$gte : 20 }}}
   *
   * @apiSuccess (No Content 204)         Success        Successfully deleted the records.
   *
   * @apiError (Forbidden 403)            Forbidden      You will need permission to remove the data.
   */
  .delete(authorize('remove_any'), validate(deleteDocument), controller.remove);

router
  .route('/dispatch/:action')
  .all(controller.actionHandler);

router
  .route('/file/:bucket/:filename')
/**
     * @api {all} v1/daffo/file/bucket/filename File download
     * @apiDescription get file from server
     * @apiVersion 1.0.0
     * @apiName get files
     * @apiGroup Files
     * @apiPermission public or private or role based
     *
     * @apiHeader {String} Authorization  User's access token required for public or role based api
     * @apiHeader {String} content-type   multipart/form-data
     *
     * @apiParam  {string}    bucket     bucket name with filename
     * @apiParam  {String}    filename   name of file
     *
     * @apiSuccess (Done 200) {Object}  response    response object
     *
     * @apiError (Bad Request 400)   ValidationError  Some parameters may contain invalid values
     * @apiError (Unauthorized 401)  Unauthorized     Only authenticated users
     * @apiError (Forbidden 403)     Forbidden        You are not allowed to access this API
  */
  .get(controller.fileHandler, validate(getFile));


module.exports = router;
