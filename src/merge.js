const Invariant = require('invariant')
const Immutable = require('immutable')
const _assign = require('lodash.assign')
const _isPlainObject = require('lodash.isplainobject')
const _keys = require('lodash.keys')

const Props = require('./props')

const internals = {}

exports.create = function(identity, factory) {
	return {
		merge: internals.merge.bind(_assign({}, identity, factory))
	}
}

internals.merge = function(state, data) {
	Invariant(this.instanceOf(state), `Instance of ${this.typeName()} is required to merge it with new attributes`)
	Invariant(Immutable.Iterable.isIterable(data) || _isPlainObject(data), 'Plain object or Immutable Iterable required as source to merge with the state instance')

	if (!this.instanceOf(data)) {
		let dataKeys = Immutable.Seq(Immutable.Iterable.isIterable(data) ? data.keys() : _keys(data))
		data = this.factory(data).filter((val, key) => dataKeys.includes(key))
	}

	return state.merge(data.remove(Props.cid).remove(Props.name));
}