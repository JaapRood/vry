const Test = require('tape')
const Immutable = require('immutable')
const _ = require('lodash')

const Schema = require('../lib/schema')

Test('Schema.isType', function(t) {
	t.plan(4)

	t.doesNotThrow(function() {
		t.equal(Schema.isType({ factory() {} }), true, 'an object with a factory function is a type definition')
		t.equal(Schema.isType({ serialize() {} }), true, 'an object with a serialize function is a type definition')
		t.equal(Schema.isType({ somethingElse() {} }), false, 'an object without a factory or serialize function is not a type definition')
	}, 'accepts any value')
})

Test('Schema.listOf', function(t) {
	t.plan(5)

	const itemType = {
		factory: _.identity,
		serialize: _.identity
	}
	t.doesNotThrow(function() {
		const listOfSchema = Schema.listOf(itemType)

		t.ok(Schema.isIterableSchema(listOfSchema), 'returns an IterableSchema')
		t.deepEqual(listOfSchema.getItemSchema(), itemType, 'returns item schema when calling `getItemSchema` method')

		const source = ["some", "array"]

		t.ok(Immutable.List(source).equals(listOfSchema.factory(source)), 'casts an array to a List')
		t.deepEqual(listOfSchema.serialize(Immutable.List(source)), source, 'serializes to an array')
	}, 'accepts an Iterable constructor and type definition')
})

Test('Schema.setOf', function(t) {
	t.plan(5)

	const itemType = {
		factory: _.identity,
		serialize: _.identity
	}
	t.doesNotThrow(function() {
		const setOfSchema = Schema.setOf(itemType)

		t.ok(Schema.isIterableSchema(setOfSchema), 'returns an IterableSchema')
		t.deepEqual(setOfSchema.getItemSchema(), itemType, 'returns item schema when calling `getItemSchema` method')

		const source = ["some", "array"]

		t.ok(Immutable.Set(source).equals(setOfSchema.factory(source)), 'casts an array to a Set')
		t.deepEqual(setOfSchema.serialize(Immutable.Set(source)), source, 'serializes to an array')
	}, 'accepts an Iterable constructor and type definition')
})

Test('Schema.orderedSetOf', function(t) {
	t.plan(5)

	const itemType = {
		factory: _.identity,
		serialize: _.identity
	}
	t.doesNotThrow(function() {
		const orderedSetOfSchema = Schema.orderedSetOf(itemType)

		t.ok(Schema.isIterableSchema(orderedSetOfSchema), 'returns an IterableSchema')
		t.deepEqual(orderedSetOfSchema.getItemSchema(), itemType, 'returns item schema when calling `getItemSchema` method')

		const source = ["some", "array"]

		t.ok(Immutable.OrderedSet(source).equals(orderedSetOfSchema.factory(source)), 'casts an array to a OrderedSet')
		t.deepEqual(orderedSetOfSchema.serialize(Immutable.OrderedSet(source)), source, 'serializes to an array')
	}, 'accepts an Iterable constructor and type definition')
})

Test('Schema.isSchema', function(t) {
	t.plan(5)

	const type = {
		factory: _.identity,
		serialize: _.identity
	}

	t.doesNotThrow(function() {
		t.equal(Schema.isSchema(type), false, 'a type definition is not a Schema')
		t.equal(Schema.isSchema({ a: type }), true, 'an object with type definitions for every property is a Schema')
		t.equal(Schema.isSchema([type]), true, 'an array with type definitions for every value is a Schema')
		t.equal(Schema.isSchema({ a: type, b: { c: type, d: [type]}}), true, 'a schema with nested schemas is a Schema')
	}, 'accepts any value')
})

Test('Schema.instanceOfType', function(t) {
	t.plan(4)

	const type = {
		factory: _.identity,
		instanceOf: (val) => val === 'a'
	}


	t.doesNotThrow(function() {
		t.equal(Schema.instanceOfType(type, 'a'), true, 'returns true when the value passes the types instanceOf method')
		t.equal(Schema.instanceOfType(type, 'b'), false, 'returns false when the value does not pass the types instanceOf method')
		t.equal(Schema.instanceOfType({ factory: _.identity}, 'a'), false, 'returns false when the type does not have an instanceOf method')
	}, 'accepts a type and a value to test')
})
