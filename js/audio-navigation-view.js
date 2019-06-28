define([
    'core/js/adapt'
], function(Adapt) {

    var AudioNavigationView = Backbone.View.extend({

        className: 'audio-navigation',

        initialize: function() {
            this.listenTo(Adapt, {
                "audio:updateAudioStatus": this.updateToggle,
                "accessibility:toggle": this.onAccessibilityToggle
            });

            this.render();
        },

        events: {
            "click .audio-button":"toggleAudio"
        },

        render: function() {
            var data = this.model.toJSON();
            var template = Handlebars.templates["audioNavigation"];

            this.$el.html(template({
                audioToggle:data
            }));

            // Check for audio being on
            if(Adapt.audio.audioStatus == 1){
                this.$('.audio-button').addClass(Adapt.audio.iconOn);
            } else {
                this.$('.audio-button').addClass(Adapt.audio.iconOff);
            }

            if (!Adapt.course.get('_audio')._showOnNavbar) {
                this.$el.addClass('hidden');
            }

            return this;
        },

        updateToggle: function(){
            // Update based on overall audio status
            if(Adapt.audio.audioStatus == 1){
                this.$('.audio-button').removeClass(Adapt.audio.iconOff);
                this.$('.audio-button').addClass(Adapt.audio.iconOn);
            } else {
                this.$('.audio-button').removeClass(Adapt.audio.iconOn);
                this.$('.audio-button').addClass(Adapt.audio.iconOff);
            }
        },

        toggleAudio: function(event) {
            if (event) event.preventDefault();

            Adapt.trigger('audio:showAudioDrawer');
        },

        onAccessibilityToggle: function() {
          if (Adapt.config.has('_accessibility') && Adapt.config.get('_accessibility')._isEnabled) {

            if (Adapt.config.get('_accessibility')._isActive) {

              this.$el.addClass('hidden');

              for (var i = 0; i < Adapt.audio.numChannels; i++) {
                Adapt.trigger('audio:updateAudioStatus', i, 0);
              }

              Adapt.trigger('popup:closed');
              Adapt.trigger('notify:closed');

            } else {
              // Set defaults
              if (Adapt.course.get('_audio')._showOnNavbar) {
                this.$el.removeClass('hidden');
              }

              Adapt.trigger('audio:updateAudioStatus', 0, Adapt.course.get('_audio')._channels._narration._status);
              Adapt.trigger('audio:updateAudioStatus', 1, Adapt.course.get('_audio')._channels._effects._status);
              Adapt.trigger('audio:updateAudioStatus', 2, Adapt.course.get('_audio')._channels._music._status);

              Adapt.audio.audioStatus = Adapt.course.get('_audio')._channels._narration._status;
            }
          }
        }

    });

    return AudioNavigationView;

});
