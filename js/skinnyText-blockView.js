define([
	'coreJS/adapt',
	'coreViews/blockView'
], function(Adapt, AdaptBlockView) {

	var SkinnyTextBlockView = {

		events: {},

		preRender: function() {

            AdaptBlockView.prototype.preRender.call(this);
            if (this.model.isSkinnyTextEnabled()) this._skinnyTextBlockPreRender();

        },

        _skinnyTextBlockPreRender: function() {
        	
		},

		render: function() {

			if (this.model.isSkinnyTextEnabled()) {

				this._skinnyTextBlockRender();

			} else AdaptBlockView.prototype.render.call(this);
		
		},

		_skinnyTextBlockRender: function() {

            Adapt.trigger(this.constructor.type + 'View:preRender', this);

            var data = this.model.toJSON();
            var template = Handlebars.templates['skinnyText-block'];
            this.$el.html(template(data));

            this.addChildren();

            _.defer(_.bind(function() {
            	this._skinnyTextBlockPostRender();

            }, this));

            this.$el.addClass('skinnyText-enabled');

            this.delegateEvents();

            return this;
		},

		_skinnyTextBlockPostRender: function() {
			Adapt.trigger(this.constructor.type + 'View:postRender', this);
        }
		
	};

	return SkinnyTextBlockView;

});
