import Adapt from 'core/js/adapt';
import a11y from 'core/js/a11y';
import device from 'core/js/device';

export default class AudioControlsView extends Backbone.View {

  className() {
    return 'audio';
  }

  events() {
    return {
      'click .js-audio-toggle': 'toggleAudio'
    };
  }

  initialize() {
    this.listenTo(Adapt, {
      'remove': this.remove,
      'device:changed': this.setAudioFile,
      'questionView:showFeedback': this.initFeedback,
      'popup:opened notify:opened': this.popupOpened,
      'popup:closed': this.stopFeedbackAudio,
      'audio:updateAudioStatus device:resize': this.onDeviceResize,
      'device:changed': this.onDeviceChanged,
      'audio:configured': this.audioConfigured,
      'audio:changeText': this.replaceText
    });

    this.listenToOnce(Adapt, 'remove', this.removeInViewListeners);

    this.listenTo(this.model, 'change:_component', this.remove);

    // Set vars
    this.audioChannel = this.model.get('_audio')._channel;
    this.elementId = this.model.get('_id');
    this.elementType = this.model.get('_type');
    this.audioIcon = Adapt.audio.iconPlay;
    this.pausedTime = 0;
    this.onscreenTriggered = false;
    this.popupIsOpen = false;

    this.render();
  }

  render() {
    const data = this.model.toJSON();
    const template = Handlebars.templates['audioControls'];

    if (this.model.get('_audio')._location == 'bottom-left' || this.model.get('_audio')._location == 'bottom-right') {
      $(this.el).html(template(data)).appendTo('.'+this.model.get('_id')+'>.'+this.elementType+'__inner');
    } else {
      $(this.el).html(template(data)).prependTo('.'+this.model.get('_id')+'>.'+this.elementType+'__inner');
    }
    // Add class so it can be referenced in the theme if needed
    $(this.el).addClass(this.elementType+'-audio');

    // Sound effects
    const audioFeedbackModel = new Backbone.Model(this.model.get('_audio')._feedback);
    if (audioFeedbackModel.has('_soundEffect')) {
      this.audioEffectsEnabled = this.model.get('_audio')._feedback._soundEffect._isEnabled;
      this.audioEffectsChannel = 1;
      this.audioEffectsFile = "";
    } else {
      this.audioEffectsEnabled = false;
    }

    // Autoplay
    if (Adapt.audio.autoPlayGlobal || this.model.get('_audio')._autoplay) {
      this.canAutoplay = true;
    } else {
      this.canAutoplay = false;
    }

    // Autoplay once
    if (Adapt.audio.autoPlayOnceGlobal || this.model.get('_audio')._autoPlayOnce) {
      this.autoplayOnce = true;
    } else {
      this.autoplayOnce = false;
    }

    // Add audio icon
    this.$('.audio__controls-icon').addClass(this.audioIcon);

    this.elementHeight = Math.round(this.$('.audio__controls').outerHeight());

    // Set audio file
    this.setAudioFile();

    // Set clip ID
    Adapt.audio.audioClip[this.audioChannel].newID = this.elementId;

    // Set listener for when clip ends
    $(Adapt.audio.audioClip[this.audioChannel]).on('ended', this.onAudioEnded.bind(this));

    _.defer(() => {
      this.postRender();
    });
  }

  postRender() {
    this.updateToggle();

    // Run function to check for reduced text
    this.replaceText(Adapt.audio.textSize);

    this.isAnimating = $('.'+this.elementId).hasClass('animate-hidden');

    if (this.isAnimating) {
      this.listenTo(this.model, 'change:_isAnimating', this.checkOnscreen);
    }

    // Add inview listener on audio element
    if (!Adapt.audio.isConfigured) return;

    _.delay(() => {
      this.updateToggle();
      $('.'+this.model.get('_id')).on('onscreen', this.onscreen.bind(this));
    }, 1000);
  }

  setAudioFile() {
    // Set audio file based on the device size
    if (device.screenSize === 'large') {
      this.audioFile = this.model.get('_audio')._media.desktop;
    } else {
      this.audioFile = this.model.get('_audio')._media.mobile;
    }
  }

  onAudioEnded() {
    Adapt.trigger('audio:audioEnded', this.audioChannel);
  }

  popupOpened() {
    this.popupIsOpen = true;
  }

  audioConfigured() {
    _.delay(() => {
      this.popupIsOpen = false;
      this.updateToggle();
      $('.'+this.model.get('_id')).on('onscreen', this.onscreen.bind(this));
    }, 500);
  }

  initFeedback(view) {
    // Run a check to trigger only the current elements feedback
    if (this.elementId == view.model.get('_id')) {
      if (this.model.get('_audio')._feedback && this.model.get('_audio')._feedback._isEnabled) {
        this.initQuestionFeedbackAudio();
      }
    }
  }

  initQuestionFeedbackAudio() {
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
  }

  setupCorrectFeedback() {
    this.audioFile = this.model.get('_audio')._feedback._correct._correct;
    // Effects audio
    if (this.audioEffectsEnabled) {
      this.audioEffectsFile = this.model.get('_audio')._feedback._soundEffect._correct;
    }
    // Reduced text
    if (this.model.get('_audio')._reducedTextisEnabled && Adapt.audio.textSize == 1) {
      $('.notify').find('.notify-popup__body-inner').html(this.model.get('_audio')._feedback._correct.correctReduced);
    }
  }

  setupPartlyCorrectFeedback() {
    // Final
    if (this.model.get('_attemptsLeft') === 0 || !this.model.get('_audio')._feedback._partlyCorrect._notFinal) {
      if (this.model.get('_audio')._feedback._partlyCorrect._final) {
        this.audioFile = this.model.get('_audio')._feedback._partlyCorrect._final;
        // Effects audio
        if (this.audioEffectsEnabled) {
          this.audioEffectsFile = this.model.get('_audio')._feedback._soundEffect._partlyCorrect;
        }
        // Reduced text
        if (this.model.get('_audio')._reducedTextisEnabled && Adapt.audio.textSize == 1) {
          $('.notify').find('.notify-popup__body-inner').html(this.model.get('_audio')._feedback._partlyCorrect.finalReduced);
        }
      } else {
        this.setupIncorrectFeedback();
      }
    // Not final
    } else {
      this.audioFile = this.model.get('_audio')._feedback._partlyCorrect._notFinal;
      // Effects audio
      if (this.audioEffectsEnabled) {
        this.audioEffectsFile = this.model.get('_audio')._feedback._soundEffect._partlyCorrect;
      }
      // Reduced text
      if (this.model.get('_audio')._reducedTextisEnabled && Adapt.audio.textSize == 1) {
        $('.notify').find('.notify-popup__body-inner').html(this.model.get('_audio')._feedback._partlyCorrect.notFinalReduced);
      }
    }
  }

  setupIncorrectFeedback() {
    // apply individual item feedback
    const items = this.model.get('_audio')._feedback._items ? this.model.get('_audio')._feedback._items : [];

    if (this.model.get('_selectable') === 1 && items.length > 0) {
      this.setupIndividualFeedbackAudio();
    } else {
      // Final
      if (this.model.get('_attemptsLeft') === 0) {
        this.audioFile = this.model.get('_audio')._feedback._incorrect._final;
        // Reduced text
        if (this.model.get('_audio')._reducedTextisEnabled && Adapt.audio.textSize == 1) {
          $('.notify').find('.notify-popup__body-inner').html(this.model.get('_audio')._feedback._incorrect.finalReduced);
        }
      // Not final
      } else {
        this.audioFile = this.model.get('_audio')._feedback._incorrect._notFinal;
        // Reduced text
        if (this.model.get('_audio')._reducedTextisEnabled && Adapt.audio.textSize == 1) {
          $('.notify').find('.notify-popup__body-inner').html(this.model.get('_audio')._feedback._incorrect.notFinalReduced);
        }
      }
    }
    // Effects audio
    if (this.audioEffectsEnabled) {
      this.audioEffectsFile = this.model.get('_audio')._feedback._soundEffect._incorrect;
    }
  }

  setupIndividualFeedbackAudio(item) {
    const activeItem = this.getActiveItem();
    const index = activeItem.get('_index');
    const itemArray = this.model.get('_audio')._feedback._items;
    this.audioFile = itemArray[index]._src;
  }

  getActiveItem() {
    return this.model.getChildren().findWhere({ _isActive: true });
  }

  stopFeedbackAudio() {
    this.popupIsOpen = false;

    if (this.model.get('_audio')._feedback && this.model.get('_audio')._feedback._isEnabled) {
      Adapt.trigger('audio:pauseAudio', this.audioChannel);

      if (this.audioEffectsEnabled) {
        Adapt.trigger('audio:pauseAudio', this.audioEffectsChannel);
      }
    }
  }

  onscreen(event, measurements) {
    if (this.popupIsOpen) return;

    const visible = this.model.get('_isVisible');
    const isOnscreenX = measurements.percentInviewHorizontal == 100;
    const isOnscreen = measurements.onscreen;

    const elementTopOnscreenY = measurements.percentFromTop < Adapt.audio.triggerPosition && measurements.percentFromTop > 0;
    const elementBottomOnscreenY = measurements.percentFromTop < Adapt.audio.triggerPosition && measurements.percentFromBottom < (100 - Adapt.audio.triggerPosition);

    const isOnscreenY = elementTopOnscreenY || elementBottomOnscreenY;

    // Check for element coming on screen
    if (visible && isOnscreen && isOnscreenY && isOnscreenX && this.canAutoplay && !this.onscreenTriggered && !this.isAnimating) {
      // Check if audio is set to on
      if (Adapt.audio.audioClip[this.audioChannel].status == 1) {
        this.setAudioFile();

        // Check for component items
        if (this.elementType === 'component' && this.model.get('_items') && !this.model.get('_isQuestionType') && this.model.getChildren()) {
          const itemIndex = this.getActiveItemIndex();
          const currentItem = this.model.get('_items')[itemIndex];

          // Check for tiles component
          if (this.model.get('_component') == "tiles" && itemIndex != null) {
            if (itemIndex == 0 || itemIndex > 0) {
              this.audioFile = currentItem._audio.src ? currentItem._audio.src : currentItem._audio._src;
            }
          } else {
            if (itemIndex > 0) {
              this.audioFile = currentItem._audio.src ? currentItem._audio.src : currentItem._audio._src;
            }
          }
        }

        // Check for perception question
        if (this.elementType === 'component' && this.model.get('_component') == "perceptionQuestion") {
          const itemIndex = this.model.get('_stage');
          const currentItem = this.model.get('_items')[itemIndex];

          if (itemIndex > 0) {
            this.audioFile = currentItem._audio.src ? currentItem._audio.src : currentItem._audio._src;
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
  }

  checkOnscreen() {
    this.isAnimating = this.model.get('_isAnimating');

    $('.'+this.model.get('_id')).on('onscreen', _.bind(this.onscreen, this));
  }

  toggleAudio(event) {
    if (event) event.preventDefault();

    this.setAudioFile();
    Adapt.audio.audioClip[this.audioChannel].onscreenID = "";

    if ($(event.currentTarget).hasClass('playing')) {
      this.pauseAudio();
    } else {
      this.playAudio();
    }
  }

  playAudio() {
    // iOS requires direct user interaction on a button to enable autoplay
    // Re-use code from main adapt-audio.js playAudio() function

    Adapt.trigger('media:stop');

    // Stop audio
    Adapt.audio.audioClip[this.audioChannel].pause();
    Adapt.audio.audioClip[this.audioChannel].isPlaying = false;

    // Update previous player if there is one
    if (Adapt.audio.audioClip[this.audioChannel].playingID) {
      $('#'+Adapt.audio.audioClip[this.audioChannel].playingID).find('.audio__controls-icon').removeClass(Adapt.audio.iconPause);
      $('#'+Adapt.audio.audioClip[this.audioChannel].playingID).find('.audio__controls-icon').addClass(Adapt.audio.iconPlay);
      $('#'+Adapt.audio.audioClip[this.audioChannel].playingID).removeClass('playing');
    }

    this.$('.audio__controls-icon').removeClass(Adapt.audio.iconPlay);
    this.$('.audio__controls-icon').addClass(Adapt.audio.iconPause);
    this.$('.audio__controls').addClass('playing');

    Adapt.audio.audioClip[this.audioChannel].prevID = Adapt.audio.audioClip[this.audioChannel].playingID;
    Adapt.audio.audioClip[this.audioChannel].src = this.audioFile;

    // Check for component items
    if (this.elementType === 'component' && this.model.get('_items') && !this.model.get('_isQuestionType') && this.model.getChildren()) {
      const itemIndex = this.getActiveItemIndex();
      const currentItem = this.model.get('_items')[itemIndex];

      // Check for tiles component
      if (this.model.get('_component') == "tiles" && itemIndex != null) {
        if (itemIndex == 0 || itemIndex > 0) {
          Adapt.audio.audioClip[this.audioChannel].src = currentItem._audio.src ? currentItem._audio.src : currentItem._audio._src;
        }
      } else {
        if (itemIndex > 0) {
          Adapt.audio.audioClip[this.audioChannel].src = currentItem._audio.src ? currentItem._audio.src : currentItem._audio._src;
        }
      }
    }

    // Check for perception question
    if (this.elementType === 'component' && this.model.get('_component') == "perceptionQuestion") {
      const itemIndex = this.model.get('_stage');
      const currentItem = this.model.get('_items')[itemIndex];

      if (itemIndex > 0) {
        Adapt.audio.audioClip[this.audioChannel].src = currentItem._audio.src ? currentItem._audio.src : currentItem._audio._src;
      }
    }

    Adapt.audio.audioClip[this.audioChannel].newID = this.elementId;

    if (Adapt.audio.pauseStopAction == 'pause') {
      Adapt.audio.audioClip[this.audioChannel].play(this.pausedTime);
      this.$('.audio__controls').attr('aria-label', a11y.normalize(Adapt.audio.pauseAriaLabel));
    } else {
      Adapt.audio.audioClip[this.audioChannel].play();
      this.$('.audio__controls').attr('aria-label', a11y.normalize(Adapt.audio.stopAriaLabel));
    }

    Adapt.audio.audioClip[this.audioChannel].onscreenID = this.elementId;
    Adapt.audio.audioClip[this.audioChannel].playingID = Adapt.audio.audioClip[this.audioChannel].newID;
    Adapt.audio.audioClip[this.audioChannel].isPlaying = true;
  }

  pauseAudio() {
    if (Adapt.audio.pauseStopAction == 'pause') {
      this.pausedTime = Adapt.audio.audioClip[this.audioChannel].currentTime;
      Adapt.audio.audioClip[this.audioChannel].pause();
      Adapt.audio.audioClip[this.audioChannel].isPlaying = false;
      this.$('.audio__controls-icon').removeClass(Adapt.audio.iconPause);
      this.$('.audio__controls-icon').addClass(Adapt.audio.iconPlay);
      this.$('.audio__controls').removeClass('playing');
    } else {
      Adapt.trigger('audio:pauseAudio', this.audioChannel);
    }
    this.$('.audio__controls').attr('aria-label', a11y.normalize(Adapt.audio.playAriaLabel));
  }

  onDeviceResize() {
    _.delay(() => {
      this.updateToggle();
    }, 500);
  }

  onDeviceChanged() {
    this.updateToggle();
  }

  updateToggle() {
    // Reset
    $('.'+this.elementId).find('.'+this.elementType+'__body-inner').css('max-width', "");
    $('.'+this.elementId).find('.'+this.elementType+'__title-inner').css('max-width', "");

    this.$('.audio__controls').css('padding', "");
    this.$('.audio__controls').css('height', "");
    this.$('.audio__controls').css('width', "");

    if (Adapt.audio.audioClip[this.audioChannel].status == 1 && this.model.get('_audio')._showControls == true) {
      this.$('.audio__controls').removeClass('is-hidden');

      const outerWidth = this.$('.js-audio-toggle').outerWidth();
      const elementWidth = $('.'+this.elementId).find('.'+this.elementType+'-header').outerWidth();
      const padding = outerWidth - this.$('.js-audio-toggle').width();
      const maxWidth = (elementWidth - outerWidth) - padding;

      const titleHeight = Math.round($('.'+this.elementId).find('.'+this.elementType+'__title').outerHeight());

      // Set width on elements title or body
      if (this.model.get('displayTitle') == "") {
        $('.'+this.elementId).find('.'+this.elementType+'__body-inner').css('max-width', maxWidth);
      } else {
        $('.'+this.elementId).find('.'+this.elementType+'__title-inner').css('max-width', maxWidth);

        if (titleHeight < this.elementHeight) {
          this.$('.audio__controls').css('padding', 0);
          this.$('.audio__controls').css('height', titleHeight);
          this.$('.audio__controls').css('width', titleHeight);
        }
      }

      $('.'+this.elementId).addClass('is-audio');

    } else {
      $('.'+this.elementId).removeClass('is-audio');
      this.$('.audio__controls').addClass('is-hidden');
    }
  }

  getActiveItemIndex() {
    const activeItem = this.model.getChildren().findWhere({ _isActive: true });

    if (activeItem) {
      const index = activeItem.get('_index');
      return index;
    } else {
      return null;
    }
  }

  removeInViewListeners() {
    $('.'+this.model.get('_id')).off('onscreen');
  }

  replaceText(value) {
    // If enabled
    if (Adapt.course.get('_audio') && Adapt.course.get('_audio')._reducedTextisEnabled && this.model.get('_audio') && this.model.get('_audio')._reducedTextisEnabled) {
      // Article
      if (this.elementType == 'article') {
        if (value == 0) {
          $('.' + this.model.get('_id')).find('.article__title-inner').html(this.stringReplace(this.model.get('displayTitle')));
          $('.' + this.model.get('_id')).find('.article__body-inner').html(this.stringReplace(this.model.get('body')));
        } else {
          $('.' + this.model.get('_id')).find('.article__title-inner').html(this.stringReplace(this.model.get('_audio').displayTitleReduced));
          $('.' + this.model.get('_id')).find('.article__body-inner').html(this.stringReplace(this.model.get('_audio').bodyReduced));
        }
      }
      // Block
      if (this.elementType == 'block') {
        if (value == 0) {
          $('.' + this.model.get('_id')).find('.block__title-inner').html(this.stringReplace(this.model.get('displayTitle')));
          $('.' + this.model.get('_id')).find('.block__body-inner').html(this.stringReplace(this.model.get('body')));
        } else {
          $('.' + this.model.get('_id')).find('.block__title-inner').html(this.stringReplace(this.model.get('_audio').displayTitleReduced));
          $('.' + this.model.get('_id')).find('.block__body-inner').html(this.stringReplace(this.model.get('_audio').bodyReduced));
        }
      }
      // Component
      if (this.elementType == 'component') {
        if (value == 0) {
          $('.' + this.model.get('_id')).find('.component__title-inner').html(this.stringReplace(this.model.get('displayTitle')));
          $('.' + this.model.get('_id')).find('.component__body-inner').html(this.stringReplace(this.model.get('body')));
        } else {
          $('.' + this.model.get('_id')).find('.component__title-inner').html(this.stringReplace(this.model.get('_audio').displayTitleReduced));
          $('.' + this.model.get('_id')).find('.component__body-inner').html(this.stringReplace(this.model.get('_audio').bodyReduced));
        }
      }
    }
  }

  stringReplace(text) {
    if (!Adapt.course.get('_globals')._learnerInfo) return text;
    // name
    let newText = text.replace(/{{_globals._learnerInfo.name}}/g, Adapt.course.get('_globals')._learnerInfo.name);
    // firstname
    newText = newText.replace(/{{_globals._learnerInfo.firstname}}/g, Adapt.course.get('_globals')._learnerInfo.firstname);
    // lastname
    newText = newText.replace(/{{_globals._learnerInfo.lastname}}/g, Adapt.course.get('_globals')._learnerInfo.lastname);

    return newText;
  }
}
