const Test = require('tape')
const Model = require('../lib/model')
const Immutable = require('immutable')
const _ = require('lodash')

Test('Model.create', function(t) {
	t.plan(9 + 2 + 2 + 2)

	t.doesNotThrow(function() {
		const model = Model.create({
			name: 'test-model'
		})

		t.ok(_.isFunction(model.factory), 'returns an object with a factory method')
		t.ok(_.isFunction(model.defaults), 'returns an object with a defaults method')
		t.ok(_.isFunction(model.parse), 'returns an object with a parse method')
		t.ok(_.isFunction(model.serialize), 'returns an object with a serialize method')
		t.ok(_.isFunction(model.merge), 'returns an object with a merge method')
		t.ok(_.isFunction(model.instanceOf), 'returns an object with an instanceOf method')
		t.ok(_.isFunction(model.collectionOf), 'returns an object with a collectionOf method')
		t.ok(_.isFunction(model.schema), 'returns an object with a schema method')

	}, 'accepst a plain object spec with a name for the model')

	t.doesNotThrow(function() {
		const model = Model.create('test-model')

		t.equal(model.getName(), 'test-model', 'string as first argument is set as name of the model')
	}, 'accepts a name for the model')

	t.doesNotThrow(function() {
		const defaults = {
			a: 'some-value'
		}
		const model = Model.create({
			name: 'test-model',
			defaults: defaults
		})

		t.ok(Immutable.Map(defaults).equals(model.defaults()), 'some-value', 'returns an object with factory that uses specified defaults')
	}, 'accepts a plain object spec with a name and factory defaults')

	t.doesNotThrow(function() {
		const schema = { 
			foo: { 
				factory: (value) => 'bar' 
			}
		}

		const model = Model.create({
			name: 'test-model',
			schema: schema
		})

		t.deepEqual(model.schema(), schema, 'returns an object with schema method that returns the schema passed in')
	}, 'accepts a plain object spec with a name and schema')
})

Test('Model.parse', function(t) {
	t.plan(1 + 7)

	const OtherModel = Model.create({
		name: 'woo'
	})

	const inputA = 'a';
	const outputA = 'A';
	const outputB = 'B';
	const outputC = 'C';

	const schema = {
		a: {
			factory: (value) => {
				t.equal(inputA, value, 'factory is called with the untransformed value');
				
				return outputA;
			}
		},
		nested: {
			b: {
				factory: () => outputB
			}
		},
		multiple: [{
			factory: () => outputC 
		}],
		nestedModel: OtherModel,
		alreadyInstance: {
			factory() { return 'not-seen' },
			instanceOf() { return true }
		}
	}

	const TestModel = Model.create({
		name: 'testModel',
		schema: schema
	})

	t.doesNotThrow(() => {
		const attrs = {
			nonDefined: 'prop',
			a: inputA,
			nested: {
				b: 'a nested value'
			},
			nestedModel: {
				'a': 'aaa',
				'b': 'bbb'
			},
			alreadyInstance: 'already-what-it-should-be',
			multiple: ['values', 'array']
		}

		const instance = TestModel.factory(attrs)

		t.equal(instance.get('a'), outputA, 'value returned by factory of schema is used as value')
		t.equal(instance.get('nonDefined'), 'prop', 'parser ignores any attributes not defined in schema')
		t.equal(instance.getIn(['nested', 'b']), outputB, 'nested schema is applied to nested attributes')
		t.ok(
			Immutable.List(instance.get('multiple')) &&
			instance.get('multiple').count() === attrs.multiple.length &&
			instance.get('multiple').every(val => val === outputC)
		, 'arrays are cast as Lists and mapped with the factory of the type defintion')
		t.ok(OtherModel.instanceOf(instance.get('nestedModel')), 'Model definitions are valid type definitions')
		t.equal(instance.get('alreadyInstance'), attrs.alreadyInstance, 'mapping value with `factory` of type definition unless its `instanceOf` method returns truthy')

	}, 'accepts raw attributes in Seq')
})