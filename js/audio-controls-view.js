define(function(require) {

    var Adapt = require('coreJS/adapt');
    var Backbone = require('backbone');

    var AudioControlsView = Backbone.View.extend({

        className: "audio-controls",

        initialize: function () {
            this.listenTo(Adapt, 'remove', this.remove);
            this.listenTo(Adapt, 'device:changed', this.reRender);
            this.listenTo(Adapt, 'questionView:showFeedback', this.initFeedback);
            this.listenTo(Adapt, 'notify:closed', this.stopFeedbackAudio);
            this.listenTo(Adapt, 'accessibility:toggle', this.onAccessibilityToggle);
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
            var template = Handlebars.templates["audioControls"];
            if (this.model.get('_audio') && this.model.get('_audio')._isEnabled) {
                if(this.model.get('_audio')._location=="bottom-left" || this.model.get("_audio")._location=="bottom-right") {
                    $(this.el).html(template(data)).appendTo('.' + this.model.get('_id') + " > ."+this.model.get("_type")+"-inner");
                } else {
                    $(this.el).html(template(data)).prependTo('.' + this.model.get("_id") + " > ."+this.model.get("_type")+"-inner");
                }
            }
            // Add class so it can be referenced in the theme if needed 
            $(this.el).addClass(this.model.get("_type")+"-audio");

            // Set vars
            this.audioChannel = this.model.get('_audio')._channel;
            this.elementId = this.model.get("_id");

            // Hide controls
            if(this.model.get('_audio')._showControls==false){
                this.$('.audio-toggle').addClass('hidden');
            }
            // Set audio file
            this.setAudioFile();

            // Set clip ID
            Adapt.audio.audioClip[this.audioChannel].newID = this.elementId;
            // Set listener for when clip ends
            // TODO this should not be in the render function as it is called for each instance on the page
            $(Adapt.audio.audioClip[this.audioChannel]).on('ended', _.bind(this.onAudioEnded, this));        

            _.defer(_.bind(function() {
                this.postRender();
            }, this));
        },

        postRender: function() {
            // Add inview listener on audio element
            this.$('.audio-inner').on('inview', _.bind(this.inview, this));
        },

        reRender: function() {
            this.setAudioFile();
        },

        setAudioFile: function() {
            // Set audio file based on the device size
            if (Adapt.device.screenSize === 'large') {
                try {
                    this.audioFile = this.model.get("_audio")._media.desktop;
                } catch(e) {
                    console.log('An error has occured loading audio');
                }
            } else {
                try {
                    this.audioFile = this.model.get("_audio")._media.mobile;
                } catch(e) {
                    console.log('An error has occured loading audio');
                }
            }
        },

        onAudioEnded: function() {
            Adapt.trigger('audio:audioEnded', this.audioChannel);
        },

        initFeedback: function() {
            // Run a check to trigger only the current clip's feedback
            if(this.elementId == Adapt.audio.audioClip[this.audioChannel].newID) {
                if(this.model.has('_feedback') && this.model.get('_feedback')._audio) {
                    this.initQuestionFeedbackAudio();
                }
            }
        },

        initQuestionFeedbackAudio: function() {
            // Correct
            if (this.model.get('_isCorrect')) {

                try {
                    this.audioFile = this.model.get('_feedback')._audio._correct._media.src;
                } catch(e) {
                    console.log('An error has occured loading audio');
                }

            // Partly correct
            } else if (this.model.get('_isAtLeastOneCorrectSelection')) {

                try {
                    this.audioFile = this.model.get('_feedback')._audio._partlyCorrect._final._media.src;
                } catch(e) {
                    console.log('An error has occured loading audio');
                }

            // Incorrect
            } else {

                try {
                    this.audioFile = this.model.get('_feedback')._audio._incorrect._final._media.src;
                } catch(e) {
                    console.log('An error has occured loading audio');
                }
            }
            if(Adapt.audio.audioClip[this.audioChannel].status==1){
                Adapt.trigger('audio:playAudio', this.audioFile, this.elementId, this.audioChannel);
            }
        },

        stopFeedbackAudio: function() {
            if(this.model.get('_feedback') && this.model.get('_feedback')._audio) {
                Adapt.trigger('audio:pauseAudio', this.audioChannel);
            }
        },

        stopPlayingAudio: function(event) {
            if (!Adapt.audio.audioClip[this.audioChannel].paused) {
                Adapt.trigger('audio:pauseAudio', this.audioChannel);
            }
        },

        inview: function(event, visible, visiblePartX, visiblePartY) {
            if (visible && Adapt.audio.autoPlayGlobal && this.model.get("_audio")._autoplay) {
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
                    // Check if audio is set to on
                    if(Adapt.audio.audioClip[this.audioChannel].status==1){
                        this.setAudioFile();
                        Adapt.trigger('audio:playAudio', this.audioFile, this.elementId, this.audioChannel);
                    }
                }
            } else {
                Adapt.trigger('audio:inviewOff', this.elementId, this.audioChannel);
            }
        },

        toggleAudio: function(event) {
            if (event) event.preventDefault();
            this.setAudioFile();
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

        removeInViewListeners: function () { 
            this.$('.audio-inner').off('inview');
            Adapt.trigger('audio:pauseAudio', this.audioChannel);
        }

    });
    
    return AudioControlsView;

});