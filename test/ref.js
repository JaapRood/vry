const Test = require('tape');
const Immutable = require('immutable');
const _ = require('lodash');

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
