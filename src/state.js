const Immutable = require('immutable')
const Invariant = require('invariant')
const _isPlainObject = require('lodash.isplainobject')
const _isUndefined = require('lodash.isundefined')
const _assign = require('lodash.assign')

const Factory = require('./factory')
const Identity = require('./identity')
const Props = require('./props')

const internals = {};

internals.props = Props // lazy refactoring, boo

// being a state instance is the same as having an identity... for now
exports.isState = Identity.hasIdentity

exports.create = function(name, defaults) {
	Invariant(name && (typeof name === "string"), 'Name is required to create a State');
	Invariant(!defaults || Factory.isDefaults(defaults), 'Defaults for state must be plain object or Immutable Iterable');

	const statePrototype = _assign(
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

exports.merge = (state, data) => {
	if (exports.isState(state)) {
		data = data.remove(internals.props.cid);
	} else {
		delete data.cid;
	}

	return state.merge(data);
}	
