define(function(require) {

    var Adapt = require('coreJS/adapt');
    var Backbone = require('backbone');

    var AudioToggleView = Backbone.View.extend({

        className: 'audio-toggle',

        initialize: function() {
            this.listenTo(Adapt, 'remove', this.remove);
            this.render();
        },

        events: {
            "click .audio-nav-toggle":"toggleAudio"
        },

        render: function() {
            var data = this.model.toJSON();
            var template = Handlebars.templates["audioToggle"];
            this.$el.html(template(data)).appendTo('#wrapper'+'>.navigation'+'>.navigation-inner');

            this.$('.audio-nav-toggle').addClass(Adapt.audio.iconOn);

            return this;
        },

        toggleAudio: function(event) {
            if (event) event.preventDefault();

            Adapt.trigger('audio:showAudioDrawer');
        }

    });

    return AudioToggleView;

});