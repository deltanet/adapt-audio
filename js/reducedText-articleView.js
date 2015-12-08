define([
	'coreJS/adapt',
	'coreViews/articleView'
], function(Adapt, AdaptArticleView) {

	var ReducedTextArticleView = {

		events: {},

		preRender: function() {

            AdaptArticleView.prototype.preRender.call(this);
            if (this.model.isReducedTextEnabled()) this._reducedTextArticlePreRender();

        },

        _reducedTextArticlePreRender: function() {
        	this._reducedTextArticleSetupEventListeners();
		},

		_reducedTextArticleSetupEventListeners: function() {
			this.listenTo(Adapt, "audio:changeText", this._replaceText);
		},

		render: function() {

			if (this.model.isReducedTextEnabled()) {

				this._reducedTextArticleRender();

			} else AdaptArticleView.prototype.render.call(this);
		
		},

		_reducedTextArticleRender: function() {

            Adapt.trigger(this.constructor.type + 'View:preRender', this);

            var data = this.model.toJSON();
            var template = Handlebars.templates['reducedText-article'];
            this.$el.html(template(data));

            this.addChildren();

            _.defer(_.bind(function() {
            	this._reducedTextArticlePostRender();

            }, this));

            this.$el.addClass('reducedText-enabled');

            this.delegateEvents();

            return this;
		},

		_reducedTextArticlePostRender: function() {
			Adapt.trigger(this.constructor.type + 'View:postRender', this);
        },

        _replaceText: function(value) {
        	if(value == 0) {
        		this.$('.article-title-inner').html(this.model.get('displayTitle')).a11y_text();
            	this.$('.article-body-inner').html(this.model.get('body')).a11y_text();
        	} else {
        		this.$('.article-title-inner').html(this.model.get('displayTitleReduced')).a11y_text();
            	this.$('.article-body-inner').html(this.model.get('bodyReduced')).a11y_text();
        	}
        }
		
	};

	return ReducedTextArticleView;

});
