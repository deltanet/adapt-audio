define([
	'coreJS/adapt',
	'coreViews/componentView'
], function(Adapt, AdaptComponentView) {

	var SkinnyTextComponentView = {

		events: {},

		preRender: function() {

            AdaptComponentView.prototype.preRender.call(this);
            if (this.model.isSkinnyTextEnabled()) this._skinnyTextComponentPreRender();

        },

        _skinnyTextComponentPreRender: function() {
        	
		},

		render: function() {

			if (this.model.isSkinnyTextEnabled()) {

				this._skinnyTextComponentRender();

			} else AdaptComponentView.prototype.render.call(this);
		
		},

		_skinnyTextComponentRender: function() {

			console.log("_skinnyTextComponentRender");

            Adapt.trigger(this.constructor.type + 'View:preRender', this);

            var data = this.model.toJSON();
            var template = Handlebars.templates['skinnyText-component'];
            this.$el.html(template(data));

            this.addChildren();

            _.defer(_.bind(function() {
            	this._skinnyTextComponentPostRender();

            }, this));

            this.$el.addClass('skinnyText-enabled');

            this.delegateEvents();

            return this;
		},

		_skinnyTextComponentPostRender: function() {
			console.log("_skinnyTextComponentPostRender");
			Adapt.trigger(this.constructor.type + 'View:postRender', this);
        }
		
	};

	return SkinnyTextComponentView;

});
