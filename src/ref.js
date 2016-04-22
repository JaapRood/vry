const Invariant = require('invariant');
const Immutable = require('immutable');
const State = require('./state');
const KeyPath = require('./key-path');

const internals = {};

exports = module.exports = internals.Ref = State.create('__reference', {
	path: null
});

internals.Ref.create = function(path) {
	path = KeyPath.parse(path);

	Invariant(KeyPath.isKeyPath(path), 'Path required to create a Ref');

	return internals.Ref.factory({
		path: path
	});
}

internals.Ref.resolve = function(ref, source) {
	Invariant(internals.Ref.instanceOf(ref), 'Ref is required to resolve a ref');
	Invariant(Immutable.Iterable.isIterable(source), 'Source state is required to resolve a ref');

	return source.getIn(ref.get('path'));
}

internals.Ref.resolveCollection = function(refs, source) {
	Invariant(internals.Ref.collectionOf(refs), 'Collection of Ref instances is required to resolve a collection of refs');
	Invariant(Immutable.Iterable.isIterable(source), 'Source state is required to resolve a collection of refs');

	return refs.map(ref => internals.Ref.resolve(ref, source));
}

internals.Ref.replaceIn = function(source, subject, path) {
	Invariant(Immutable.Iterable.isIterable(source), 'Root source is required to replace references in subject');
	Invariant(Immutable.Iterable.isIterable(subject), 'Subject source is required to replace references in subject');

	path = KeyPath.parse(path);

	Invariant(KeyPath.isKeyPath(path), 'Path required to replace references in a subject');

	return subject.updateIn(path, (maybeRef) => {
		if (internals.Ref.instanceOf(maybeRef)) {
			return internals.Ref.resolve(maybeRef, source);
		} else if (internals.Ref.collectionOf(maybeRef)) {
			return internals.Ref.resolveCollection(maybeRef, source);
		} else {
			return maybeRef;
		}
	});
}