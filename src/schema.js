const Immutable = require('immutable')

const _assign = require('lodash.assign')
const _every = require('lodash.every')
const _isArray = require('lodash.isarray')
const _isPlainObject = require('lodash.isplainobject')
const _isFunction = require('lodash.isfunction')

exports.getDefinition = (schema, prop) => {
	return _isArray(schema) ? schema[0] : 
			schema ? schema[prop] :
			null
}

exports.isSchema = function(maybeSchema) {
	return !!(
		// objects go
		_isPlainObject(maybeSchema) || 
		// array with one value go
		_isArray(maybeSchema) && maybeSchema.length === 1
	) && _every(maybeSchema, (value, key) => {
		return exports.isType(value) || exports.isSchema(value)
	})
}

exports.isType = function(maybeType) {
	return !!(maybeType && (
		_isFunction(maybeType.factory) ||
		_isFunction(maybeType.serialize)
	))
}

exports.instanceOfType = function(type, maybeInstance) {
	// const type = definition.type
	return (
		type && 
		_isFunction(type.instanceOf) && 
		type.instanceOf(maybeInstance)
	)
}

exports.listOf = function(itemSchema) {
	return [itemSchema]
}

exports.mapOf = function(itemSchema) {
	return itemSchema
}

exports.setOf = function(itemSchema) {
	return {
		factory: (items, options) => (parse) => {
			return Immutable.Set(parse(items, { schema: itemSchema }))
		},

		serialize: (set, options) => (serialize) => {
			return serialize(set, _assign({}, options, { schema: itemSchema }))
		}
	}
}
