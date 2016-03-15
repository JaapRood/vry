var Immutable = require('immutable');
var ShortId = require('shortid');
var Invariant = require('invariant');
var _isArray = require('lodash.isarray');
var _isFunction = require('lodash.isfunction');
var _isPlainObject = require('lodash.isplainobject');
var _uniqueId = require('lodash.uniqueid');

var internals = {};

internals.props = {
	cid: '__cid',
	name: '__stateName'
};

internals.cidPrefix = `vry-${ShortId.generate()}-`;
internals.generateCid = function() {
	return _uniqueId(internals.cidPrefix);
};

exports = module.exports = internals.State = function(name, defaults={}) {
	Invariant(name && (typeof name === "string"), 'Name is required to create a State');

	Invariant(
		Immutable.Iterable.isIterable(defaults) || 
		_isPlainObject(defaults)
	, 'Defaults for state must be plain object or Immutable Iterable');

	defaults = Immutable.Map(defaults);

	this._spec = {
		name: name,
		defaults: defaults
	};
};

exports.create = function(name, defaults) {
	var state = new internals.State(name, defaults);

	return state;
};

internals.State.prototype.factory = function(rawEntity={}, options={}) {
	Invariant(
		Immutable.Iterable.isIterable(rawEntity) ||
		_isPlainObject(rawEntity)
	, 'Raw entity, when passed, must be a plain object or Immutable Iterable');
	Invariant(_isPlainObject(options), 'options, when passed, must be a plain object');
	Invariant(!options.parse || _isFunction(options.parse), 'The `parse` prop of the options, when passed, must be a function');

	var parse = options.parse || this.parse;

	// merge with with defaults and cast any nested native selections to Seqs
	var entity = this._spec.defaults.merge(Immutable.Map(rawEntity)).map((value, key) => {
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
		[internals.props.name]: this._spec.name
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
};

internals.State.isState = function(state) {
	return Immutable.Iterable.isIterable(state) &&
		state.has(internals.props.cid) &&
		state.has(internals.props.name);
};

internals.State.prototype.instanceOf = function(state) {
	return internals.State.isState(state) && 
		state.get(internals.props.name) === this._spec.name;
};

internals.State.prototype.parse = function(attrs) {
	return attrs;
};

internals.State.prototype.serialize = function(state, omitCid=true) {
	Invariant(internals.State.isState(state), 'State instance is required to serialize state');

	if (!omitCid) {
		return state.toJS();
	} else {
		return state.filter((value, key) => key !== internals.props.cid).toJS();
	}
};

internals.State.prototype.merge = function(state, data) {
	if (internals.State.isState(state)) {
		data = data.remove(internals.props.cid);
	} else {
		delete data.cid;
	}

	return state.merge(data);
};

