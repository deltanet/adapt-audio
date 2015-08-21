define(function(require) {

	var Handlebars = require('handlebars');

	Handlebars.registerHelper('if_collection_contains', function(collection, attribute, value, block) {
		var makeBlockVisible = false;

		_.each(collection, function(audio) {
			if (audio[attribute] === value) {
				makeBlockVisible = true;
			}
		});
		if(makeBlockVisible) {
            return block.fn(this);
        } else {
            return block.inverse();
        }
    });

    Handlebars.registerHelper('if_collection_contains_only_one_item', function(collection, attribute, block) {
		var attributeCount = [];

		_.each(collection, function(audio) {
			var resourceAttribute = audio[attribute];
			if (_.indexOf(attributeCount, resourceAttribute) === -1) {
				attributeCount.push(resourceAttribute);
			}
		});

		if (attributeCount.length <= 1) {
			return block.fn(this);
		} else {
			return block.inverse(this);
		}

    });

    Handlebars.registerHelper('return_column_layout_from_collection_length', function(collection, attribute) {
		var attributeCount = [];

		_.each(collection, function(audio) {
			var resourceAttribute = audio[attribute];
			if (_.indexOf(attributeCount, resourceAttribute) === -1) {
				attributeCount.push(resourceAttribute);
			}
		});

		return (attributeCount.length + 1);

    });

})
	