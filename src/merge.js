const Invariant = require('invariant')
const Immutable = require('immutable')
const _assign = require('lodash.assign')
const _isPlainObject = require('lodash.isplainobject')
const _keys = require('lodash.keys')

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

	return state.mergeDeep(internals.mergableInstance.call(this, data));
}

internals.mergableInstance = function(data) {
	if (!this.instanceOf(data)) {
		let dataKeys = Immutable.Seq(Immutable.Iterable.isIterable(data) ? data.keys() : _keys(data))
		data = this.factory(data).filter((val, key) => dataKeys.includes(key))
	}

	return data.remove(Props.cid).remove(Props.name)
}