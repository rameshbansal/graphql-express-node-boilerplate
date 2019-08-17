 var getRequestParams  = function(req) {
    var requestParams = {};
    for (var key in req.query) {
        if (requestParams[key] === undefined) {
            requestParams[key] = req.query[key];
        }
    }
    for (var key in req.params) {
        if (requestParams[key] === undefined) {
            requestParams[key] = req.params[key];
        }
    }
    return requestParams;
}

module.exports={getRequestParams:getRequestParams}