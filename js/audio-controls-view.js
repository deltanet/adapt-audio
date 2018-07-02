define(function(require) {

    var Adapt = require('coreJS/adapt');
    var Backbone = require('backbone');

    var AudioControlsView = Backbone.View.extend({

        className: "audio-controls",

        initialize: function() {
            this.listenTo(Adapt, 'remove', this.remove);
            this.listenTo(Adapt, 'device:changed', this.setAudioFile);
            this.listenTo(Adapt, 'questionView:showFeedback', this.initFeedback);
            this.listenTo(Adapt, 'popup:closed', this.stopFeedbackAudio);
            this.listenTo(Adapt, 'accessibility:toggle', this.onAccessibilityToggle);
            this.listenTo(Adapt, 'audio:updateAudioStatus', this.updateToggle);
            this.listenTo(Adapt, "audio:changeText", this.replaceText);
            this.listenToOnce(Adapt, "remove", this.removeInViewListeners);

            this.render();
        },

        events: {
            'click .audio-toggle': 'toggleAudio'
        },

        render: function() {
            var data = this.model.toJSON();
            var template = Handlebars.templates["audioControls"];

            if (this.model.get('_audio')._location == "bottom-left" || this.model.get("_audio")._location == "bottom-right") {
              $(this.el).html(template(data)).appendTo('.' + this.model.get('_id') + " > ." + this.model.get("_type") + "-inner");
            } else {
              $(this.el).html(template(data)).prependTo('.' + this.model.get("_id") + " > ." + this.model.get("_type") + "-inner");
            }
            // Add class so it can be referenced in the theme if needed
            $(this.el).addClass(this.model.get("_type") + "-audio");

            // Set vars
            this.audioChannel = this.model.get('_audio')._channel;
            this.elementId = this.model.get("_id");
            this.audioIcon = Adapt.audio.iconPlay;
            this.pausedTime = 0;
            this.onscreenTriggered = false;

            // Autoplay
            if (Adapt.audio.autoPlayGlobal || this.model.get("_audio")._autoplay) {
                this.canAutoplay = true;
            } else {
                this.canAutoplay = false;
            }

            // Autoplay once
            if (Adapt.audio.autoPlayOnceGlobal || this.model.get("_audio")._autoPlayOnce) {
                this.autoplayOnce = true;
            } else {
                this.autoplayOnce = false;
            }

            // Add audio icon
            this.$('.audio-toggle').addClass(this.audioIcon);

            this.updateToggle();

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
            // Add inview listener on audio element
            this.$('.audio-inner').on("onscreen", _.bind(this.onscreen, this));
            // Run function to check for reduced text
            this.replaceText(Adapt.audio.textSize);
        },

        setAudioFile: function() {
            // Set audio file based on the device size
            if (Adapt.device.screenSize === 'large') {
                try {
                    this.audioFile = this.model.get("_audio")._media.desktop;
                } catch (e) {
                    console.log('An error has occured loading audio');
                }
            } else {
                try {
                    this.audioFile = this.model.get("_audio")._media.mobile;
                } catch (e) {
                    console.log('An error has occured loading audio');
                }
            }
        },

        onAudioEnded: function() {
            Adapt.trigger('audio:audioEnded', this.audioChannel);
        },

        initFeedback: function(view) {
            // Run a check to trigger only the current elements feedback
            if (this.elementId == view.model.get('_id')) {
                if (this.model.get('_audio')._feedback && this.model.get('_audio')._feedback._isEnabled) {
                    this.initQuestionFeedbackAudio();
                }
            }
        },

        initQuestionFeedbackAudio: function() {
            // Reset onscreen id
            Adapt.audio.audioClip[this.audioChannel].onscreenID = "";
            // Correct
            if (this.model.get('_isCorrect')) {
                this.setupCorrectFeedback();
                // Partly correct
            } else if (this.model.get('_isAtLeastOneCorrectSelection')) {
                this.setupPartlyCorrectFeedback();
                // Incorrect
            } else {
                this.setupIncorrectFeedback();
            }

            if (Adapt.audio.audioClip[this.audioChannel].status == 1) {
                Adapt.trigger('audio:playAudio', this.audioFile, this.elementId, this.audioChannel);
            }

        },

        setupCorrectFeedback: function() {
            try {
                this.audioFile = this.model.get('_audio')._feedback._correct._correct;
            } catch (e) {
                console.log('An error has occured loading audio');
            }
            // Reduced text
            if (this.model.get('_audio')._reducedTextisEnabled && Adapt.audio.textSize == 1) {
                $('.notify').find('.notify-popup-body-inner').html(this.model.get('_audio')._feedback._correct.correctReduced).a11y_text();
            }
        },

        setupPartlyCorrectFeedback: function() {
            // Final
            if (this.model.get('_attemptsLeft') === 0 || !this.model.get('_audio')._feedback._partlyCorrect.notFinal) {
                if (this.model.get('_audio')._feedback._partlyCorrect.final) {
                    try {
                        this.audioFile = this.model.get('_audio')._feedback._partlyCorrect._final;
                    } catch (e) {
                        console.log('An error has occured loading audio');
                    }
                    // Reduced text
                    if (this.model.get('_audio')._reducedTextisEnabled && Adapt.audio.textSize == 1) {
                        $('.notify').find('.notify-popup-body-inner').html(this.model.get('_audio')._feedback._partlyCorrect.finalReduced).a11y_text();
                    }
                } else {
                    this.setupIncorrectFeedback();
                }
                // Not final
            } else {
                try {
                    this.audioFile = this.model.get('_audio')._feedback._partlyCorrect._notFinal;
                } catch (e) {
                    console.log('An error has occured loading audio');
                }
                // Reduced text
                if (this.model.get('_audio')._reducedTextisEnabled && Adapt.audio.textSize == 1) {
                    $('.notify').find('.notify-popup-body-inner').html(this.model.get('_audio')._feedback._partlyCorrect.notFinalReduced).a11y_text();
                }
            }
        },

        setupIncorrectFeedback: function() {
            // apply individual item feedback
            if (this.model.has('_selectedItems') && (this.model.get('_selectable') === 1) && this.model.get('_selectedItems')[0].feedback) {
                this.setupIndividualFeedbackAudio(this.model.get('_selectedItems')[0]._index);
            } else {
                // Final
                if (this.model.get('_attemptsLeft') === 0) {
                    try {
                        this.audioFile = this.model.get('_audio')._feedback._incorrect._final;
                    } catch (e) {
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
                    } catch (e) {
                        console.log('An error has occured loading audio');
                    }
                    // Reduced text
                    if (this.model.get('_audio')._reducedTextisEnabled && Adapt.audio.textSize == 1) {
                        $('.notify').find('.notify-popup-body-inner').html(this.model.get('_audio')._feedback._incorrect.notFinalReduced).a11y_text();
                    }
                }
            }
        },

        setupIndividualFeedbackAudio: function(item) {
            var itemArray = new Array();
            itemArray = this.model.get('_audio')._feedback._items;

            try {
                this.audioFile = itemArray[item]._src;
            } catch (e) {
                console.log('An error has occured loading audio');
            }
        },

        stopFeedbackAudio: function() {
            if (this.model.get('_audio')._feedback && this.model.get('_audio')._feedback._isEnabled) {
                Adapt.trigger('audio:pauseAudio', this.audioChannel);
            }
        },

        onscreen: function(event, measurements) {
            var visible = this.model.get('_isVisible');
            var isOnscreenY = measurements.percentFromTop < Adapt.audio.triggerPosition && measurements.percentFromTop > 0;
            var isOnscreenX = measurements.percentInviewHorizontal == 100;
            var isOnscreen = measurements.onscreen;

            // Check for element coming on screen
            if (visible && isOnscreenY && isOnscreenX && this.canAutoplay && this.onscreenTriggered == false) {
              // Check if audio is set to on
              if (Adapt.audio.audioClip[this.audioChannel].status == 1) {
                this.setAudioFile();
                Adapt.trigger('audio:playAudio', this.audioFile, this.elementId, this.audioChannel);
              }
              // Set to false to stop autoplay when onscreen again
              if (this.autoplayOnce) {
                this.canAutoplay = false;
              }
              // Set to true to stop onscreen looping
              this.onscreenTriggered = true;
            }
            // Check when element is off screen
            if (visible && isOnscreen == false) {
              this.onscreenTriggered = false;
              Adapt.trigger('audio:onscreenOff', this.elementId, this.audioChannel);
            }
        },

        toggleAudio: function(event) {
            if (event) event.preventDefault();
            this.setAudioFile();
            Adapt.audio.audioClip[this.audioChannel].onscreenID = "";
            if ($(event.currentTarget).hasClass('playing')) {
              this.pauseAudio();
            } else {
              this.playAudio();
            }
        },

        playAudio: function() {
          // iOS requires direct user interaction on a button to enable autoplay
          // Re-use code from main adapt-audio.js playAudio() function

          // Stop audio
          Adapt.audio.audioClip[this.audioChannel].pause();
          // Update previous player
          $('#'+Adapt.audio.audioClip[this.audioChannel].playingID).removeClass(Adapt.audio.iconPause);
          $('#'+Adapt.audio.audioClip[this.audioChannel].playingID).addClass(Adapt.audio.iconPlay);
          $('#'+Adapt.audio.audioClip[this.audioChannel].playingID).removeClass('playing');

          this.$('.audio-toggle').removeClass(Adapt.audio.iconPlay);
          this.$('.audio-toggle').addClass(Adapt.audio.iconPause);
          this.$('.audio-toggle').addClass('playing');

          Adapt.audio.audioClip[this.audioChannel].prevID = Adapt.audio.audioClip[this.audioChannel].playingID;
          Adapt.audio.audioClip[this.audioChannel].src = this.audioFile;
          Adapt.audio.audioClip[this.audioChannel].newID = this.elementId;

          if (Adapt.audio.pauseStopAction == "pause") {
            Adapt.audio.audioClip[this.audioChannel].play(this.pausedTime);
          } else {
            Adapt.audio.audioClip[this.audioChannel].play();
          }

          Adapt.audio.audioClip[this.audioChannel].onscreenID = this.elementId;
          Adapt.audio.audioClip[this.audioChannel].playingID = Adapt.audio.audioClip[this.audioChannel].newID;
          Adapt.audio.audioClip[this.audioChannel].isPlaying = true;
          Adapt.audio.autoPlayOnIOS = true;
        },

        pauseAudio: function() {
            if (Adapt.audio.pauseStopAction == "pause") {
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

            if (!hasAccessibility) {} else {

                for (var i = 0; i < Adapt.audio.numChannels; i++) {
                    Adapt.trigger('audio:updateAudioStatus', this.audioChannel, 0);
                }
            }
        },

        updateToggle: function() {
          // Reset width
            var width = 0;

            if (Adapt.audio.audioClip[this.audioChannel].status == 1 && this.model.get('_audio')._showControls == true) {
                this.$('.audio-inner button').show();
                width = this.$('.audio-toggle').outerWidth();
            } else {
                this.$('.audio-inner button').hide();
            }

            var direction = "right";
            if (Adapt.config.get('_defaultDirection') == 'rtl') {
                direction = "left";
            }

            // Set padding on title or body
            if (this.model.get('displayTitle') == "") {
              $('.'+this.elementId).find('.'+this.model.get("_type")+'-body-inner').css("padding-"+direction, width);
            } else {
              $('.'+this.elementId).find('.'+this.model.get("_type")+'-title-inner').css("padding-"+direction, width);
            }
        },

        removeInViewListeners: function() {
            this.$('.audio-inner').off('onscreen');
        },

        replaceText: function(value) {
            // If enabled
            if (Adapt.course.get("_audio") && Adapt.course.get("_audio")._reducedTextisEnabled && this.model.get('_audio') && this.model.get('_audio')._reducedTextisEnabled) {

                // Article
                if (this.model.get("_type") == "article") {
                    if (value == 0) {
                        $('.' + this.model.get('_id')).find('.article-title-inner').html(this.stringReplace(this.model.get('displayTitle'))).a11y_text();
                        $('.' + this.model.get('_id')).find('.article-body-inner').html(this.stringReplace(this.model.get('body'))).a11y_text();
                    } else {
                        $('.' + this.model.get('_id')).find('.article-title-inner').html(this.stringReplace(this.model.get('_audio').displayTitleReduced)).a11y_text();
                        $('.' + this.model.get('_id')).find('.article-body-inner').html(this.stringReplace(this.model.get('_audio').bodyReduced)).a11y_text();
                    }
                }

                // Block
                if (this.model.get("_type") == "block") {
                    if (value == 0) {
                        $('.' + this.model.get('_id')).find('.block-title-inner').html(this.stringReplace(this.model.get('displayTitle'))).a11y_text();
                        $('.' + this.model.get('_id')).find('.block-body-inner').html(this.stringReplace(this.model.get('body'))).a11y_text();
                    } else {
                        $('.' + this.model.get('_id')).find('.block-title-inner').html(this.stringReplace(this.model.get('_audio').displayTitleReduced)).a11y_text();
                        $('.' + this.model.get('_id')).find('.block-body-inner').html(this.stringReplace(this.model.get('_audio').bodyReduced)).a11y_text();
                    }
                }

                // Component
                if (this.model.get("_type") == "component") {
                    if (value == 0) {
                        $('.' + this.model.get('_id')).find('.component-title-inner').html(this.stringReplace(this.model.get('displayTitle'))).a11y_text();
                        $('.' + this.model.get('_id')).find('.component-body-inner').html(this.stringReplace(this.model.get('body'))).a11y_text();
                    } else {
                        $('.' + this.model.get('_id')).find('.component-title-inner').html(this.stringReplace(this.model.get('_audio').displayTitleReduced)).a11y_text();
                        $('.' + this.model.get('_id')).find('.component-body-inner').html(this.stringReplace(this.model.get('_audio').bodyReduced)).a11y_text();
                    }
                }
            }
        },

        stringReplace: function(text) {
          // Check for _globals._learnerInfo elements
          // name
          var newText = text.replace(/{{_globals._learnerInfo.name}}/g, Adapt.course.get('_globals')._learnerInfo.name);
          // firstname
          newText = newText.replace(/{{_globals._learnerInfo.firstname}}/g, Adapt.course.get('_globals')._learnerInfo.firstname);
          // lastname
          newText = newText.replace(/{{_globals._learnerInfo.lastname}}/g, Adapt.course.get('_globals')._learnerInfo.lastname);

          return newText;
        }

    });

    return AudioControlsView;

});
