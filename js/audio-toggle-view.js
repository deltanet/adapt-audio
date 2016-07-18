define(function(require) {

    var Adapt = require('coreJS/adapt');
    var Backbone = require('backbone');

    var AudioToggleView = Backbone.View.extend({

        className: 'audio-toggle',

        initialize: function() {
            this.listenTo(Adapt, 'remove', this.remove);
            this.listenTo(Adapt, 'audio:updateAudioStatus', this.updateToggle);
            this.render();
        },

        events: {
            "click .audio-nav-toggle":"toggleAudio"
        },

        render: function() {
            var data = this.model.toJSON();
            var template = Handlebars.templates["audioToggle"];
            this.$el.html(template(data)).appendTo('#wrapper'+'>.navigation'+'>.navigation-inner');

            // Check for audio being on
            if(Adapt.audio.audioStatus == 1){
                this.$('.audio-nav-toggle').addClass(Adapt.audio.iconOn);
            } else {
                this.$('.audio-nav-toggle').addClass(Adapt.audio.iconOff);
            }

            return this;
        },

        updateToggle: function(){
            // Update based on overall audio status
            if(Adapt.audio.audioStatus == 1){
                this.$('.audio-nav-toggle').removeClass(Adapt.audio.iconOff);
                this.$('.audio-nav-toggle').addClass(Adapt.audio.iconOn);
            } else {
                this.$('.audio-nav-toggle').removeClass(Adapt.audio.iconOn);
                this.$('.audio-nav-toggle').addClass(Adapt.audio.iconOff);
            }
        },

        toggleAudio: function(event) {
            if (event) event.preventDefault();

            Adapt.trigger('audio:showAudioDrawer');
        }

    });

    return AudioToggleView;

});