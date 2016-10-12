define([
	'coreJS/adapt'
], function(Adapt) {

	var ReducedTextModel = {

		isReducedTextEnabled: function() {
			return this.get("_reducedText") && this.get("_reducedText")._isEnabled;
		}

	};

	return ReducedTextModel;
});
