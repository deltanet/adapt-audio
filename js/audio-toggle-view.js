define(function(require) {

    var Adapt = require('coreJS/adapt');
    var Backbone = require('backbone');

    var AudioToggleView = Backbone.View.extend({

        className: 'audioToggle',

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

            // Check for any channel being on
            for (var i = 0; i < Adapt.audio.numChannels; i++) {
                if(Adapt.audio.audioClip[i].status==1){
                    this.$('.audio-nav-toggle').addClass('fa-volume-up');
                } else {
                    this.$('.audio-nav-toggle').addClass('fa-volume-off');
                }
            }
            return this;
        },

        updateToggle: function(){
            // Check for any channel being on
            for (var i = 0; i < Adapt.audio.numChannels; i++) {
                if(Adapt.audio.audioClip[i].status==1){
                    this.$('.audio-nav-toggle').removeClass('fa-volume-off');
                    this.$('.audio-nav-toggle').addClass('fa-volume-up');
                } else {
                    this.$('.audio-nav-toggle').removeClass('fa-volume-up');
                    this.$('.audio-nav-toggle').addClass('fa-volume-off');
                }
            }
        },

        toggleAudio: function(event) {
            if (event) event.preventDefault();
            // Pause all channels and set each channel to off
            if(Adapt.audio.audioStatus == 1){
                for (var i = 0; i < Adapt.audio.numChannels; i++) {
                    Adapt.trigger('audio:pauseAudio', i);
                    Adapt.audio.audioClip[i].status = 0;
                }
                // Turn audio off
                Adapt.audio.audioStatus = 0;
            } else {
                for (var i = 0; i < Adapt.audio.numChannels; i++) {
                    Adapt.trigger('audio:pauseAudio', i);
                    Adapt.audio.audioClip[i].status = 1;
                }
                // Turn audio on
                Adapt.audio.audioStatus = 1;
            }
            this.updateToggle();
        }

    });

    return AudioToggleView;

});