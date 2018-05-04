const Invariant = require('invariant')
const Immutable = require('immutable')
const ShortId = require('shortid')
const _assign = require('lodash.assign')
const _isPlainObject = require('lodash.isplainobject')
const _isFunction = require('lodash.isfunction')
const _isArray = require('lodash.isarray')
var _uniqueId = require('lodash.uniqueid')

const Props = require('./props')

const internals = {}

internals.cidPrefix = `vry-${ShortId.generate()}-`
internals.generateCid = function() {
	return _uniqueId(internals.cidPrefix)
}

exports.create = function(defaults) {
	Invariant(!defaults || exports.isDefaults(defaults), 'Defaults for factory must be plain object or Immutable Iterable')

	defaults = Immutable.Map(defaults || {})

	return {
		factory: internals.factory,
		defaults: () => defaults
	}
}

exports.isDefaults = (maybeDefaults) => Immutable.Iterable.isIterable(maybeDefaults) || _isPlainObject(maybeDefaults)

internals.factory = function(rawEntity={}, options={}) {
	Invariant(
		Immutable.Iterable.isIterable(rawEntity) ||
		_isPlainObject(rawEntity)
	, 'Raw entity, when passed, must be a plain object or Immutable Iterable')
	Invariant(_isPlainObject(options), 'options, when passed, must be a plain object')
	Invariant(!options.parse || _isFunction(options.parse), 'The `parse` prop of the options, when passed, must be a function')
	Invariant(!options.defaults || exports.isDefaults(options.defaults), 'The `defaults` prop of the options, when passed, must be plain object or Immutable Iterable')

	var parse = options.parse || this.parse || ((attrs) => attrs)
	var defaults = Immutable.Map(options.defaults || this.defaults() || {})

	// merge with with defaults and cast any nested native selections to Seqs
	var entity = defaults.merge(Immutable.Map(rawEntity)).map((value, key) => {
		if (Immutable.Iterable.isIterable(value)) {
			return value
		}

		if (_isArray(value)) {
			return Immutable.Seq.Indexed(value)
		}

		if (_isPlainObject(value)) {
			return Immutable.Seq.Keyed(value)
		}

		return value
	})

	var parsedEntity = parse.call(this, entity, options)

	Invariant(Immutable.Iterable.isIterable(parsedEntity), 'Parse function has to return an Immutable Iterable')

	var metaAttrs = {
		[Props.cid]: internals.generateCid(),
		[Props.name]: this.typeName()
	}

	return parsedEntity.toKeyedSeq().map(function(value, key) {
		if (Immutable.Seq.isSeq(value)) {
			// cast any Seqs into either Lists or Maps
			let isIndexed = Immutable.Iterable.isIndexed(value)
			let collection = isIndexed ? value.toList() : value.toMap()

			return collection.map(function(value) {
				return Immutable.fromJS(value)
			})
		} else {
			// cast any nested collections to immutable data
			return Immutable.fromJS(value)
		}
	}).toMap().merge(metaAttrs)
}