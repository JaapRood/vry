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

internals.Ref.replaceIn = function(source, subject, ...paths) {
	Invariant(Immutable.Iterable.isIterable(source), 'Root source is required to replace references in subject');
	Invariant(Immutable.Iterable.isIterable(subject), 'Subject source is required to replace references in subject');

	paths = Immutable.List(paths).map(KeyPath.parse);

	Invariant(paths.every(KeyPath.isKeyPath), 'Path(s) required to replace references in a subject')

	return paths.reduce((subj, path) => {
		const nextKey = path.first();
		const restPath = path.rest();

		return subj.update(nextKey, (maybeRef) => {
			var value;

			if (internals.Ref.instanceOf(maybeRef)) {
				value = internals.Ref.resolve(maybeRef, source);
			} else if (internals.Ref.collectionOf(maybeRef)) {
				value = internals.Ref.resolveCollection(maybeRef, source);
			} else {
				value = maybeRef;
			}

			if (restPath.count() && Immutable.Iterable.isIterable(value)) {
				return internals.Ref.replaceIn(source, value, restPath);
			} else {
				return value;
			}
		});
	}, subject);

}