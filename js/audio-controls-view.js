define([
    'core/js/adapt'
], function(Adapt) {

    var AudioControlsView = Backbone.View.extend({

        className: "audio-controls",

        initialize: function() {
            this.listenTo(Adapt, {
                "remove": this.remove,
                "device:changed": this.setAudioFile,
                "questionView:showFeedback": this.initFeedback,
                "popup:opened notify:opened": this.popupOpened,
                "popup:closed": this.stopFeedbackAudio,
                "audio:updateAudioStatus device:resize": this.updateToggle,
                "audio:configured": this.audioConfigured,
                "audio:changeText": this.replaceText
            });

            this.listenToOnce(Adapt, "remove", this.removeInViewListeners);

            // Set vars
            this.audioChannel = this.model.get('_audio')._channel;
            this.elementId = this.model.get("_id");
            this.elementType = this.model.get("_type");
            this.audioIcon = Adapt.audio.iconPlay;
            this.pausedTime = 0;
            this.onscreenTriggered = false;
            this.popupIsOpen = false;

            this.render();
        },

        events: {
            'click .audio-toggle': 'toggleAudio'
        },

        render: function() {
            var data = this.model.toJSON();
            var template = Handlebars.templates["audioControls"];

            if (this.model.get('_audio')._location == "bottom-left" || this.model.get("_audio")._location == "bottom-right") {
              $(this.el).html(template(data)).appendTo('.'+this.model.get('_id')+">."+this.elementType+"-inner");
            } else {
              $(this.el).html(template(data)).prependTo('.'+this.model.get("_id")+">."+this.elementType+"-inner");
            }
            // Add class so it can be referenced in the theme if needed
            $(this.el).addClass(this.elementType+"-audio");

            // Sound effects
            var audioFeedbackModel = new Backbone.Model(this.model.get('_audio')._feedback);
            if (audioFeedbackModel.has('_soundEffect')) {
              this.audioEffectsEnabled = this.model.get('_audio')._feedback._soundEffect._isEnabled;
              this.audioEffectsChannel = 1;
              this.audioEffectsFile = "";
            } else {
              this.audioEffectsEnabled = false;
            }

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
            this.updateToggle();
            // Run function to check for reduced text
            this.replaceText(Adapt.audio.textSize);

            this.isAnimating = $('.'+this.elementId).hasClass('animate-hidden');

            if (this.isAnimating) {
              this.listenTo(this.model, 'change:_isAnimating', this.checkOnscreen);
            }

            // Add inview listener on audio element
            if (!Adapt.audio.isConfigured) return;

            _.delay(_.bind(function() {
                $('.'+this.model.get('_id')).on('onscreen', _.bind(this.onscreen, this));
            }, this), 1000);
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

        popupOpened: function() {
            this.popupIsOpen = true;
        },

        audioConfigured: function() {
            _.delay(_.bind(function() {
                this.popupIsOpen = false;
                $('.'+this.model.get('_id')).on('onscreen', _.bind(this.onscreen, this));
            }, this), 500);
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

            // Effects audio
            if (this.audioEffectsEnabled && Adapt.audio.audioClip[this.audioEffectsChannel].status == 1) {
              Adapt.trigger('audio:playAudio', this.audioEffectsFile, null, this.audioEffectsChannel);
            }
        },

        setupCorrectFeedback: function() {
            try {
                this.audioFile = this.model.get('_audio')._feedback._correct._correct;
            } catch (e) {
                console.log('An error has occured loading audio');
            }
            // Effects audio
            if (this.audioEffectsEnabled) {
              this.audioEffectsFile = this.model.get('_audio')._feedback._soundEffect._correct;
            }
            // Reduced text
            if (this.model.get('_audio')._reducedTextisEnabled && Adapt.audio.textSize == 1) {
                $('.notify').find('.notify-popup-body-inner').html(this.model.get('_audio')._feedback._correct.correctReduced);
            }
        },

        setupPartlyCorrectFeedback: function() {
            // Final
            if (this.model.get('_attemptsLeft') === 0 || !this.model.get('_audio')._feedback._partlyCorrect._notFinal) {
                if (this.model.get('_audio')._feedback._partlyCorrect._final) {
                    try {
                        this.audioFile = this.model.get('_audio')._feedback._partlyCorrect._final;
                    } catch (e) {
                        console.log('An error has occured loading audio');
                    }
                    // Effects audio
                    if (this.audioEffectsEnabled) {
                      this.audioEffectsFile = this.model.get('_audio')._feedback._soundEffect._partlyCorrect;
                    }
                    // Reduced text
                    if (this.model.get('_audio')._reducedTextisEnabled && Adapt.audio.textSize == 1) {
                        $('.notify').find('.notify-popup-body-inner').html(this.model.get('_audio')._feedback._partlyCorrect.finalReduced);
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
                // Effects audio
                if (this.audioEffectsEnabled) {
                  this.audioEffectsFile = this.model.get('_audio')._feedback._soundEffect._partlyCorrect;
                }
                // Reduced text
                if (this.model.get('_audio')._reducedTextisEnabled && Adapt.audio.textSize == 1) {
                    $('.notify').find('.notify-popup-body-inner').html(this.model.get('_audio')._feedback._partlyCorrect.notFinalReduced);
                }
            }
        },

        setupIncorrectFeedback: function() {
            // apply individual item feedback
            var items = this.model.get('_audio')._feedback._items ? this.model.get('_audio')._feedback._items : [];

            if (this.model.get('_selectable') === 1 && items.length > 0) {
                this.setupIndividualFeedbackAudio();
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
                        $('.notify').find('.notify-popup-body-inner').html(this.model.get('_audio')._feedback._incorrect.finalReduced);
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
                        $('.notify').find('.notify-popup-body-inner').html(this.model.get('_audio')._feedback._incorrect.notFinalReduced);
                    }
                }
            }
            // Effects audio
            if (this.audioEffectsEnabled) {
              this.audioEffectsFile = this.model.get('_audio')._feedback._soundEffect._incorrect;
            }
        },

        setupIndividualFeedbackAudio: function(item) {
            var activeItem = this.getActiveItem();
            var index = activeItem.get('_index');
            var itemArray = this.model.get('_audio')._feedback._items;
            this.audioFile = itemArray[index]._src;
        },

        getActiveItem: function() {
            return this.model.get('_children').findWhere({ _isActive: true });
        },

        stopFeedbackAudio: function() {
            this.popupIsOpen = false;

            if (this.model.get('_audio')._feedback && this.model.get('_audio')._feedback._isEnabled) {
                Adapt.trigger('audio:pauseAudio', this.audioChannel);

                if (this.audioEffectsEnabled) {
                  Adapt.trigger('audio:pauseAudio', this.audioEffectsChannel);
                }
            }
        },

        onscreen: function(event, measurements) {
            if (this.popupIsOpen) return;

            var visible = this.model.get('_isVisible');
            var isOnscreenX = measurements.percentInviewHorizontal == 100;
            var isOnscreen = measurements.onscreen;

            var elementTopOnscreenY = measurements.percentFromTop < Adapt.audio.triggerPosition && measurements.percentFromTop > 0;
            var elementBottomOnscreenY = measurements.percentFromTop < Adapt.audio.triggerPosition && measurements.percentFromBottom < (100 - Adapt.audio.triggerPosition);

            var isOnscreenY = elementTopOnscreenY || elementBottomOnscreenY;

            // Check for element coming on screen
            if (visible && isOnscreen && isOnscreenY && isOnscreenX && this.canAutoplay && !this.onscreenTriggered && !this.isAnimating) {
              // Check if audio is set to on
              if (Adapt.audio.audioClip[this.audioChannel].status == 1) {
                this.setAudioFile();

                // Check for component items
                if (this.elementType === 'component' && !this.model.get('_isQuestionType') && this.model.get('_children')) {
                  var itemIndex = this.getActiveItemIndex();
                  var currentItem = this.model.get('_items')[itemIndex];

                  if (itemIndex > 0) {
                    this.audioFile = currentItem._audio.src;
                  }
                }

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
            if (visible && (!isOnscreenY || !isOnscreenX)) {
              this.onscreenTriggered = false;
              Adapt.trigger('audio:onscreenOff', this.elementId, this.audioChannel);
            }
        },

        checkOnscreen: function() {
          this.isAnimating = this.model.get('_isAnimating');

          $('.'+this.model.get('_id')).on('onscreen', _.bind(this.onscreen, this));
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

          Adapt.trigger("media:stop");

          // Stop audio
          Adapt.audio.audioClip[this.audioChannel].pause();
          Adapt.audio.audioClip[this.audioChannel].isPlaying = false;

          // Update previous player if there is one
          if (Adapt.audio.audioClip[this.audioChannel].playingID) {
            $('#'+Adapt.audio.audioClip[this.audioChannel].playingID).removeClass(Adapt.audio.iconPause);
            $('#'+Adapt.audio.audioClip[this.audioChannel].playingID).addClass(Adapt.audio.iconPlay);
            $('#'+Adapt.audio.audioClip[this.audioChannel].playingID).removeClass('playing');
          }

          this.$('.audio-toggle').removeClass(Adapt.audio.iconPlay);
          this.$('.audio-toggle').addClass(Adapt.audio.iconPause);
          this.$('.audio-toggle').addClass('playing');

          Adapt.audio.audioClip[this.audioChannel].prevID = Adapt.audio.audioClip[this.audioChannel].playingID;
          Adapt.audio.audioClip[this.audioChannel].src = this.audioFile;

          // Check for component items
          if (this.elementType === 'component' && !this.model.get('_isQuestionType') && this.model.get('_children')) {
            var itemIndex = this.getActiveItemIndex();
            var currentItem = this.model.get('_items')[itemIndex];

            if (itemIndex > 0) {
              Adapt.audio.audioClip[this.audioChannel].src = currentItem._audio.src;
            }
          }

          Adapt.audio.audioClip[this.audioChannel].newID = this.elementId;

          if (Adapt.audio.pauseStopAction == "pause") {
            Adapt.audio.audioClip[this.audioChannel].play(this.pausedTime);
            this.$('.audio-toggle').attr('aria-label', $.a11y_normalize(Adapt.audio.pauseAriaLabel));
          } else {
            Adapt.audio.audioClip[this.audioChannel].play();
            this.$('.audio-toggle').attr('aria-label', $.a11y_normalize(Adapt.audio.stopAriaLabel));
          }

          Adapt.audio.audioClip[this.audioChannel].onscreenID = this.elementId;
          Adapt.audio.audioClip[this.audioChannel].playingID = Adapt.audio.audioClip[this.audioChannel].newID;
          Adapt.audio.audioClip[this.audioChannel].isPlaying = true;
        },

        pauseAudio: function() {
            if (Adapt.audio.pauseStopAction == "pause") {
                this.pausedTime = Adapt.audio.audioClip[this.audioChannel].currentTime;
                Adapt.audio.audioClip[this.audioChannel].pause();
                Adapt.audio.audioClip[this.audioChannel].isPlaying = false;
                this.$('.audio-toggle').removeClass(Adapt.audio.iconPause);
                this.$('.audio-toggle').addClass(Adapt.audio.iconPlay);
                this.$('.audio-toggle').removeClass('playing');
            } else {
                Adapt.trigger('audio:pauseAudio', this.audioChannel);
            }
            this.$('.audio-toggle').attr('aria-label', $.a11y_normalize(Adapt.audio.playAriaLabel));
        },

        updateToggle: function() {
            if (Adapt.audio.audioClip[this.audioChannel].status == 1 && this.model.get('_audio')._showControls == true) {
                this.$('.audio-inner button').show();

                var outerWidth = this.$('.audio-toggle').outerWidth();
                var elementWidth = $('.'+this.elementId).find('.'+this.elementType+'-header').outerWidth();
                var padding = outerWidth - this.$('.audio-toggle').width();
                var maxWidth = (elementWidth - outerWidth) - padding;

                // Set width on elements title or body
                if (this.model.get('displayTitle') == "") {
                  $('.'+this.elementId).find('.'+this.elementType+'-body-inner').css("max-width", maxWidth);
                } else {
                  $('.'+this.elementId).find('.'+this.elementType+'-title-inner').css("max-width", maxWidth);
                }

            } else {
                this.$('.audio-inner button').hide();
                // Reset
                $('.'+this.elementId).find('.'+this.elementType+'-body-inner').css("max-width", "");
                $('.'+this.elementId).find('.'+this.elementType+'-title-inner').css("max-width", "");
            }
        },

        getActiveItemIndex: function() {
          var activeItem = this.model.get('_children').findWhere({ _isActive: true });

          if (activeItem) {
            var index = activeItem.get('_index');
            return index;
          } else {
            return 0;
          }
        },

        removeInViewListeners: function() {
            $('.'+this.model.get('_id')).off('onscreen');
        },

        replaceText: function(value) {
            // If enabled
            if (Adapt.course.get("_audio") && Adapt.course.get("_audio")._reducedTextisEnabled && this.model.get('_audio') && this.model.get('_audio')._reducedTextisEnabled) {

                // Article
                if (this.elementType == "article") {
                    if (value == 0) {
                        $('.' + this.model.get('_id')).find('.article-title-inner').html(this.stringReplace(this.model.get('displayTitle')));
                        $('.' + this.model.get('_id')).find('.article-body-inner').html(this.stringReplace(this.model.get('body')));
                    } else {
                        $('.' + this.model.get('_id')).find('.article-title-inner').html(this.stringReplace(this.model.get('_audio').displayTitleReduced));
                        $('.' + this.model.get('_id')).find('.article-body-inner').html(this.stringReplace(this.model.get('_audio').bodyReduced));
                    }
                }

                // Block
                if (this.elementType == "block") {
                    if (value == 0) {
                        $('.' + this.model.get('_id')).find('.block-title-inner').html(this.stringReplace(this.model.get('displayTitle')));
                        $('.' + this.model.get('_id')).find('.block-body-inner').html(this.stringReplace(this.model.get('body')));
                    } else {
                        $('.' + this.model.get('_id')).find('.block-title-inner').html(this.stringReplace(this.model.get('_audio').displayTitleReduced));
                        $('.' + this.model.get('_id')).find('.block-body-inner').html(this.stringReplace(this.model.get('_audio').bodyReduced));
                    }
                }

                // Component
                if (this.elementType == "component") {
                    if (value == 0) {
                        $('.' + this.model.get('_id')).find('.component-title-inner').html(this.stringReplace(this.model.get('displayTitle')));
                        $('.' + this.model.get('_id')).find('.component-body-inner').html(this.stringReplace(this.model.get('body')));
                    } else {
                        $('.' + this.model.get('_id')).find('.component-title-inner').html(this.stringReplace(this.model.get('_audio').displayTitleReduced));
                        $('.' + this.model.get('_id')).find('.component-body-inner').html(this.stringReplace(this.model.get('_audio').bodyReduced));
                    }
                }
            }
        },

        stringReplace: function(text) {
          if (!Adapt.course.get('_globals')._learnerInfo) return text;

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
