const Immutable = require('immutable')
const Invariant = require('invariant')

const _assign = require('lodash.assign')
const _every = require('lodash.every')
const _isArray = require('lodash.isarray')
const _isPlainObject = require('lodash.isplainobject')
const _isFunction = require('lodash.isfunction')

const internals = {}

internals.idenity = (val) => val

internals.IterableSchema = function(iterable, itemSchema) {
	Invariant(_isFunction(iterable), 'Iterable constructor required to create IterableSchema')
	Invariant(exports.isType(itemSchema) || exports.isSchema(itemSchema), 'Item schema or type required to create IterableSchema')

	_assign(this, {
		getItemSchema: () => itemSchema,
		factory: (val, ...otherArgs) => {
			const factory = itemSchema.factory || internals.idenity
			return iterable(val).map((item) => factory(item, ...otherArgs))
		},
		serialize: (val, ...otherArgs) => {
			const serialize = itemSchema.serialize || internals.idenity
			return val.map((item) => serialize(item, ...otherArgs)).toJS()
		}
	})
}

exports.getDefinition = (schema, prop) => {
	return _isArray(schema) ? schema[0] : 
		_isPlainObject(schema) ? schema[prop] :
		exports.isIterableSchema(schema) ? schema.getItemSchema() :
		null
}

exports.isSchema = function(maybeSchema) {
	return exports.isIterableSchema(maybeSchema) || (	
		(
			// objects go
			_isPlainObject(maybeSchema) || 
			// array with one value go
			_isArray(maybeSchema) && maybeSchema.length === 1
		) && _every(maybeSchema, (value, key) => {
			return exports.isType(value) || exports.isSchema(value)
		})
	)
}

exports.isIterableSchema = function(maybeSchema) {
	return maybeSchema instanceof internals.IterableSchema
}

exports.isType = function(maybeType) {
	return !!(maybeType && (
		_isFunction(maybeType.factory) ||
		_isFunction(maybeType.serialize)
	))
}

exports.instanceOfType = function(type, maybeInstance) {
	return (
		type && 
		_isFunction(type.instanceOf) && 
		type.instanceOf(maybeInstance)
	)
}


exports.listOf = function(itemSchema) {
	return new internals.IterableSchema(Immutable.List, itemSchema)
}

exports.setOf = function(itemSchema) {
	return new internals.IterableSchema(Immutable.Set, itemSchema)
}

exports.orderedSetOf = function(itemSchema) {
	return new internals.IterableSchema(Immutable.OrderedSet, itemSchema)
}