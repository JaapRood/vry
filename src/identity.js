const Invariant = require('invariant')
const Immutable = require('immutable')

const Props = require('./props')

exports.hasIdentity = function(maybeIdentity) {
	return Immutable.Iterable.isIterable(maybeIdentity) &&
		maybeIdentity.has(Props.cid) &&
		maybeIdentity.has(Props.name);
}

exports.create = function(name) {
	Invariant(name && (typeof name === "string"), 'Name is required to create an identity');

	return {
		getName: () =>  name,
		
		hasIdentity: exports.hasIdentity,

		instanceOf(maybeInstance) {
			return this.hasIdentity(maybeInstance) && maybeInstance.get(Props.name) === name
		},

		collectionOf(maybeCollection) {
			return Immutable.Iterable.isIterable(maybeCollection) &&
				maybeCollection.every(this.instanceOf.bind(this));
		}
	}
}