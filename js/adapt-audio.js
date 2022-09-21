import Adapt from 'core/js/adapt';
import a11y from 'core/js/a11y';
import drawer from 'core/js/drawer';
import location from 'core/js/location';
import notify from 'core/js/notify';
import offlineStorage from 'core/js/offlineStorage';
import AudioPromptView from './audio-prompt-view';
import AudioNavigationView from './audio-navigation-view';
import AudioDrawerView from './audio-drawer-view';
import AudioMenuView from './audio-menu-view';
import AudioControlsView from './audio-controls-view';
import AudioResultsView from './audio-results-view';

class AudioController extends Backbone.Controller {

  initialize() {
    this.listenToOnce(Adapt, 'app:dataReady', this.onDataReady);
  }

  onDataReady() {
    this.listenTo(Adapt.config, 'change:_activeLanguage', this.onLangChange);

    if (Adapt.course.get('_audio') && Adapt.course.get('_audio')._isEnabled) {
      this.setupAudio();
      this.setupEventListeners();
      this.addAudioDrawerItem();
    }
  }

  setupEventListeners() {
    this.listenToOnce(Adapt, 'router:location', this.checkLaunch);

    this.listenTo(Adapt, {
      'navigationView:postRender': this.renderNavigationView,
      'menuView:postRender': this.onMenuReady,
      'articleView:postRender blockView:postRender componentView:postRender': this.onABCReady,
      'audio:configure': this.configureAudio,
      'audio:onscreenOff': this.onscreenOff,
      'audio:playAudio': this.playAudio,
      'audio:pauseAudio': this.pauseAudio,
      'audio:audioEnded': this.audioEnded,
      'audio:updateAudioStatus': this.updateAudioStatus,
      'audio:showAudioDrawer': this.setupDrawerAudio,
      'audio:changeText': this.changeText,
      'notify:closed': this.notifyClosed,
      'audio:popupOpened': this.popupOpened,
      'audio:popupClosed': this.popupClosed,
      'audio:stopNarrationChannel': this.stopNarrationChannel,
      'audio:stopEffectsChannel': this.stopEffectsChannel,
      'audio:stopMusicChannel': this.stopMusicChannel,
      'audio:stopAllChannels menuView:preRender pageView:preRender': this.stopAllChannels
    });
  }

  setupAudio() {
    if (Adapt.course.get('_audio') && Adapt.course.get('_audio')._reducedTextisEnabled) {
      this.reducedTextEnabled = Adapt.course.get('_audio')._reducedTextisEnabled;
    } else {
      this.reducedTextEnabled = false;
    }

    Adapt.audio = {};

    Adapt.audio.audioClip = [];

    Adapt.audio.isConfigured = false;

    // Set variables to be used for the initial prompt
    Adapt.audio.promptView = null;
    Adapt.audio.promptIsOpen = false;
    Adapt.audio.externalPromptIsOpen = false;

    // Set default text size to full
    Adapt.audio.textSize = 0;

    Adapt.audio.playAriaLabel = Adapt.course.get('_globals')._extensions._audio ? Adapt.course.get('_globals')._extensions._audio.playAriaLabel : "";
    Adapt.audio.pauseAriaLabel = Adapt.course.get('_globals')._extensions._audio ? Adapt.course.get('_globals')._extensions._audio.pauseAriaLabel : "";
    Adapt.audio.stopAriaLabel = Adapt.course.get('_globals')._extensions._audio ? Adapt.course.get('_globals')._extensions._audio.stopAriaLabel : "";

    // Set action for the pause button
    Adapt.audio.pauseStopAction = Adapt.course.get('_audio')._pauseStopAction;

    // Set trigger position for onscreen percentFromTop detection
    Adapt.audio.triggerPosition = Adapt.course.get('_audio')._triggerPosition;

    // Set global variables based on course JSON
    Adapt.audio.autoPlayGlobal = Adapt.course.get('_audio')._autoplay ? true : false;
    Adapt.audio.autoPlayOnceGlobal = Adapt.course.get('_audio')._autoPlayOnce ? true : false;

    // Get names for icons from course.config
    Adapt.audio.iconOn = Adapt.course.get('_audio')._icons._audioOn;
    Adapt.audio.iconOff = Adapt.course.get('_audio')._icons._audioOff;
    Adapt.audio.iconPlay = Adapt.course.get('_audio')._icons._audioPlay;
    Adapt.audio.iconPause = Adapt.course.get('_audio')._icons._audioPause;

    // Set number of audio channels specified in the course JSON
    Adapt.audio.numChannels = 3;
    // Create audio objects based on the number of channels
    for (let i = 0; i < Adapt.audio.numChannels; i++) {
      Adapt.audio.audioClip[i] = new Audio();
    }

    // Assign variables to each audio object
    for (let i = 0; i < Adapt.audio.numChannels; i++) {
      Adapt.audio.audioClip[i].isPlaying = false;
      Adapt.audio.audioClip[i].playingID = "";
      Adapt.audio.audioClip[i].newID = "";
      Adapt.audio.audioClip[i].prevID = "";
      Adapt.audio.audioClip[i].onscreenID = "";
    }

    // Set default audio status for each channel base on the course config
    Adapt.audio.audioClip[0].status = Adapt.course.get('_audio')._channels._narration._status;
    Adapt.audio.audioClip[1].status = Adapt.course.get('_audio')._channels._effects._status;
    Adapt.audio.audioClip[2].status = Adapt.course.get('_audio')._channels._music._status;
    Adapt.audio.audioStatus = Adapt.audio.audioClip[0].status;

    // Collect data from offline storage
    if (offlineStorage.get('audio_level') == '1' || offlineStorage.get('audio_level') == '0') {
      // Set to saved audio status and text size
      Adapt.audio.audioStatus = offlineStorage.get('audio_level');
      Adapt.audio.textSize = offlineStorage.get('audio_textSize');
    }
    // Update channels based on preference
    for (let i = 0; i < Adapt.audio.numChannels; i++) {
      Adapt.audio.audioClip[i].status = parseInt(Adapt.audio.audioStatus);
    }
    // Change text and audio based on preference
    this.updateAudioStatus(0,Adapt.audio.audioStatus);
    this.changeText(Adapt.audio.textSize);
  }

  renderNavigationView() {
    const audioModel = Adapt.course.get('_audio');

    if (!audioModel._showOnNavbar) return;

    const audioNavigationModel = new Backbone.Model(audioModel);
    $('.nav__drawer-btn').after(new AudioNavigationView({
      model: audioNavigationModel
    }).$el);
  }

  checkLaunch() {
    // Check launch based on the saved location
    if ((offlineStorage.get('location') === 'undefined') || (offlineStorage.get('location') === undefined) || (offlineStorage.get('location') == "")) {
      if (Adapt.course.get('_audio')._prompt._isEnabled) {
        this.listenToOnce(Adapt, 'pageView:ready menuView:ready', this.onReady);
      } else {
        if (Adapt.course.get('_audio')._configureOnLoad || Adapt.course.get('_audio')._configureOnLoad === undefined || Adapt.course.get('_audio')._configureOnLoad === 'undefined') {
          this.configureAudio();
        }
      }
    } else {
      // Check for bookmark
      if (Adapt.course.has('_bookmarking') && Adapt.course.get('_bookmarking')._isEnabled && Adapt.course.get('_bookmarking')._showPrompt) {
        // Check if bookmark has already been triggered
        if ($('body').children('.notify').css('visibility') == 'visible') {
          this.bookmarkOpened();
        } else {
          this.listenToOnce(Adapt, 'popup:opened', this.bookmarkOpened);
        }
      } else {
        this.configureAudio();
      }
    }
  }

  onReady() {
    _.defer(() => {
      this.stopListening(Adapt, 'pageView:ready menuView:ready', this.onReady);
      this.showAudioPrompt();
    });
  }

  bookmarkOpened() {
    Adapt.audio.promptIsOpen = true;
    this.listenToOnce(Adapt, 'bookmarking:cancel bookmarking:continue', this.onPromptClosed);
  }

  onLangChange() {
    this.stopListening(Adapt, {
      'navigationView:postRender': this.renderNavigationView,
      'menuView:postRender': this.onMenuReady,
      'articleView:postRender blockView:postRender componentView:postRender': this.onABCReady,
      'audio:onscreenOff': this.onscreenOff,
      'audio:playAudio': this.playAudio,
      'audio:pauseAudio': this.pauseAudio,
      'audio:audioEnded': this.audioEnded,
      'audio:updateAudioStatus': this.updateAudioStatus,
      'audio:showAudioDrawer': this.setupDrawerAudio,
      'audio:changeText': this.changeText,
      'notify:closed': this.notifyClosed,
      'audio:popupOpened': this.popupOpened,
      'audio:popupClosed': this.popupClosed,
      'audio:stopNarrationChannel': this.stopNarrationChannel,
      'audio:stopEffectsChannel': this.stopEffectsChannel,
      'audio:stopMusicChannel': this.stopMusicChannel,
      'audio:stopAllChannels menuView:preRender pageView:preRender': this.stopAllChannels,
      'bookmarking:cancel': this.promptClosed
    });

    this.stopListening(Adapt.config, 'change:_activeLanguage', this.onLangChange);

    // Set empty location so that the prompt is checked
    offlineStorage.set('location', "");

    this.listenToOnce(Adapt, 'app:dataReady', this.onDataReady);

    if (!Adapt.audio) return;

    this.stopAllChannels();
  }

  showAudioPrompt() {
    if (Adapt.audio.promptIsOpen) return;

    Adapt.audio.promptIsOpen = true;

    const audioPromptModel = Adapt.course.get('_audio')._prompt;

    // Set model data depending on audio and text settings
    let promptTitle = "";
    let promptBody = "";
    let promptInstruction = "";
    let promptButton1Text = "";
    let promptButton2Text = "";
    let promptButton1Callback = "";
    let promptButton2Callback = "";

    // If audio is off
    if (Adapt.audio.audioStatus == 0) {
      if (this.reducedTextEnabled) {
        promptTitle = audioPromptModel.title;
        promptBody = audioPromptModel.bodyAudioOff;

        promptInstruction = audioPromptModel.instructionAudioOff;
        promptButton1Text = audioPromptModel._buttons.full;
        promptButton2Text = audioPromptModel._buttons.reduced;

        promptButton1Callback = 'fullTextAudioOff';
        promptButton2Callback = 'reducedTextAudioOff';

      } else {
        promptTitle = audioPromptModel.titleNoReduced;
        promptBody = audioPromptModel.bodyNoReducedAudioOff;
        promptInstruction = audioPromptModel.instructionNoReducedAudioOff;

        promptButton1Text = audioPromptModel._buttons.continue;
        promptButton2Text = audioPromptModel._buttons.turnOn;

        promptButton1Callback = 'selectContinueAudioOff';
        promptButton2Callback = 'selectOn';
      }
    } else {
      if (this.reducedTextEnabled) {
        promptTitle = audioPromptModel.title;
        promptBody = audioPromptModel.bodyAudioOn;
        promptInstruction = audioPromptModel.instructionAudioOn;

        promptButton1Text = audioPromptModel._buttons.full;
        promptButton2Text = audioPromptModel._buttons.reduced;

        promptButton1Callback = 'fullTextAudioOn';
        promptButton2Callback = 'reducedTextAudioOn';

      } else {
        promptTitle = audioPromptModel.titleNoReduced;
        promptBody = audioPromptModel.bodyNoReducedAudioOn;
        promptInstruction = audioPromptModel.instructionNoReducedAudioOn;

        promptButton1Text = audioPromptModel._buttons.continue;
        promptButton2Text = audioPromptModel._buttons.turnOff;

        promptButton1Callback = 'selectContinueAudioOn';
        promptButton2Callback = 'selectOff';
      }
    }

    const audioPrompt = new Backbone.Model(audioPromptModel);

    audioPrompt.set('promptTitle', promptTitle);
    audioPrompt.set('promptBody', promptBody);
    audioPrompt.set('promptInstruction', promptInstruction);
    audioPrompt.set('promptButton1Text', promptButton1Text);
    audioPrompt.set('promptButton2Text', promptButton2Text);
    audioPrompt.set('promptButton1Callback', promptButton1Callback);
    audioPrompt.set('promptButton2Callback', promptButton2Callback);

    Adapt.audio.promptView = new AudioPromptView({
      model: audioPrompt
    });

    notify.popup({
      _view: Adapt.audio.promptView,
      _isCancellable: true,
      _showCloseButton: false,
      _closeOnBackdrop: true,
      _classes: ' audio-prompt'
    });

    this.listenToOnce(Adapt, {
      'popup:closed': this.onPromptClosed
    });
  }

  onPromptClosed() {
    if (Adapt.audio.externalPromptIsOpen == true) {
      Adapt.audio.promptIsOpen = true;
    } else {
      Adapt.audio.promptIsOpen = false;
    }

    this.configureAudio();
  }

  changeText(value) {
    Adapt.audio.textSize = value;
    this.updateOfflineStorage();
  }

  onscreenOff(id, channel){
    if (id == Adapt.audio.audioClip[channel].playingID){
      Adapt.audio.audioClip[channel].onscreenID = "";
      this.pauseAudio(channel);
    }
  }

  playAudio(audioClip, id, channel, popup) {
    if (audioClip == "") return;
    if (Adapt.audio.audioClip[channel].onscreenID != id || id === null) {
      Adapt.trigger('media:stop');
      // Stop audio
      Adapt.audio.audioClip[channel].pause();
      // Update previous player
      this.hideAudioIcon(channel);
      Adapt.audio.audioClip[channel].prevID = Adapt.audio.audioClip[channel].playingID;
      // Update player to new clip vars
      Adapt.audio.audioClip[channel].src = audioClip;
      Adapt.audio.audioClip[channel].newID = id;
      // Only play if prompt is not open or the audio type is a popup
      if (Adapt.audio.promptIsOpen == false || popup == true) {
        try {
          let delay = 500;
          if (id === null) {
            delay = 0;
          }
          setTimeout(function () {
            Adapt.audio.audioClip[channel].play();
            Adapt.audio.audioClip[channel].isPlaying = true;
          },delay);

          if (id != null) {
            this.showAudioIcon(channel);
          }

        } catch(e) {
          console.log('Audio play error:' + e);
        }
      }
      Adapt.audio.audioClip[channel].onscreenID = id;
      // Update player ID to new clip
      Adapt.audio.audioClip[channel].playingID = Adapt.audio.audioClip[channel].newID;
    }
  }

  pauseAudio(channel) {
    if (!Adapt.audio.audioClip[channel].paused) {
      Adapt.audio.audioClip[channel].isPlaying = false;
      Adapt.audio.audioClip[channel].pause();
      this.hideAudioIcon(channel);
    }
  }

  audioEnded(channel) {
    Adapt.audio.audioClip[channel].isPlaying = false;
    this.hideAudioIcon(channel);
  }

  notifyClosed() {
    this.stopNarrationChannel();
    this.stopEffectsChannel();
    Adapt.audio.promptIsOpen = false;
  }

  popupOpened() {
    this.stopAllChannels();
    Adapt.audio.promptIsOpen = true;
    Adapt.audio.externalPromptIsOpen = true;
  }

  popupClosed() {
    this.stopAllChannels();
    Adapt.audio.promptIsOpen = false;
    Adapt.audio.audioClip[0].onscreenID = "";
  }

  stopAllChannels() {
    // Pause all channels
    for (let i = 0; i < Adapt.audio.numChannels; i++) {
      this.pauseAudio(i);
    }
  }

  stopNarrationChannel() {
    this.pauseAudio(0);
  }

  stopEffectsChannel() {
    this.pauseAudio(1);
  }

  stopMusicChannel() {
    this.pauseAudio(2);
  }

  showAudioIcon(channel) {
    const audioHTMLId = '#'+Adapt.audio.audioClip[channel].newID;

    $(audioHTMLId).find('.audio__controls-icon').removeClass(Adapt.audio.iconPlay);
    $(audioHTMLId).find('.audio__controls-icon').addClass(Adapt.audio.iconPause);
    $(audioHTMLId).addClass('playing');

    if (Adapt.audio.pauseStopAction == 'pause') {
      $(audioHTMLId).attr('aria-label', a11y.normalize(Adapt.audio.pauseAriaLabel));
    } else {
      $(audioHTMLId).attr('aria-label', a11y.normalize(Adapt.audio.stopAriaLabel));
    }
  }

  hideAudioIcon(channel) {
    if (!Adapt.audio.audioClip[channel].playingID) return;

    const audioHTMLId = '#'+Adapt.audio.audioClip[channel].playingID;

    $(audioHTMLId).find('.audio__controls-icon').removeClass(Adapt.audio.iconPause);
    $(audioHTMLId).find('.audio__controls-icon').addClass(Adapt.audio.iconPlay);
    $(audioHTMLId).removeClass('playing');

    $(audioHTMLId).attr('aria-label', a11y.normalize(Adapt.audio.playAriaLabel));
  }

  updateAudioStatus(channel, value) {
    Adapt.audio.audioClip[channel].status = value;
    // Pause audio channel
    Adapt.trigger('audio:pauseAudio', channel);
    // Set to off
    Adapt.audio.audioStatus = 0;
    // Check for narration channel being on
    if (Adapt.audio.audioClip[0].status == 1){
      Adapt.audio.audioStatus = 1;
    }
    this.updateOfflineStorage();
  }

  updateOfflineStorage() {
    offlineStorage.set('audio_level', Adapt.audio.audioStatus);
    offlineStorage.set('audio_textSize', Adapt.audio.textSize);
  }

  configureAudio() {
    for (let i = 0; i < Adapt.audio.numChannels; i++) {
      Adapt.audio.audioClip[i].play();
      Adapt.audio.audioClip[i].isPlaying = false;
      Adapt.audio.audioClip[i].pause();
    }

    Adapt.audio.isConfigured = true;

    _.delay(() => {
      Adapt.trigger('audio:configured');
    }, 500);
  }

  addAudioDrawerItem() {
    const audioModel = Adapt.course.get('_audio');
    const drawerObject = {
      title: audioModel.title,
      description: audioModel.description,
      className: 'audio-drawer',
      drawerOrder: audioModel._drawerOrder || 0
    };
    drawer.addItem(drawerObject, 'audio:showAudioDrawer');
  }

  setupDrawerAudio() {
    const audioModel = Adapt.course.get('_audio');
    const audioDrawerModel = new Backbone.Model(audioModel);

    drawer.triggerCustomView(new AudioDrawerView({
      model: audioDrawerModel
    }).$el);
  }

  onMenuReady(view) {
    if (view.model && view.model.get('_audio') && view.model.get('_type') == 'menu' && view.model.get('_audio')._isEnabled) {
      // Pause all channels on view load
      this.stopAllChannels();
      // Only render current location menu
      if (location._currentId == view.model.get('_id')) {
        new AudioMenuView({model:view.model});
      }
    }
  }

  onABCReady(view) {
    if (view.model && view.model.get('_audio') && view.model.get('_audio')._isEnabled) {
      // Pause all channels on view load
      this.stopAllChannels();
      // Only render view if it DOESN'T already exist - Work around for hotgraphic component
      if (!$('.' + view.model.get('_id')).find('.audio__controls').length) {
        new AudioControlsView({model:view.model});
      }
    }

    if (view.model && view.model.get('_audioAssessment') && view.model.get('_audioAssessment')._isEnabled) {
      // Pause all channels on view load
      this.stopAllChannels();
      // Only render view if it DOESN'T already exist - Work around for assessmentResults component
      if (!$('.' + view.model.get('_id')).find('.audio__controls').length) {
        new AudioResultsView({model:view.model});
      }
    }
  }
}

export default new AudioController();
