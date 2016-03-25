const Invariant = require('invariant');
const Immutable = require('immutable');
const State = require('./state');
const KeyPath = require('./key-path');

exports = module.exports = internals.Ref = State.create('__reference', {
	path: null
});

internals.Ref.create = (path) => {
	path = KeyPath.parse(path);

	Invariant(KeyPath.isKeyPath(path), 'Path required to create a Ref');

	return internals.Ref.factory({
		path: path
	});
}