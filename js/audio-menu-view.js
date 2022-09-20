import Adapt from 'core/js/adapt';
import a11y from 'core/js/a11y';

export default class AudioMenuView extends Backbone.View {

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
      'audio:configured': this.audioConfigured,
      'audio:updateAudioStatus': this.updateToggle,
      'popup:opened notify:opened': this.popupOpened,
      'popup:closed': this.popupClosed
    });

    this.listenToOnce(Adapt, 'remove', this.removeInViewListeners);

    this.render();
  }

  render() {
    const data = this.model.toJSON();
    const template = Handlebars.templates['audioMenu'];

    if (this.model.get('_audio')._location=='bottom-left' || this.model.get('_audio')._location=='bottom-right') {
      $(this.el).html(template(data)).appendTo('.menu');
    } else {
      $(this.el).html(template(data)).prependTo('.menu');
    }

    // Set vars
    this.audioChannel = this.model.get('_audio')._channel;
    this.elementId = this.model.get('_id');
    this.audioFile = this.model.get('_audio')._media.src;
    Adapt.audio.audioClip[this.audioChannel].newID = this.elementId;
    this.audioIcon = Adapt.audio.iconPlay;
    this.pausedTime = "";
    Adapt.audio.audioClip[this.audioChannel].onscreenID = "";
    this.popupIsOpen = false;
    this.onscreenTriggered = false;

    // Autoplay
    if (Adapt.audio.autoPlayGlobal || this.model.get('_audio')._autoplay){
      this.canAutoplay = true;
    } else {
      this.canAutoplay = false;
    }

    // Autoplay once
    if (this.model.get('_audio')._autoPlayOnce) {
      this.autoplayOnce = true;
    } else {
      this.autoplayOnce = false;
    }

    // Add audio icon
    this.$('.audio__controls-icon').addClass(this.audioIcon);

    // Hide controls if set in JSON or if audio is turned off
    if (this.model.get('_audio')._showControls==false || Adapt.audio.audioClip[this.audioChannel].status==0){
      this.$('.audio__controls').addClass('is-hidden');
    }

    // Set listener for when clip ends
    $(Adapt.audio.audioClip[this.audioChannel]).on('ended', this.onAudioEnded.bind(this));

    // Check for '_canReplayAudio' on the model
    if (!this.model.has('_canReplayAudio')) {
      this.model.set('_canReplayAudio', true);
    }

    if (!Adapt.audio.isConfigured) return;

    _.delay(() => {
      this.autoplayAudio();
    }, 1000);
  }

  onAudioEnded() {
    Adapt.trigger('audio:audioEnded', this.audioChannel);
  }

  popupOpened() {
    this.popupIsOpen = true;
  }

  popupClosed() {
    this.popupIsOpen = false;

    if (this.onscreenTriggered) return;

    this.autoplayAudio();
  }

  toggleAudio(event) {
    if (event) event.preventDefault();
    Adapt.audio.audioClip[this.audioChannel].onscreenID = "";

    if ($(event.currentTarget).hasClass('playing')) {
      this.pauseAudio();
    } else {
      this.playAudio();
    }
  }

  autoplayAudio() {
    if (this.popupIsOpen) return;

    // Play audio if autoplay is true
    if (this.canAutoplay && this.model.get('_canReplayAudio')) {
      // Check if audio is set to on
      if (Adapt.audio.audioClip[this.audioChannel].status==1){
        Adapt.trigger('audio:playAudio', this.audioFile, this.elementId, this.audioChannel);
      }
      // Set to false to stop autoplay when onscreen again
      if (this.autoplayOnce) {
        this.model.set('_canReplayAudio', false);
      }
      this.onscreenTriggered = true;
    }
  }

  playAudio() {
    // iOS requires direct user interaction on a button to enable autoplay
    // Re-use code from main adapt-audio.js playAudio() function

    Adapt.trigger('media:stop');

    // Stop audio
    Adapt.audio.audioClip[this.audioChannel].pause();

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
      this.$('.audio__controls-icon').removeClass(Adapt.audio.iconPause);
      this.$('.audio__controls-icon').addClass(Adapt.audio.iconPlay);
      this.$('.audio__controls').removeClass('playing');
    } else {
      Adapt.trigger('audio:pauseAudio', this.audioChannel);
    }
    this.$('.audio__controls').attr('aria-label', a11y.normalize(Adapt.audio.playAriaLabel));
  }

  updateToggle() {
    if (Adapt.audio.audioClip[this.audioChannel].status == 1 && this.model.get('_audio')._showControls){
      this.$('.audio__controls').removeClass('is-hidden');
    } else {
      this.$('.audio__controls').addClass('is-hidden');
    }
  }

  audioConfigured() {
    this.autoplayAudio();
  }

  removeInViewListeners() {
    Adapt.trigger('audio:pauseAudio', this.audioChannel);
  }
}
