var Immutable = require('immutable');
var Invariant = require('invariant');
var _isPlainObject = require('lodash.isplainobject');
var _assign = require('lodash.assign')

const Factory = require('./factory')
const Identity = require('./identity')
const Props = require('./props')

var internals = {};

internals.props = Props // lazy refactoring, boo

// being a state instance is the same as having an identity... for now
exports.isState = Identity.hasIdentity

exports.create = function(name, defaults) {
	Invariant(name && (typeof name === "string"), 'Name is required to create a State');
	Invariant(!defaults || Factory.isDefaults(defaults), 'Defaults for state must be plain object or Immutable Iterable');

	const statePrototype = _assign(
		Identity.create(name),
		Factory.create(defaults),
		internals.parser, 
		internals.merger, 
		internals.serializer
	)

	let state = Object.create(statePrototype)

	return state
};

internals.parser = {
	parse(attrs) {
		return attrs
	}
}

internals.serializer = {
	serialize(state, omitCid=true) {
		Invariant(exports.isState(state), 'State instance is required to serialize state');

		if (!omitCid) {
			return state.toJS();
		} else {
			return state.filter((value, key) => key !== internals.props.cid).toJS();
		}
	}
}

internals.merger = {
	merge(state, data) {
		if (exports.State.isState(state)) {
			data = data.remove(internals.props.cid);
		} else {
			delete data.cid;
		}

		return state.merge(data);
	}	
}


