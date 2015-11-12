define(function(require) {

    var Adapt = require('coreJS/adapt');
    var Backbone = require('backbone');

    var AudioMenuView = Backbone.View.extend({

        className: "audio-controls",

        initialize: function () {
            this.listenTo(Adapt, 'remove', this.remove);
            this.listenTo(Adapt, 'accessibility:toggle', this.onAccessibilityToggle);
            this.preRender();
            this.render();
        },

        events: {
            "click .audio-toggle":"toggleAudio"
        },

        preRender: function() {
        },

        render: function () {

            var data = this.model.toJSON();
            var template = Handlebars.templates["audioControls"];

            if (this.model.get("_audio")._isEnabled) {
                if(this.model.get("_audio")._location=="bottom-left" || this.model.get("_audio")._location=="bottom-right") {
                    this.$el.html(template(data)).appendTo('#wrapper'+'>.menu'+'>.menu-container'+'>.menu-container-inner');
                } else {
                    this.$el.html(template(data)).prependTo('#wrapper'+'>.menu'+'>.menu-container'+'>.menu-container-inner');
                }
            }

            // Set vars
            this.audioChannel = this.model.get("_audio")._channel;
            this.elementId = this.model.get("_id");

            // Hide controls
            if(this.model.get("_audio")._showControls==false){
                this.$('.audio-toggle').addClass('hidden');
            }
            // Determine which file to play
            if (Adapt.audio.audioClip[this.audioChannel].canPlayType('audio/ogg')) this.audioFile = this.model.get("_audio")._media.ogg;
            if (Adapt.audio.audioClip[this.audioChannel].canPlayType('audio/mpeg')) this.audioFile = this.model.get("_audio")._media.mp3;
            // Set clip ID
            Adapt.audio.audioClip[this.audioChannel].newID = this.elementId;
            // Set listener for when clip ends
            $(Adapt.audio.audioClip[this.audioChannel]).on('ended', _.bind(this.onAudioEnded, this));
            // Play audio if set to autoplay
            if(Adapt.audio.audioClip[this.audioChannel].status==1){
                if(this.model.get("_audio")._autoplay){
                    Adapt.trigger('audio:playAudio', this.audioFile, this.elementId, this.audioChannel);
                }
            }

            _.defer(_.bind(function() {
                this.postRender();
            }, this));
        },

        postRender: function() {},

        onAudioEnded: function() {
            Adapt.trigger('audio:audioEnded', this.audioChannel);
        },

        toggleAudio: function(event) {
            if (event) event.preventDefault();

            if ($(event.currentTarget).hasClass('playing')) {
                Adapt.trigger('audio:pauseAudio', this.audioChannel);
            } else {
                Adapt.trigger('audio:playAudio', this.audioFile, this.elementId, this.audioChannel);
            }
        },

        onAccessibilityToggle: function() {
            var hasAccessibility = Adapt.config.has('_accessibility') && Adapt.config.get('_accessibility')._isEnabled;

            if (!hasAccessibility) {
                console.log("Accessibility is off");
            } else {
                console.log("Accessibility is on");

                for (var i = 0; i < Adapt.audio.numChannels; i++) {
                    Adapt.trigger('audio:updateAudioStatus', this.audioChannel, 0);
                }
            }
        }

    });
    
    return AudioMenuView;

});