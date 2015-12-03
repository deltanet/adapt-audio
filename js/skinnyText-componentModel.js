define([
	'coreJS/adapt'
], function(Adapt) {

	var SkinnyTextModel = {

		isSkinnyTextEnabled: function() {
			return this.get("_skinnyText") && this.get("_skinnyText")._isEnabled;
		}

	};

	return SkinnyTextModel;
});
