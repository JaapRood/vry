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
	t.plan(11)

	const factoryOptions = { optionsFor: 'factory' }
	const serializeOptions = { optionsFor: 'serialize' }

	const itemType = {
		factory: (val, options) => {
			t.deepEqual(factoryOptions, options, 'options are forwarded to the item schema factory')
			return val + 'modified'
		},
		serialize: (val, options) => {
			t.deepEqual(serializeOptions, options, 'options are forwarded to the item schema serializer')
			return val.substr(0, val.lastIndexOf('modified')) + 'serialized'
		}
	}
	t.doesNotThrow(function() {
		const listOfSchema = Schema.listOf(itemType)

		t.ok(Schema.isIterableSchema(listOfSchema), 'returns an IterableSchema')
		t.deepEqual(listOfSchema.getItemSchema(), itemType, 'returns item schema when calling `getItemSchema` method')

		const source = ["some", "array"]
		const expectedFactoryResult = Immutable.List(["somemodified", 'arraymodified'])
		const expectedSerializeResult = ["someserialized", "arrayserialized"]

		const factoryResult = listOfSchema.factory(source, factoryOptions)

		t.ok(Immutable.List.isList(factoryResult), 'casts an array to a List')
		t.ok(expectedFactoryResult.equals(factoryResult), 'maps each value of the array with the item schema `factory` method')

		const serializeResult = listOfSchema.serialize(factoryResult, serializeOptions)

		t.ok(Array.isArray(serializeResult), 'serializes to an array')
		t.deepEqual(serializeResult, expectedSerializeResult, 'maps each value of the List with the item schema `serialize` method')
	}, 'accepts an Iterable constructor and type definition')
})

Test('Schema.setOf', function(t) {
	t.plan(11)

	const factoryOptions = { optionsFor: 'factory' }
	const serializeOptions = { optionsFor: 'serialize' }

	const itemType = {
		factory: (val, options) => {
			t.deepEqual(factoryOptions, options, 'options are forwarded to the item schema factory')
			return val + 'modified'
		},
		serialize: (val, options) => {
			t.deepEqual(serializeOptions, options, 'options are forwarded to the item schema serializer')
			return val.substr(0, val.lastIndexOf('modified')) + 'serialized'
		}
	}
	t.doesNotThrow(function() {
		const setOfSchema = Schema.setOf(itemType)

		t.ok(Schema.isIterableSchema(setOfSchema), 'returns an IterableSchema')
		t.deepEqual(setOfSchema.getItemSchema(), itemType, 'returns item schema when calling `getItemSchema` method')

		const source = ["some", "array"]
		const expectedFactoryResult = Immutable.Set(["somemodified", 'arraymodified'])
		const expectedSerializeResult = ["someserialized", "arrayserialized"]

		const factoryResult = setOfSchema.factory(source, factoryOptions)

		t.ok(Immutable.Set.isSet(factoryResult), 'casts an array to a Set')
		t.ok(expectedFactoryResult.equals(factoryResult), 'maps each value of the array with the item schema `factory` method')

		const serializeResult = setOfSchema.serialize(factoryResult, serializeOptions)

		t.ok(Array.isArray(serializeResult), 'serializes to an array')
		t.deepEqual(serializeResult, expectedSerializeResult, 'maps each value of the Set with the item schema `serialize` method')
	}, 'accepts an Iterable constructor and type definition')
})

Test('Schema.orderedSetOf', function(t) {
	t.plan(11)

	const factoryOptions = { optionsFor: 'factory' }
	const serializeOptions = { optionsFor: 'serialize' }

	const itemType = {
		factory: (val, options) => {
			t.deepEqual(factoryOptions, options, 'options are forwarded to the item schema factory')
			return val + 'modified'
		},
		serialize: (val, options) => {
			t.deepEqual(serializeOptions, options, 'options are forwarded to the item schema serializer')
			return val.substr(0, val.lastIndexOf('modified')) + 'serialized'
		}
	}

	t.doesNotThrow(function() {
		const orderedSetOfSchema = Schema.orderedSetOf(itemType)

		t.ok(Schema.isIterableSchema(orderedSetOfSchema), 'returns an IterableSchema')
		t.deepEqual(orderedSetOfSchema.getItemSchema(), itemType, 'returns item schema when calling `getItemSchema` method')

		const source = ["some", "array"]
		const expectedFactoryResult = Immutable.OrderedSet(["somemodified", 'arraymodified'])
		const expectedSerializeResult = ["someserialized", "arrayserialized"]

		const factoryResult = orderedSetOfSchema.factory(source, factoryOptions)

		t.ok(Immutable.OrderedSet.isOrderedSet(factoryResult), 'casts an array to an OrderedSet')
		t.ok(expectedFactoryResult.equals(factoryResult), 'maps each value of the array with the item schema `factory` method')

		const serializeResult = orderedSetOfSchema.serialize(factoryResult, serializeOptions)

		t.ok(Array.isArray(serializeResult), 'serializes to an array')
		t.deepEqual(serializeResult, expectedSerializeResult, 'maps each value of the OrderedSet with the item schema `serialize` method')
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
