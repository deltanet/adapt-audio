define([
	'coreJS/adapt'
], function(Adapt) {

	var ReducedTextModel = {

		isReducedTextEnabled: function() {
			return this.get("_audio")._reducedText && this.get("_audio")._reducedText._isEnabled;
		}

	};

	return ReducedTextModel;
});
