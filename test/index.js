var Test = require('tape');
var State = require('../lib/state');
var Immutable = require('immutable');
var _ = require('lodash');

Test('State.create', function(t) {
	t.plan(2);

	t.doesNotThrow(function() {
		var state = State.create('test-state', { a: 1, b: 2});

		t.ok(state instanceof State, 'returns an instance of State');
	}, 'accepts a name for the state and an object of defaults');
});

Test('State.isState', function(t) {
	t.plan(3);

	var instance = State.create('test-state').factory();
	var otherMap = Immutable.Map();

	t.doesNotThrow(function() {
		t.equal(State.isState(instance), true, 'returns true for state instances');
		t.equal(State.isState(otherMap), false, 'returns false or Immutable Maps without the client id and name prop');
	}, 'does not throw');
});

Test('state.factory', function(t) {
	t.plan(6 + 3 + 2);


	t.doesNotThrow(function() {
		var state = State.create('test-state', { a: 1, b: 3});
		var instance = state.factory();

		t.ok(Immutable.Map.isMap(instance), 'returns an immutable map');
		t.deepEqual(_.pick(instance.toObject(), ['a','b']), { a: 1, b: 3}, 'returned map contains default attributes');

		var name = instance.get('__stateName');
		var cid = instance.get('__cid');

		t.equal(name, 'test-state', 'returned map has a name to identify instances of this State from others')
		t.ok(_.isString(cid) && !_.isEmpty(cid), 'returned map has a client id (cid) to identify it from others');

		t.equal(instance.count(), 4, 'returned map contains no other attributes than defaults, passed attributes, name and client id');
	}, 'allows for no arguments to be passed');

	t.doesNotThrow(function() {
		var state = State.create('test-state', { a: 1, b: 3, c: {} });
		var instance = state.factory({ a: 2, d: 5 });

		t.deepEqual(_.pick(instance.toJSON(), ['a','b', 'c','d']), { a: 2, b: 3, c: {}, d: 5 }, 'returned map has defaults overridden and any additional attributes added');

		t.ok(Immutable.Map.isMap(instance.get('c')), 'returns any nested objects as maps');
	}, 'accepts an object of attributes');

	t.doesNotThrow(function() {
		var childModel = State.create('child-state', { ca: 1, cb: 3});
		var parentModel = State.create('parent-state', { a: 1, b: null });

		var childInstance = childModel.factory();
		var instance = parentModel.factory({ b: childInstance });

		t.ok(childInstance.equals(instance.get('b')), 'returns instance with nested instances untouched');
	}, 'accepts an object of attributes with instances of other states');
});

Test('state.factory - parse', function(t) {
	t.plan(10);

	

	var state = State.create('test-model', {});

	t.doesNotThrow(function() {
		var parserCalls = [];

		var rawInstance = {
			__cid: 'some-client-id',
			a: 1,
			b: 3,
			c: {
				ca: 10,
				cb: 30
			},
			d: { da: 10, db: [] },
			e: [ 1, 2, 3, {}],
			f: Immutable.OrderedSet()
		};

		var instance = state.factory(rawInstance, {
			parse: function(attrs) {
				t.ok(Immutable.Map.isMap(attrs), 'parse function is called with attributes as a Map');

				return attrs.map(function(value, key) {
					if (key === 'a') {
						return 2;
					} else if (key === 'c') {
						t.ok(Immutable.Seq.isSeq(value) &&
							Immutable.Iterable.isKeyed(value) 
						, 'any direct children objects are presented as KeyedSeq');

						return value.toOrderedMap();
					} else if (key === 'e') {
						t.ok(Immutable.Seq.isSeq(value) &&
							Immutable.Iterable.isIndexed(value)
						, 'any direct children arrays are presented as IndexedSeq');

						return value;
					} else if (key === 'f') {
						t.ok(Immutable.OrderedSet.isOrderedSet(value), 'any Iterables are not transformed into a Seq');

						return value;
					} else {
						return value;
					}
				});
			}
		})

		t.ok(
			instance.get('a') === 2 &&
			Immutable.OrderedMap.isOrderedMap(instance.get('c'))
		, 'parser return value is used as the entry');

		t.ok(Immutable.Map.isMap(instance.get('d')), 'any not specifically parsed objects become maps');
		
		t.ok(Immutable.List.isList(instance.get('e')), 'any not specifically parsed arrays become lists');

		t.ok(
			Immutable.List.isList(instance.getIn(['d', 'db'])) &&
			Immutable.Map.isMap(instance.get('e').last())
		, 'any nested collections inside collections that were not parsed explicitely are cast to maps and lists, recursively');

		t.ok(
			instance.get('f').equals(rawInstance.f), 
		'any Iterables are not cast and remain in their original state');
	}, 'accepts a parse function as an option');

});

Test('state.instanceOf', function(t) {
	t.plan(3);

	var stateA = State.create('state-a');
	var stateB = State.create('state-b');

	var instanceA = stateA.factory();
	var instanceB = stateB.factory();

	t.doesNotThrow(function() {
		t.equal(stateA.instanceOf(instanceA), true, 'returns true for state instances created by it');
		t.equal(stateA.instanceOf(instanceB), false, 'returns true for state instances created by other states');
	}, 'accepts any value');
});

Test('state.serialize', function(t) {
	t.plan(7 + 3);

	var state = State.create('test-model', {});

	var rawInstance = {
		__cid: 'some-client-id',
		a: 1,
		b: 3,
		c: {
			ca: 10,
			cb: 30
		},
		d: { da: 10, db: [] },
		e: [ 1, 2, 3, {}],
		f: Immutable.OrderedSet()
	};

	var instance = state.factory(rawInstance);

	t.doesNotThrow(function() {
		var serialized = state.serialize(instance);

		t.ok(_.isObject(serialized), 'returns a plain object');
		t.equal(rawInstance.a, serialized.a, 'primitive values are serialized as is');
		t.deepEqual(rawInstance.a, serialized.a, 'Lists are serialized as plain arrays');
		t.deepEqual(rawInstance.c, serialized.c, 'Maps are serialized as plain objects');
		t.deepEqual([], serialized.f, 'Sets are serialized as plain arrays');
		t.ok(
			_.isEqual(rawInstance.d, serialized.d) &&
			_.isEqual(rawInstance.e, serialized.e)
		, 'nested Iterables are serialized to their plain counterparts recursively');
	}, 'accepts an immutable model instance');

	t.doesNotThrow(function() {
		var serialized = state.serialize(instance);
		var serializedIncluded = state.serialize(instance, false);

		t.ok(_.isUndefined(serialized.__cid), 'serialized object does not contain cid by default');
		t.equal(instance.get('__cid'), serializedIncluded.__cid, 'serialized object contains the client identifier of the instance when passing true as the second argument');
	}, 'accepts an immutable model and a flag to omit the model cid');
});