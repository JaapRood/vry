const Invariant = require('invariant')
const Immutable = require('immutable')
const _assign = require('lodash.assign')
const _isFunction = require('lodash.isfunction')
const _isPlainObject = require('lodash.isplainobject')
const _keys = require('lodash.keys')

const Schema = require('./schema')
const Props = require('./props')

const internals = {}

exports.create = function(identity, factory, schema={}) {
	return {
		merge: internals.merge.bind(_assign({}, identity, factory)),
		mergeDeep: internals.mergeDeep.bind(_assign({}, identity, factory, schema))
	}
}

internals.merge = function(state, data) {
	Invariant(this.instanceOf(state), `Instance of ${this.typeName()} is required to merge it with new attributes`)
	Invariant(Immutable.Iterable.isIterable(data) || _isPlainObject(data), 'Plain object or Immutable Iterable required as source to merge with the state instance')

	return state.merge(internals.mergableInstance.call(this, data));
}

internals.mergeDeep = function(state, data) {
	Invariant(this.instanceOf(state), `Instance of ${this.typeName()} is required to merge deep it with new attributes`)
	Invariant(Immutable.Iterable.isIterable(data) || _isPlainObject(data), 'Plain object or Immutable Iterable required as source to merge deep with the state instance')

	

	const mergeDeep = function(current, next, schema) {
		// merge schema props shallowly, the rest deeply
		const withSchema = next.filter((modelValue, modelProp) => {
			if (!schema) return false

			const definition = Schema.getDefinition(schema, modelProp)

			return definition && (Schema.isType(definition) || Schema.isSchema(definition))
		})
		const withoutSchema = next.filter((modelValue, modelProp) => {
			return !withSchema.has(modelProp)
		})

		return current.mergeDeep(withoutSchema).mergeWith(function(currentValue, nextValue, modelProp) {
			const definition = Schema.getDefinition(schema, modelProp)

			if (Schema.isType(definition)) {
				let type = definition

				if (!_isFunction(type.mergeDeep)) {
					return nextValue
				} else {
					return type.mergeDeep(currentValue, nextValue)
				}
			} else if (Schema.isSchema(definition)) {
				let nestedSchema = definition

				if (nestedSchema.getItemSchema && _isFunction(nestedSchema.mergeDeep)) { // could be an Iterable schema
					return nestedSchema.mergeDeep(currentValue, nextValue)
				} else if (
					Immutable.Iterable.isKeyed(currentValue) && _isPlainObject(nestedSchema)
				) {
					return mergeDeep(currentValue, nextValue, nestedSchema)
				}
			}
			
			// if we've arrived here, we didn't find a way to merge, so return the next value
			return nextValue
		}, withSchema)
	}

	const mergableInstance = internals.mergableInstance.call(this, data)
	const modelSchema = this.schema && this.schema()

	return mergeDeep(state, mergableInstance, modelSchema)
}

internals.mergableInstance = function(data) {
	if (!this.instanceOf(data)) {
		let dataKeys = Immutable.Seq(Immutable.Iterable.isIterable(data) ? data.keys() : _keys(data))
		data = this.factory(data).filter((val, key) => dataKeys.includes(key))
	}

	return data.remove(Props.cid).remove(Props.name)
}