const Immutable = require('immutable')
const Invariant = require('invariant')
const _assign = require('lodash.assign')
const _every = require('lodash.every')
const _isArray = require('lodash.isarray')
const _isPlainObject = require('lodash.isplainobject')
const _isString = require('lodash.isstring')
const _isFunction = require('lodash.isfunction')

const Identity = require('./identity')
const Factory = require('./factory')

const internals = {}

exports.isModel = (maybeModel) => {}

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
		Identity.create(name),
		Factory.create(defaults),
		{
			schema: () => schema
		},
		{
			parse: exports.parse,
			merge: exports.merge,
			serialize: exports.serialize
		}
	)

	let model = Object.create(modelPrototype)
	
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

			if (Schema.instanceOfType(type, modelValue)) {
				// if the value is already and instance of what we're trying to make it
				// there is nothing for us to do
				return modelValue
			} else {
				return type.factory(modelValue)
			}
		} else if (Schema.isSchema(definition)) {
			let nestedSchema = definition

			if (
				Immutable.Iterable.isIndexed(modelValue) && _isArray(nestedSchema) ||
				Immutable.Iterable.isKeyed(modelValue) && _isPlainObject(nestedSchema)
			) {
				return exports.parse(modelValue, { schema: nestedSchema })
			} else {
				if (process.env.name !== 'production') {
					Warning(`Value for '${stateProp}' ignored because it did not match the type defined in schema`);
				}
				return null;
			}
		} else {
			return modelValue
		}
	})
}


const Schema = {
	getDefinition(schema, prop) {
		return _isArray(schema) ? schema[0] : 
				schema ? schema[prop] :
				null
	},

	isSchema(maybeSchema) {
		return !!(
			// objects go
			_isPlainObject(maybeSchema) || 
			// array with one value go
			_isArray(maybeSchema) && maybeSchema.length === 1
		) && _every(maybeSchema, (value, key) => {
			return Schema.isType(value) || Schema.isSchema(value)
		})
	},

	isType(maybeType) {
		return !!(maybeType && _isFunction(maybeType.factory))
	},

	instanceOfType(type, maybeInstance) {
		// const type = definition.type
		return (
			type && 
			_isFunction(type.instanceOf) && 
			type.instanceOf(maybeInstance)
		)
	},

	getType(definition) {

	}
}

// exports.isSchema = (maybeSchema) => {}
// exports.isEntity = (maybeEntity) => {
// 	return maybeEntity && _isFunction(maybeEntity.factory)
// }

exports.merge = () => {}
exports.serialize = () => {}