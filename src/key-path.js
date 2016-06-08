const Immutable = require('immutable');
const _isArray = require('lodash.isarray');
const _isString = require('lodash.isstring');

exports.parse = function(path) {
	if (_isString(path)) {
		return Immutable.List([path])
	} else if (_isArray(path)) { 
		return Immutable.List(path);
	} else {
		return path;
	}
};

exports.isKeyPath = function(maybeKeyPath) {
	return Immutable.Iterable.isIndexed(maybeKeyPath) && 
		maybeKeyPath.every(_isString);
};