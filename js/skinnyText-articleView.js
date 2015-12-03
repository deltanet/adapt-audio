define([
	'coreJS/adapt',
	'coreViews/articleView'
], function(Adapt, AdaptArticleView) {

	var SkinnyTextArticleView = {

		events: {},

		preRender: function() {

            AdaptArticleView.prototype.preRender.call(this);
            if (this.model.isSkinnyTextEnabled()) this._skinnyTextArticlePreRender();

        },

        _skinnyTextArticlePreRender: function() {
        	this._skinnyTextArticleSetupEventListeners();
		},

		_skinnyTextArticleSetupEventListeners: function() {
			this.listenTo(Adapt, "audio:changeText", this._replaceText);
		},

		render: function() {

			if (this.model.isSkinnyTextEnabled()) {

				this._skinnyTextArticleRender();

			} else AdaptArticleView.prototype.render.call(this);
		
		},

		_skinnyTextArticleRender: function() {

            Adapt.trigger(this.constructor.type + 'View:preRender', this);

            var data = this.model.toJSON();
            var template = Handlebars.templates['skinnyText-article'];
            this.$el.html(template(data));

            this.addChildren();

            _.defer(_.bind(function() {
            	this._skinnyTextArticlePostRender();

            }, this));

            this.$el.addClass('skinnyText-enabled');

            this.delegateEvents();

            return this;
		},

		_skinnyTextArticlePostRender: function() {
			Adapt.trigger(this.constructor.type + 'View:postRender', this);
        },

        _replaceText: function(value) {
        	if(value == 0) {
        		this.$('.article-title-inner').html(this.model.get('displayTitle')).a11y_text();
            	this.$('.article-body-inner').html(this.model.get('body')).a11y_text();
        	} else {
        		this.$('.article-title-inner').html(this.model.get('displayTitleSkinny')).a11y_text();
            	this.$('.article-body-inner').html(this.model.get('bodySkinny')).a11y_text();
        	}
        }
		
	};

	return SkinnyTextArticleView;

});
