define(function(require) {

    var Adapt = require('coreJS/adapt');
    var Backbone = require('backbone');

    var AudioMenuView = Backbone.View.extend({

        className: "audio-controls",

        initialize: function () {
            this.listenTo(Adapt, 'remove', this.remove);
            this.listenTo(Adapt, 'accessibility:toggle', this.onAccessibilityToggle);
            this.listenTo(Adapt, 'audio:updateAudioStatus', this.updateToggle);
            this.listenToOnce(Adapt, "remove", this.removeInViewListeners);
            this.preRender();
            this.render();
        },

        events: {
            'click .audio-toggle': 'toggleAudio'
        },

        preRender: function() {
        },

        render: function () {
            var data = this.model.toJSON();
            var template = Handlebars.templates["audioMenu"];
            if(this.model.get('_audio')._location=="bottom-left" || this.model.get("_audio")._location=="bottom-right") {
                $(this.el).html(template(data)).appendTo('.menu');
            } else {
                $(this.el).html(template(data)).prependTo('.menu');
            }

            // Set vars
            this.audioChannel = this.model.get('_audio')._channel;
            this.elementId = this.model.get("_id");
            this.audioFile = this.model.get("_audio")._media.src;
            Adapt.audio.audioClip[this.audioChannel].newID = this.elementId;

            // Hide controls
            if(this.model.get('_audio')._showControls==false){
                this.$('.audio-toggle').addClass('hidden');
            }

            // Hide icon if audio is turned off
            if(Adapt.audio.audioClip[this.audioChannel].status==0){
                this.$('.audio-inner button').hide();
            }

            // Set listener for when clip ends
            $(Adapt.audio.audioClip[this.audioChannel]).on('ended', _.bind(this.onAudioEnded, this));

            // Play audio if autoplay is true
            if (Adapt.audio.autoPlayGlobal && this.model.get("_audio")._autoplay) {
                this.playAudio();
            }
        },

        onAudioEnded: function() {
            Adapt.trigger('audio:audioEnded', this.audioChannel);
        },

        stopPlayingAudio: function(event) {
            if (!Adapt.audio.audioClip[this.audioChannel].paused) {
                Adapt.trigger('audio:pauseAudio', this.audioChannel);
            }
        },

        playAudio: function() {
            // Check if audio is set to on
            if(Adapt.audio.audioClip[this.audioChannel].status==1){
                Adapt.trigger('audio:playAudio', this.audioFile, this.elementId, this.audioChannel);
            }
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
            } else {
                for (var i = 0; i < Adapt.audio.numChannels; i++) {
                    Adapt.trigger('audio:updateAudioStatus', this.audioChannel, 0);
                }
            }
        },

        updateToggle: function(){
            if(Adapt.audio.audioStatus == 1 && this.model.get('_audio')._showControls==true){
                this.$('.audio-toggle').removeClass('hidden');
            } else {
                this.$('.audio-toggle').addClass('hidden');
            }
        },

        removeInViewListeners: function () {
            this.$('.audio-inner').off('inview');
            Adapt.trigger('audio:pauseAudio', this.audioChannel);
        }
    });

    return AudioMenuView;

});
