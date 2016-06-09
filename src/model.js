const internals = {}

exports.isModel = (maybeModel) => {}

exports.create = (name, schema) => {
	// verify schema

	const defaults = Schema.getDefaults(schema)

	const identity = Identity.create(name)
	const factory = Factory.create(defaults)

	const modelPrototype = _assign(
		Identity.create(name),
		Factory.create(defaults),
		internals.createParser(schema),
		internals.createMerger(schema),
		intenrals.createSerializer(serializer)
	)

	let model = Object.create(modelPrototype)
	
	return model
}