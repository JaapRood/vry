const Immutable = require('immutable')
const Invariant = require('invariant')
const _isPlainObject = require('lodash.isplainobject')
const _isUndefined = require('lodash.isundefined')
const _assign = require('lodash.assign')
const _keys = require('lodash.keys')

const Factory = require('./factory')
const Identity = require('./identity')
const Props = require('./props')

const internals = {};

internals.props = Props // lazy refactoring, boo

internals.State = function(...args) {
	Invariant(!(this instanceof internals.State), 'State should not be called with `new`')

	return exports.create(...args)
}

// being a state instance is the same as having an identity... for now
exports.isState = Identity.hasIdentity

exports.create = function(name, defaults) {
	Invariant(name && (typeof name === "string"), 'Name is required to create a State');
	Invariant(!defaults || Factory.isDefaults(defaults), 'Defaults for state must be plain object or Immutable Iterable');

	const statePrototype = _assign(
		Object.create(internals.State.prototype), // makes `x instanceof State` work
		Identity.create(name),
		Factory.create(defaults),
		{
			parse: exports.parse,
			serialize: exports.serialize,
			merge: exports.merge
		}
	)

	let state = Object.create(statePrototype)

	return state
};

exports.parse = (attrs) => {
	return attrs
}

exports.serialize = (state, options) => {
	Invariant(exports.isState(state) || Immutable.Iterable.isIterable(state), 'State instance or Immutable Iterable is required to serialize state');
	Invariant(!options || _isPlainObject(options), 'Options, when passed, must be a plain object when serializing a state instance')

	if (!options) options = {}
	const omitMeta = !_isUndefined(options.omitMeta) ? options.omitMeta : true


	if (!omitMeta) {
		return state.toJS();
	} else {
		return state.filter((value, key) => key !== internals.props.cid).toJS();
	}
}

exports.merge = function(state, data) {
	Invariant(this.instanceOf(state), `Instance of ${this.typeName()} is required to merge it with new attributes`)
	Invariant(Immutable.Iterable.isIterable(data) || _isPlainObject(data), 'Plain object or Immutable Iterable required as source to merge with the state instance')

	if (!this.instanceOf(data)) {
		let dataKeys = Immutable.Seq(Immutable.Iterable.isIterable(data) ? data.keys() : _keys(data))
		data = this.factory(data).filter((val, key) => dataKeys.includes(key))
	}

	return state.merge(data.remove(Props.cid));
}	

module.exports = _assign(internals.State, exports)