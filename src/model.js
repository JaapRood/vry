const Immutable = require('immutable')
const Invariant = require('invariant')
const _assign = require('lodash.assign')
const _every = require('lodash.every')
const _forEach = require('lodash.foreach')
const _functions = require('lodash.functions')
const _isArray = require('lodash.isarray')
const _isPlainObject = require('lodash.isplainobject')
const _isString = require('lodash.isstring')
const _isFunction = require('lodash.isfunction')
const _isUndefined = require('lodash.isundefined')

const Identity = require('./identity')
const Factory = require('./factory')
const State = require('./state')
const Schema = require('./schema')

const internals = {}

internals.Model = function(...args) {
	Invariant(!(this instanceof internals.Model), 'Model should not be called with `new`')

	return exports.create(...args)
}


exports.isModel = (maybeModel) => Identity.hasIdentity(maybeModel)

exports.create = (spec) => {
	Invariant(
		_isString(spec) ||
		_isPlainObject(spec) &&
		spec.name && _isString(spec.name)
	, 'A name or a plain object (spec) with a name is required to create a model')

	if (_isString(spec)) {
		spec = { name: spec }
	}

	const {
		name,
		defaults
	} = spec

	let schema = spec.schema

	Invariant(!defaults || Factory.isDefaults(defaults), 'When specifying defaults in the model spec it must be a plain object or Immutable Iterable')
	Invariant(!schema || Schema.isSchema(schema), 'When specificying a schema for a model, it must be a valid schema definition')
	
	if (!schema) schema = {}

	const modelPrototype = _assign(
		Object.create(internals.Model.prototype), // makes `x instanceof Model` work
		Identity.create(name),
		Factory.create(defaults),
		{
			schema: () => schema
		},
		{
			parse: exports.parse,
			serialize: exports.serialize,
			merge: State.merge
		}
	)

	var model = Object.create(modelPrototype)

	// Binding each prototype method to the state itself. Unbound versions can still
	// be used by accessing the prototype
	_forEach(_functions(modelPrototype), (methodName) => {
		model[methodName] = modelPrototype[methodName].bind(model)
	})
	
	return model
}

exports.parse = function(attrs, options={}) {
	const schema = options.schema || this.schema()

	return attrs.map((modelValue, modelProp) => {
		const definition = Schema.getDefinition(schema, modelProp)

		// if no type was defined for this prop there is nothing for us to do
		if (!modelValue || !definition) return modelValue;

		if (Schema.isType(definition)) {
			let type = definition

			if (
				!_isFunction(type.factory) || 
				Schema.instanceOfType(type, modelValue)
			) {
				// if the value is already and instance of what we're trying to make it
				// there is nothing for us to do
				return modelValue
			} 
			
			return type.factory(modelValue)

		} else if (Schema.isSchema(definition)) {
			let nestedSchema = definition

			if (nestedSchema.getItemSchema) { // could be an Iterable schema
				let itemSchema = nestedSchema.getItemSchema()

				return nestedSchema.factory(this.parse(modelValue, { schema: itemSchema }))
			} else if ( // support plain objects and arrays as they'll automatically get cast properly
				Immutable.Iterable.isIndexed(modelValue) && _isArray(nestedSchema) ||
				Immutable.Iterable.isKeyed(modelValue) && _isPlainObject(nestedSchema)
			) {
				return this.parse(modelValue, { schema: nestedSchema })
			} 
		}

		return modelValue
	})
}

exports.serialize = function(model, options) {
	Invariant(exports.isModel(model) || Immutable.Iterable.isIterable(model), 'Model instance or Immutable.Iterable required to serialize it')
	Invariant(!options || _isPlainObject(options), 'Options, when passed, must be a plain object when serializing a model instance')

	if (!options) options = {}

	const schema = options.schema || this.schema()

	const partial = model.map((modelValue, modelProp) => {
		const definition = Schema.getDefinition(schema, modelProp)

		// if we don't have a value or there is nothing defined for it in the schema
		if (!modelValue || !definition) return modelValue

		if (Schema.isType(definition)) {
			let type = definition

			if (
				// no serializer or the value is not an instance of the type
				!_isFunction(type.serialize) || 
				(_isFunction(type.instanceOf) && !Schema.instanceOfType(type, modelValue))
			) {
				return modelValue
			}

			return type.serialize(modelValue, options)
		} else if (Schema.isSchema(definition)) {
			let nestedSchema = definition

			if (nestedSchema.getItemSchema) { // could be an Iterable schema
				let itemSchema = nestedSchema.getItemSchema()

				return nestedSchema.factory(this.serialize(modelValue, { schema: itemSchema }))
			} else if (
				Immutable.Iterable.isIndexed(modelValue) && _isArray(nestedSchema) ||
				Immutable.Iterable.isKeyed(modelValue) && _isPlainObject(nestedSchema)
			) {
				return exports.serialize.call(this, modelValue, _assign({}, options, { schema: nestedSchema }))
			}
		}

		// if we've arrived here, no other transformation was applied, so we just return the original
		return modelValue
	})

	return State.serialize(partial, options)
}

module.exports = _assign(internals.Model, exports) 