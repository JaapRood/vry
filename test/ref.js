const Test = require('tape');
const Immutable = require('immutable');
const _isUndefined = require('lodash.isundefined');

const State = require('../lib/state');
const KeyPath = require('../lib/key-path');
const Ref = require('../lib/ref');

Test('Ref.create', function(t) {
	t.plan(4);

	t.doesNotThrow(function() {
		const path = ['a', 'b', 'c'];
		const ref = Ref.create(path);

		t.ok(Ref.instanceOf(ref), 'returns a Ref instance');
		t.ok(KeyPath.isKeyPath(ref.get('path')), 'returned instance has KeyPath instance as `path` prop');
		t.deepEqual(ref.get('path').toArray(), path, 'path of returned instance is equivalent to the one passed in');
	}, 'accepts any value that can be parsed as a KeyPath');

});

Test('Ref.resolve', function(t) {
	t.plan(3);

	const source = Immutable.Map({
		a: Immutable.Map({
			b: 'c'
		})
	})

	const ref = Ref.create(['a', 'b']);
	const invalidRef = Ref.create(['a', 'd', 'e']);

	t.doesNotThrow(function() {
		t.equal(Ref.resolve(ref, source), 'c', 'returns the value of the source, at the path specified by the ref');
		t.ok(_isUndefined(Ref.resolve(invalidRef, source)), 'returns undefined for refs with paths that do not exist in the source state');
	}, 'accepts a Ref instance and an immutable iterable');
});

Test('Ref.resolveCollection', function(t) {
	t.plan(4);

	const source = Immutable.Map({
		a: Immutable.Map({
			b: 'bb'
		}),
		c: 'cc'
	})

	const refs = Immutable.List([
		Ref.create(['a', 'b']),
		Ref.create('c'),
		Ref.create('d')
	])

	t.doesNotThrow(function() {
		const resolvedRefs = Ref.resolveCollection(refs, source);

		t.ok(
			Immutable.List.isList(resolvedRefs) &&
			resolvedRefs.count() === refs.count()
		, 'returns a map of the collection of references passed');

		t.ok(
			resolvedRefs.get(0) === 'bb' &&
			resolvedRefs.get(1) === 'cc'
		, 'returns the value of the source state that the reference path points to');

		t.ok(
			_isUndefined(resolvedRefs.get(2))
		, 'returns undefined for values that could not be found in the source state with the path of the reference');
	}, 'accepts a collection of Ref instances and immutable source state');
});

Test('Ref.replaceIn', function(t) {
	t.plan(3 + 2 + 2);

	const source = Immutable.Map({
		a: Immutable.Map({
			b: 'bb'
		}),
		c: 'cc'
	})

	const subject = Immutable.Map({
		id: 'some-subject',
		letterA: Ref.create(['a', 'b']),

		letters: Immutable.Map({
			a: Ref.create(['a', 'b']),
			c: Ref.create('c')
		}),

		notARef: 'other-value'
	})

	t.doesNotThrow(function() {
		const populatedSubject = Ref.replaceIn(source, subject, 'letterA');
		const expected = subject.set('letterA', source.getIn(['a', 'b']));

		t.ok(
			Immutable.Map.isMap(subject) &&
			populatedSubject.get('id') === subject.get('id')
		, 'returns an updated version of the subject');

		t.ok(
			populatedSubject.equals(expected)
		, 'returned subject has reference at path replaced by value that reference pointed to');

	}, 'accepts immutable source, immutable subject and a path to a reference in the subject');

	t.doesNotThrow(function() {
		const populatedSubject = Ref.replaceIn(source, subject, 'letters');
		const expected = subject.set('letters', Immutable.Map({
			a: source.getIn(['a', 'b']),
			c: source.get('c')
		}))

		t.ok(
			populatedSubject.equals(expected)
		, 'returned subject has collection of references at path replaced by map of the values it was referencing');

	}, 'accepts immutable source, immutable subject and a path to a collection of references in the subject');

	t.doesNotThrow(function() {
		const populatedSubject = Ref.replaceIn(source, subject, 'notARef');

		t.ok(
			populatedSubject.equals(subject)
		, 'value of subject at path that is not a reference is not replaced');
	}, 'accepts immutable source, immutable subject and path to a value that is not a reference or collection of references');
});
