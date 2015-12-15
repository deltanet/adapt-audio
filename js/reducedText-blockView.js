define([
	'coreJS/adapt',
	'coreViews/blockView'
], function(Adapt, AdaptBlockView) {

	var ReducedTextBlockView = {

		events: {},

		preRender: function() {

            AdaptBlockView.prototype.preRender.call(this);
            if (this.model.isReducedTextEnabled()) this._reducedTextBlockPreRender();

        },

		_reducedTextBlockPreRender: function() {
        	this._reducedTextBlockSetupEventListeners();
		},

		_reducedTextBlockSetupEventListeners: function() {
			this.listenTo(Adapt, "audio:changeText", this._replaceText);
		},

		render: function() {

			if (this.model.isReducedTextEnabled()) {

				this._reducedTextBlockRender();

			} else AdaptBlockView.prototype.render.call(this);
		
		},

		_reducedTextBlockRender: function() {

            Adapt.trigger(this.constructor.type + 'View:preRender', this);

            var data = this.model.toJSON();
            var template = Handlebars.templates['reducedText-block'];
            this.$el.html(template(data));

            this.addChildren();

            _.defer(_.bind(function() {
            	this._reducedTextBlockPostRender();

            }, this));

            this.$el.addClass('reducedText-enabled');

            this.delegateEvents();

            return this;
		},

		_reducedTextBlockPostRender: function() {
			Adapt.trigger(this.constructor.type + 'View:postRender', this);
        },

        _replaceText: function(value) {
        	if(value == 0) {
        		this.$('.block-title-inner').html(this.model.get('displayTitle')).a11y_text();
            	this.$('.block-body-inner').html(this.model.get('body')).a11y_text();
        	} else {
        		this.$('.block-title-inner').html(this.model.get('displayTitleReduced')).a11y_text();
            	this.$('.block-body-inner').html(this.model.get('bodyReduced')).a11y_text();
        	}
        }
		
	};

	return ReducedTextBlockView;

});
