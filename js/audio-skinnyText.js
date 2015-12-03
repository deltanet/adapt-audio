define([
	'coreJS/adapt',
	'coreViews/articleView',
	'coreViews/blockView',
	'coreModels/articleModel',
	'coreModels/blockModel',
	'./skinnyText-articleView',
	'./skinnyText-articleModel',
	'./skinnyText-blockView',
	'./skinnyText-blockModel'
], function(Adapt, ArticleView, BlockView, ArticleModel, BlockModel, ArticleViewExtension, ArticleModelExtension, BlockViewExtension, BlockModelExtension) {

	//Extends core/js/views/articleView.js
	var ArticleViewInitialize = ArticleView.prototype.initialize;
	ArticleView.prototype.initialize = function(options) {
		if (this.model.get("_skinnyText")) {
			//extend the articleView with new functionality
			_.extend(this, ArticleViewExtension);
		}
		//initialize the article in the normal manner
		return ArticleViewInitialize.apply(this, arguments);
	};

	//Extends core/js/models/articleModel.js
	var ArticleModelInitialize = ArticleModel.prototype.initialize;
	ArticleModel.prototype.initialize = function(options) {
		if (this.get("_skinnyText")) {
			//extend the articleModel with new functionality
			_.extend(this, ArticleModelExtension);

			//initialize the article in the normal manner
			var returnValue = ArticleModelInitialize.apply(this, arguments);
			return returnValue;
		}
		//initialize the article in the normal manner if no assessment
		return ArticleModelInitialize.apply(this, arguments);
	};

	//Extends core/js/views/blockView.js
	var BlockViewInitialize = BlockView.prototype.initialize;
	BlockView.prototype.initialize = function(options) {
		if (this.model.get("_skinnyText")) {
			//extend the blockView with new functionality
			_.extend(this, BlockViewExtension);
		}
		//initialize the block in the normal manner
		return BlockViewInitialize.apply(this, arguments);
	};

	//Extends core/js/models/blockModel.js
	var BlockModelInitialize = BlockModel.prototype.initialize;
	BlockModel.prototype.initialize = function(options) {
		if (this.get("_skinnyText")) {
			//extend the blockModel with new functionality
			_.extend(this, BlockModelExtension);

			//initialize the block in the normal manner
			var returnValue = BlockModelInitialize.apply(this, arguments);
			return returnValue;
		}
		//initialize the block in the normal manner if no assessment
		return BlockModelInitialize.apply(this, arguments);
	};

});