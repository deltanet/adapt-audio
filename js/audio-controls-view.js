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
            this.listenTo(Adapt, 'audio:updateAudioStatus', this.updateToggle);
            this.listenTo(Adapt, "audio:changeText", this.replaceText);
            this.listenTo(Adapt, "pageView:ready", this.render);
            this.listenToOnce(Adapt, "remove", this.removeInViewListeners);
        },

        events: {
            'click .audio-toggle': 'toggleAudio'
        },

        render: function () {
            var data = this.model.toJSON();
            var template = Handlebars.templates["audioControls"];
            if(this.model.get('_audio')._location=="bottom-left" || this.model.get("_audio")._location=="bottom-right") {
                $(this.el).html(template(data)).appendTo('.' + this.model.get('_id') + " > ."+this.model.get("_type")+"-inner");
            } else {
                $(this.el).html(template(data)).prependTo('.' + this.model.get("_id") + " > ."+this.model.get("_type")+"-inner");
            }
            // Add class so it can be referenced in the theme if needed
            $(this.el).addClass(this.model.get("_type")+"-audio");

            // Set vars
            this.audioChannel = this.model.get('_audio')._channel;
            this.elementId = this.model.get("_id");
            this.audioIcon = Adapt.audio.iconPlay;
            this.pausedTime = "";

            this.autoplayOnce = this.model.get('_audio')._autoPlayOnce;

            if(Adapt.audio.autoPlayGlobal && this.model.get("_audio")._autoplay){
                this.canAutoplay = true;
            } else {
                this.canAutoplay = false;
            }

            // Add audio icon
            this.$('.audio-toggle').addClass(this.audioIcon);

            // Hide controls if set in JSON or if audio is turned off
            if(this.model.get('_audio')._showControls==false || Adapt.audio.audioClip[this.audioChannel].status==0){
                this.$('.audio-inner button').hide();
            }

            // Set audio file
            this.setAudioFile();

            // Set clip ID
            Adapt.audio.audioClip[this.audioChannel].newID = this.elementId;

            // Set listener for when clip ends
            $(Adapt.audio.audioClip[this.audioChannel]).on('ended', _.bind(this.onAudioEnded, this));

            _.defer(_.bind(function() {
                this.postRender();
            }, this));
        },

        postRender: function() {
          // Add inview listener on entire element
          this.$('.audio-inner').on('inview', _.bind(this.inview, this));
          // Run function to check for reduced text
          this.replaceText(Adapt.audio.textSize);
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

        initFeedback: function(view) {
            // Run a check to trigger only the current elements feedback
            if(this.elementId == view.model.get('_id')) {
                if(this.model.get('_audio')._feedback && this.model.get('_audio')._feedback._isEnabled) {
                    this.initQuestionFeedbackAudio();
                }
            }
        },

        initQuestionFeedbackAudio: function() {
            // Correct
            if (this.model.get('_isCorrect')) {

                try {
                    this.audioFile = this.model.get('_audio')._feedback._correct._correct;
                } catch(e) {
                    console.log('An error has occured loading audio');
                }
                // Reduced text
                if (this.model.get('_audio')._reducedTextisEnabled && Adapt.audio.textSize == 1) {
                    $('.notify').find('.notify-popup-body-inner').html(this.model.get('_audio')._feedback._correct.correctReduced).a11y_text();
                }

            // Partly correct
            } else if (this.model.get('_isAtLeastOneCorrectSelection')) {
                // Final
                if (this.model.get('_attemptsLeft') === 0) {
                    try {
                        this.audioFile = this.model.get('_audio')._feedback._partlyCorrect._final;
                    } catch(e) {
                        console.log('An error has occured loading audio');
                    }
                    // Reduced text
                    if (this.model.get('_audio')._reducedTextisEnabled && Adapt.audio.textSize == 1) {
                        $('.notify').find('.notify-popup-body-inner').html(this.model.get('_audio')._feedback._partlyCorrect.finalReduced).a11y_text();
                    }
                // Not final
                } else {
                    try {
                        this.audioFile = this.model.get('_audio')._feedback._partlyCorrect._notFinal;
                    } catch(e) {
                        console.log('An error has occured loading audio');
                    }
                    // Reduced text
                    if (this.model.get('_audio')._reducedTextisEnabled && Adapt.audio.textSize == 1) {
                        $('.notify').find('.notify-popup-body-inner').html(this.model.get('_audio')._feedback._partlyCorrect.notFinalReduced).a11y_text();
                    }
                }

            // Incorrect
            } else {
                // Final
                if (this.model.get('_attemptsLeft') === 0) {
                    try {
                        this.audioFile = this.model.get('_audio')._feedback._incorrect._final;
                    } catch(e) {
                        console.log('An error has occured loading audio');
                    }
                    // Reduced text
                    if (this.model.get('_audio')._reducedTextisEnabled && Adapt.audio.textSize == 1) {
                        $('.notify').find('.notify-popup-body-inner').html(this.model.get('_audio')._feedback._incorrect.finalReduced).a11y_text();
                    }
                // Not final
                } else {
                    try {
                        this.audioFile = this.model.get('_audio')._feedback._incorrect._notFinal;
                    } catch(e) {
                        console.log('An error has occured loading audio');
                    }
                    // Reduced text
                    if (this.model.get('_audio')._reducedTextisEnabled && Adapt.audio.textSize == 1) {
                        $('.notify').find('.notify-popup-body-inner').html(this.model.get('_audio')._feedback._incorrect.notFinalReduced).a11y_text();
                    }
                }

            }

            if(Adapt.audio.audioClip[this.audioChannel].status==1){
                Adapt.trigger('audio:playAudio', this.audioFile, this.elementId, this.audioChannel);
            }

        },

        stopFeedbackAudio: function() {
            if(this.model.get('_audio')._feedback && this.model.get('_audio')._feedback._isEnabled) {
                Adapt.trigger('audio:pauseAudio', this.audioChannel);
            }
        },

        stopPlayingAudio: function(event) {
            if (!Adapt.audio.audioClip[this.audioChannel].paused) {
                Adapt.trigger('audio:pauseAudio', this.audioChannel);
            }
        },

        inview: function(event, visible, visiblePartX, visiblePartY) {
            if (visible && this.canAutoplay) {
                if (visiblePartY === 'top') {
                    this._isVisibleTop = true;
                } else if (visiblePartY === 'bottom') {
                    this._isVisibleBottom = true;
                } else {
                    this._isVisibleTop = true;
                    this._isVisibleBottom = true;
                }
                // Check if visible on screen
                if (this._isVisibleTop && this._isVisibleBottom && (visiblePartX === "both")) {
                    // Check if audio is set to on
                    if(Adapt.audio.audioClip[this.audioChannel].status==1){
                      this.setAudioFile();
                      Adapt.trigger('audio:playAudio', this.audioFile, this.elementId, this.audioChannel);
                    }
                    // Set to false to stop autoplay when inview again
                    if(this.autoplayOnce) {
                        this.canAutoplay = false;
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
              this.pauseAudio();
            } else {
              this.playAudio();
            }
        },

        playAudio: function () {
          if(Adapt.audio.pauseStopAction == "pause") {
            Adapt.audio.audioClip[this.audioChannel].play(this.pausedTime);
            this.$('.audio-toggle').removeClass(Adapt.audio.iconPlay);
            this.$('.audio-toggle').addClass(Adapt.audio.iconPause);
            this.$('.audio-toggle').addClass('playing');
          } else {
            Adapt.trigger('audio:playAudio', this.audioFile, this.elementId, this.audioChannel);
          }
        },

        pauseAudio: function () {
          if(Adapt.audio.pauseStopAction == "pause") {
            this.pausedTime = Adapt.audio.audioClip[this.audioChannel].currentTime;
            Adapt.audio.audioClip[this.audioChannel].pause();
            this.$('.audio-toggle').removeClass(Adapt.audio.iconPause);
            this.$('.audio-toggle').addClass(Adapt.audio.iconPlay);
            this.$('.audio-toggle').removeClass('playing');
          } else {
            Adapt.trigger('audio:pauseAudio', this.audioChannel);
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
            if(Adapt.audio.audioClip[this.audioChannel].status == 1 && this.model.get('_audio')._showControls == true){
                this.$('.audio-inner button').show();
            } else {
                this.$('.audio-inner button').hide();
            }
        },

        removeInViewListeners: function () {
            this.$('.audio-inner').off('inview');
            Adapt.trigger('audio:pauseAudio', this.audioChannel);
        },

        replaceText: function(value) {
            // If enabled
            if (Adapt.course.get("_audio") && Adapt.course.get("_audio")._reducedTextisEnabled && this.model.get('_audio') && this.model.get('_audio')._reducedTextisEnabled) {

                // Article
                if(this.model.get("_type") == "article"){
                    if(value == 0) {
                        $('.'+this.model.get('_id')).find('.article-title-inner').html(this.model.get('displayTitle')).a11y_text();
                        $('.'+this.model.get('_id')).find('.article-body-inner').html(this.model.get('body')).a11y_text();
                    } else {
                        $('.'+this.model.get('_id')).find('.article-title-inner').html(this.model.get('_audio').displayTitleReduced).a11y_text();
                        $('.'+this.model.get('_id')).find('.article-body-inner').html(this.model.get('_audio').bodyReduced).a11y_text();
                    }
                }

                // Block
                if(this.model.get("_type") == "block"){
                    if(value == 0) {
                        $('.'+this.model.get('_id')).find('.block-title-inner').html(this.model.get('displayTitle')).a11y_text();
                        $('.'+this.model.get('_id')).find('.block-body-inner').html(this.model.get('body')).a11y_text();
                    } else {
                        $('.'+this.model.get('_id')).find('.block-title-inner').html(this.model.get('_audio').displayTitleReduced).a11y_text();
                        $('.'+this.model.get('_id')).find('.block-body-inner').html(this.model.get('_audio').bodyReduced).a11y_text();
                    }
                }

                // Component
                if(this.model.get("_type") == "component"){
                    if(value == 0) {
                        $('.'+this.model.get('_id')).find('.component-title-inner').html(this.model.get('displayTitle')).a11y_text();
                        $('.'+this.model.get('_id')).find('.component-body-inner').html(this.model.get('body')).a11y_text();
                    } else {
                        $('.'+this.model.get('_id')).find('.component-title-inner').html(this.model.get('_audio').displayTitleReduced).a11y_text();
                        $('.'+this.model.get('_id')).find('.component-body-inner').html(this.model.get('_audio').bodyReduced).a11y_text();
                    }
                }
            }
        }
    });

    return AudioControlsView;

});
