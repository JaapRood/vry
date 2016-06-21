const Immutable = require('immutable')
const Invariant = require('invariant')
const _isPlainObject = require('lodash.isplainobject')
const _isUndefined = require('lodash.isundefined')
const _assign = require('lodash.assign')
const _forEach = require('lodash.foreach')
const _functions = require('lodash.functions')
const Warning = require('warning')

const Factory = require('./factory')
const Identity = require('./identity')
const Merge = require('./merge')
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

	const identity = Identity.create(name)
	const factory = Factory.create(defaults)

	const statePrototype = _assign(
		Object.create(internals.State.prototype), // makes `x instanceof State` work
		identity,
		factory,
		Merge.create(identity, factory),
		{
			parse: internals.parse,
			serialize: internals.serialize
		}
	)

	var state = Object.create(statePrototype)

	// Binding each prototype method to the state itself. Unbound versions can still
	// be used by accessing the prototype
	_forEach(_functions(statePrototype), (methodName) => {
		state[methodName] = statePrototype[methodName].bind(state)
	})

	return state
};

internals.parse = (attrs) => {
	return attrs
}

internals.serialize = (state, optionsOrOmit) => {
	var options;

	// TODO: remove in v3.0
	Warning(!_isPlainObject(optionsOrOmit), 'The `omitMeta` flag as a second argument to `state.serialize` has been deprecated. Instead, pass an object of `options` with an `omitMeta` flag as the second argument')

	if (_isPlainObject(optionsOrOmit)) {
		options = optionsOrOmit
	} else {
		options = { omitMeta: optionsOrOmit }
	}

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

module.exports = _assign(internals.State, exports)