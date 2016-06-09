var Immutable = require('immutable');
var ShortId = require('shortid');
var Invariant = require('invariant');
var _isArray = require('lodash.isarray');
var _isFunction = require('lodash.isfunction');
var _isPlainObject = require('lodash.isplainobject');
var _uniqueId = require('lodash.uniqueid');
var _assign = require('lodash.assign')

var internals = {};

internals.props = {
	cid: '__cid',
	name: '__stateName'
};

internals.cidPrefix = `vry-${ShortId.generate()}-`;
internals.generateCid = function() {
	return _uniqueId(internals.cidPrefix);
};

exports.isState = (maybeState) => {
	return Immutable.Iterable.isIterable(maybeState) &&
		maybeState.has(internals.props.cid) &&
		maybeState.has(internals.props.name);
}

exports.create = function(name, defaults) {
	Invariant(name && (typeof name === "string"), 'Name is required to create a State');

	Invariant(
		!defaults ||
		Immutable.Iterable.isIterable(defaults) || 
		_isPlainObject(defaults)
	, 'Defaults for state must be plain object or Immutable Iterable');

	const identity = internals.createIdentity(name, defaults)

	const statePrototype = _assign(
		{
			factory: internals.factory
		},
		identity,
		internals.parser, 
		internals.merger, 
		internals.serializer
	)

	let state = Object.create(statePrototype)

	return state

};

internals.createIdentity = function(name, defaults) {
	Invariant(name && (typeof name === "string"), 'Name is required to create an identity');

	Invariant(
		!defaults ||
		Immutable.Iterable.isIterable(defaults) || 
		_isPlainObject(defaults)
	, 'Defaults for identity must be plain object or Immutable Iterable');

	defaults = Immutable.Map(defaults || {});

	const identity = {
		getName: () =>  name,
		getDefaults: () => defaults,
		hasIdentity: exports.isState,
		instanceOf(maybeInstance) {
			return identity.hasIdentity(maybeInstance) && maybeInstance.get(internals.props.name) === name
		},
		collectionOf(maybeCollection) {
			return Immutable.Iterable.isIterable(maybeCollection) &&
				maybeCollection.every(identity.instanceOf);
		}
	}

	return identity
}

internals.factory = function(rawEntity={}, options={}) {
	Invariant(
		Immutable.Iterable.isIterable(rawEntity) ||
		_isPlainObject(rawEntity)
	, 'Raw entity, when passed, must be a plain object or Immutable Iterable');
	Invariant(_isPlainObject(options), 'options, when passed, must be a plain object');
	Invariant(!options.parse || _isFunction(options.parse), 'The `parse` prop of the options, when passed, must be a function');

	var parse = options.parse || this.parse || ((attrs) => attrs);

	// merge with with defaults and cast any nested native selections to Seqs
	var entity = this.getDefaults().merge(Immutable.Map(rawEntity)).map((value, key) => {
		if (Immutable.Iterable.isIterable(value)) {
			return value;
		}

		if (_isArray(value)) {
			return Immutable.Seq.Indexed(value);
		}

		if (_isPlainObject(value)) {
			return Immutable.Seq.Keyed(value);
		}

		return value;
	});

	var parsedEntity = parse(entity);

	Invariant(Immutable.Iterable.isIterable(parsedEntity), 'Parse function has to return an Immutable Iterable');

	var metaAttrs = {
		[internals.props.cid]: internals.generateCid(),
		[internals.props.name]: this.getName()
	};

	return parsedEntity.toKeyedSeq().map(function(value, key) {
		if (Immutable.Seq.isSeq(value)) {
			// cast any Seqs into either Lists or Maps
			let isIndexed = Immutable.Iterable.isIndexed(value)
			let collection = isIndexed ? value.toList() : value.toMap();

			return collection.map(function(value) {
				return Immutable.fromJS(value);
			});
		} else {
			// cast any nested collections to immutable data
			return Immutable.fromJS(value);
		}
	}).toMap().merge(metaAttrs);
}



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


