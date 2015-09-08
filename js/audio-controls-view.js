/*
* adapt-audio
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Robert Peek <robert@delta-net.co.uk>
*/
define(function(require) {

    var Adapt = require('coreJS/adapt');
    var Backbone = require('backbone');

    var AudioControlsView = Backbone.View.extend({

        className: "audio-controls",

        initialize: function () {
            this.listenTo(Adapt, 'remove', this.remove);
            this.listenTo(Adapt, 'questionView:showFeedback', this.initQuestionFeedbackAudio);
            this.listenTo(Adapt, 'notify:closed', this.stopFeedbackAudio);
            this.listenTo(Adapt, 'accessibility:toggle', this.onAccessibilityToggle);
            this.listenToOnce(Adapt, "remove", this.removeInViewListeners);
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
                    $(this.el).html(template(data)).appendTo('.' + this.model.get("_id") + " > ."+this.model.get("_type")+"-inner");
                } else {
                    $(this.el).html(template(data)).prependTo('.' + this.model.get("_id") + " > ."+this.model.get("_type")+"-inner");
                }
            }

            // Set vars
            this.audioType = this.model.get("_audio")._type;
            this.elementId = this.model.get("_id");

            // Check for autoplay and show/hide controls
            if(this.model.get("_audio")._autoplay){
                this.$('.audio-toggle').addClass('fa-volume-up');
            } else {
                this.$('.audio-toggle').addClass('fa-volume-off');
            }
            if(this.model.get("_audio")._showControls==false){
                this.$('.audio-toggle').addClass('hidden');
            }
            // Set ID's for the Audio Model to reference.
            if(this.audioType == "narration"){
                // Determine which file to play
                if (Adapt.audio.narrationClip.canPlayType('audio/ogg')) this.audioFile = this.model.get("_audio")._media.ogg;
                if (Adapt.audio.narrationClip.canPlayType('audio/mpeg')) this.audioFile = this.model.get("_audio")._media.mp3;
                // Set clip ID
                Adapt.audio.narrationClip.newID = this.elementId;
                // Set listener for when clip ends
                $(Adapt.audio.narrationClip).on('ended', _.bind(this.onAudioNarrationEnded, this));
            }
            if(this.audioType == "music"){
                // Determine which file to play
                if (Adapt.audio.musicClip.canPlayType('audio/ogg')) this.audioFile = this.model.get("_audio")._media.ogg;
                if (Adapt.audio.musicClip.canPlayType('audio/mpeg')) this.audioFile = this.model.get("_audio")._media.mp3;
                // Set clip ID
                Adapt.audio.musicClip.newID = this.elementId;
                // Set listener for when clip ends
                $(Adapt.audio.musicClip).on('ended', _.bind(this.onAudioMusicEnded, this));
            }
            if(this.audioType == "effects"){
                // Determine which file to play
                if (Adapt.audio.effectsClip.canPlayType('audio/ogg')) this.audioFile = this.model.get("_audio")._media.ogg;
                if (Adapt.audio.effectsClip.canPlayType('audio/mpeg')) this.audioFile = this.model.get("_audio")._media.mp3;
                // Set clip ID
                Adapt.audio.effectsClip.newID = this.elementId;
                // Set listener for when clip ends
                $(Adapt.audio.effectsClip).on('ended', _.bind(this.onAudioEffectsEnded, this));
            }
            // Add inview listener on audio element
            this.$('.audio-inner').on('inview', _.bind(this.inview, this));

            _.defer(_.bind(function() {
                this.postRender();
            }, this));
        },

        postRender: function() {
            this.$('.audio-inner').on('inview', _.bind(this.inview, this));
        },

        onAudioNarrationEnded: function() {
            Adapt.trigger('audio:narrationEnded');
        },

        onAudioMusicEnded: function() {
            Adapt.trigger('audio:musicEnded');
        },

        onAudioEffectsEnded: function() {
            Adapt.trigger('audio:effectsEnded');
        },

        initQuestionFeedbackAudio: function() {
            if(this.model.get("_feedback")._audio) {
                // Correct
                if (this.model.get('_isCorrect')) {
                    // Determine which file to play
                    if (Adapt.audio.narrationClip.canPlayType('audio/ogg')) this.audioFile = this.model.get("_feedback")._audio._correct._media.ogg;
                    if (Adapt.audio.narrationClip.canPlayType('audio/mpeg')) this.audioFile = this.model.get("_feedback")._audio._correct._media.mp3;
                    //
                // Partly correct
                } else if (this.model.get('_isAtLeastOneCorrectSelection')) {
                    if (Adapt.audio.narrationClip.canPlayType('audio/ogg')) this.audioFile = this.model.get("_audio")._audio._partlyCorrect._final._media.ogg;
                    if (Adapt.audio.narrationClip.canPlayType('audio/mpeg')) this.audioFile = this.model.get("_feedback")._audio._partlyCorrect._final._media.mp3;
                // Incorrect
                } else {
                    // Determine which file to play
                    if (Adapt.audio.narrationClip.canPlayType('audio/ogg')) this.audioFile = this.model.get("_feedback")._audio._incorrect._final._media.ogg;
                    if (Adapt.audio.narrationClip.canPlayType('audio/mpeg')) this.audioFile = this.model.get("_feedback")._audio._incorrect._final._media.mp3;
                    //
                }
                // Trigger audio
                Adapt.trigger('audio:playNarrationAudio', this.audioFile, this.model.get('_id'));
            }
        },

        stopFeedbackAudio: function() {
            if(this.model.get("_feedback")._audio) {
                Adapt.trigger('audio:pauseNarrationAudio');
            }
        },

        inview: function(event, visible, visiblePartX, visiblePartY) {
            if (visible) {
                if (visiblePartY === 'top') {
                    this._isVisibleTop = true;
                } else if (visiblePartY === 'bottom') {
                    this._isVisibleBottom = true;
                } else {
                    this._isVisibleTop = true;
                    this._isVisibleBottom = true;
                }
                // Check if visible on screen
                if (this._isVisibleTop && this._isVisibleBottom) {
                    // Check what type of audio is being played
                    if(this.audioType == "narration"){
                        // Check if audio is set to on
                        if(Adapt.audio.narrationAudio==1){
                            // Check if audio is set to autoplay
                            if(this.model.get("_audio")._autoplay){
                                Adapt.trigger('audio:playNarrationAudio', this.audioFile, this.elementId);
                            }
                        }
                    }
                    if(this.audioType == "music"){
                        // Check if audio is set to on
                        if(Adapt.audio.musicAudio==1){
                            // Check if audio is set to autoplay
                            if(this.model.get("_audio")._autoplay){
                                Adapt.trigger('audio:playMusicAudio', this.audioFile, this.elementId);
                            }
                        }
                    }
                    if(this.audioType == "effects"){
                        // Check if audio is set to on
                        if(Adapt.audio.effectsAudio==1){
                            // Check if audio is set to autoplay
                            if(this.model.get("_audio")._autoplay){
                                Adapt.trigger('audio:playEffectsAudio', this.audioFile, this.elementId);
                            }
                        }
                    }
                }
            } else {
                if(this.audioType == "narration"){
                    Adapt.trigger('audio:pauseNarrationAudio');
                } else if (this.audioType == "music") {
                    Adapt.trigger('audio:pauseMusicAudio');
                } else if (this.audioType == "effects") {
                    Adapt.trigger('audio:pauseEffectsAudio');
                }
            }
        },

        toggleAudio: function(event) {
            if (event) event.preventDefault();
            // Check what type of audio is being played
            if(this.audioType == "narration"){
                if ($(event.currentTarget).hasClass('playing')) {
                    Adapt.trigger('audio:pauseNarrationAudio');
                } else {
                    Adapt.trigger('audio:playNarrationAudio', this.audioFile, this.elementId);
                }
            }
            if(this.audioType == "music"){
                if ($(event.currentTarget).hasClass('playing')) {
                    Adapt.trigger('audio:pauseMusicAudio');
                } else {
                    Adapt.trigger('audio:playMusicAudio', this.audioFile, this.elementId);
                }
            }
            if(this.audioType == "effects"){
                if ($(event.currentTarget).hasClass('playing')) {
                    Adapt.trigger('audio:pauseEffectsAudio');
                } else {
                    Adapt.trigger('audio:playEffectsAudio', this.audioFile, this.elementId);
                }
            }
        },

        onAccessibilityToggle: function() {
            var hasAccessibility = Adapt.config.has('_accessibility') && Adapt.config.get('_accessibility')._isEnabled;

            if (!hasAccessibility) {
                console.log("Accessibility is off");
            } else {
                console.log("Accessibility is on!!!!!");

                Adapt.trigger('audio:updateNarrationStatus', 0);
                Adapt.trigger('audio:updateEffectsStatus', 0);
                Adapt.trigger('audio:updateMusicStatus', 0);
            }
        },

        removeInViewListeners: function () { 
            this.$('.audio-inner').off('inview');
            if (this.audioType == "narration") {
                Adapt.trigger('audio:pauseNarrationAudio');
            } else if (this.audioType == "music") {
                Adapt.trigger('audio:pauseMusicAudio');
            } else if (this.audioType == "effects") {
                Adapt.trigger('audio:pauseEffectsAudio');
            }
        }

    });
    
    return AudioControlsView;

});