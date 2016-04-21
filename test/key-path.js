const Test = require('tape');
const Immutable = require('immutable');

const KeyPath = require('../lib/key-path');

Test('KeyPath.isKeyPath', function(t) {
	t.plan(4);

	const keyPath = Immutable.List(['some', 'path', 'somewhere']);

	t.doesNotThrow(function() {
		t.equal(KeyPath.isKeyPath(keyPath), true, 'returns true when value is an Immutable Iterable containing strings');
		t.equal(KeyPath.isKeyPath(Immutable.List()), true, 'returns true for an empty Immutable Iterable');
		t.equal(KeyPath.isKeyPath('just a string'), false, 'returns false for just a string');
	}, 'accepts any value as an argument');
});

Test('KeyPath.parse', function(t) {
	t.plan(3 + 3);

	t.doesNotThrow(function() {
		const stringPath = 'a-single-property';
		const keyPath = KeyPath.parse(stringPath);

		t.ok(KeyPath.isKeyPath(keyPath), 'returns a key path when passing a string');
		t.ok(
			keyPath.first() === stringPath &&
			keyPath.count() === 1
		, 'returned key path has passed string as first and only element in the key path');
	}, 'accepts a string');

	t.doesNotThrow(function() {
		const arrayPath = ['a', 'b', 'c'];
		const keyPath = KeyPath.parse(arrayPath);

		t.ok(KeyPath.isKeyPath(keyPath), 'returns a KeyPath');
		t.deepEqual(arrayPath, keyPath.toArray(), 'returned key path is the array converted to an Immutable Iterable');
	}, 'accepts an array of strings');
});