define([
    'core/js/adapt',
    './audio-prompt-view',
    './audio-navigation-view',
    './audio-drawer-view',
    './audio-menu-view',
    './audio-controls-view',
    './audio-results-view'
], function(Adapt, AudioPromptView, AudioNavigationView, AudioDrawerView, AudioMenuView, AudioControlsView, AudioResultsView) {

  var AudioController = _.extend({

    initialize: function() {
        this.listenToOnce(Adapt, "app:dataReady", this.onDataReady);
    },

    onDataReady: function() {
      this.listenTo(Adapt.config, 'change:_activeLanguage', this.onLangChange);

      if (Adapt.course.get("_audio") && Adapt.course.get("_audio")._isEnabled) {
        this.setupAudio();
        this.setupEventListeners();
        this.addAudioDrawerItem();
      }
    },

    setupEventListeners: function() {
      this.listenToOnce(Adapt, "router:location", this.checkLaunch);

      this.listenTo(Adapt, {
          "navigationView:postRender": this.loadNavigationView,
          "menuView:postRender": this.onMenuReady,
          "articleView:postRender blockView:postRender componentView:postRender": this.onABCReady,
          "audio:onscreenOff": this.onscreenOff,
          "audio:playAudio": this.playAudio,
          "audio:pauseAudio": this.pauseAudio,
          "audio:audioEnded": this.audioEnded,
          "audio:updateAudioStatus": this.updateAudioStatus,
          "audio:showAudioDrawer": this.setupDrawerAudio,
          "audio:changeText": this.changeText,
          "notify:closed": this.notifyClosed,
          "audio:popupOpened": this.popupOpened,
          "audio:popupClosed": this.popupClosed,
          "audio:audio:stopAllChannels menuView:preRender pageView:preRender": this.stopAllChannels
      });
    },

    removeEventListeners: function() {
      // load navigation toggle button
      this.stopListening(Adapt, "navigationView:postRender", this.onAddToggle);
      // load menu audio
      this.stopListening(Adapt, "menuView:postRender", this.onMenuReady);
      // load article, block, component audio
      this.stopListening(Adapt, "articleView:postRender blockView:postRender componentView:postRender", this.onABCReady);
      this.stopListening(Adapt, "audio:onscreenOff", this.onscreenOff);
      this.stopListening(Adapt, "audio:playAudio", this.playAudio);
      this.stopListening(Adapt, "audio:pauseAudio", this.pauseAudio);
      this.stopListening(Adapt, "audio:stopAllChannels", this.stopAllChannels);
      this.stopListening(Adapt, "audio:audioEnded", this.audioEnded);
      // listen to toggle audio on or off
      this.stopListening(Adapt, "audio:updateAudioStatus", this.updateAudioStatus);
      // setup audio in drawer
      this.stopListening(Adapt, "audio:showAudioDrawer", this.setupDrawerAudio);
      // listen to text change in nav bar toggle prompt
      this.stopListening(Adapt, "audio:changeText", this.changeText);
      // Check for first launch of course
      this.stopListening(Adapt, "router:location", this.checkLaunch);
      // Listen for bookmarking being cancelled
      this.stopListening(Adapt, "bookmarking:cancel", this.promptClosed);
      // Listen for language change
      this.stopListening(Adapt.config, 'change:_activeLanguage', this.onLangChange);
      // Listen for notify closing
      this.stopListening(Adapt, 'notify:closed', this.notifyClosed);
      // Listeners for new popup functionality
      this.stopListening(Adapt, 'audio:popupOpened', this.popupOpened);
      this.stopListening(Adapt, 'audio:popupClosed', this.popupClosed);
      // // Stop all audio channels before the pages load
      this.stopListening(Adapt, "menuView:preRender pageView:preRender", this.stopAllChannels);
    },

    setupAudio: function() {
      if (Adapt.course.get("_audio") && Adapt.course.get("_audio")._reducedTextisEnabled) {
        this.reducedTextEnabled = Adapt.course.get("_audio")._reducedTextisEnabled;
      } else {
        this.reducedTextEnabled = false;
      }

      // Define audio model for all other views and components to reference
      Adapt.audio = {};
      Adapt.audio.audioClip = [];

      // Set variables to be used for the initial prompt
      Adapt.audio.promptView = null;
      Adapt.audio.promptIsOpen = false;
      Adapt.audio.externalPromptIsOpen = false;

      // Set default text size to full
      Adapt.audio.textSize = 0;

      // Set action for the pause button
      Adapt.audio.pauseStopAction = Adapt.course.get('_audio')._pauseStopAction;

      // Set trigger position for onscreen percentFromTop detection
      Adapt.audio.triggerPosition = Adapt.course.get('_audio')._triggerPosition;

      // Set global variables based on course JSON
      Adapt.audio.autoPlayGlobal = Adapt.course.get('_audio')._autoplay ? true : false;
      Adapt.audio.autoPlayOnceGlobal = Adapt.course.get('_audio')._autoPlayOnce ? true : false;

      // Set variable for iOS devices
      // When false - autoplay will be disabled until the user clicks on the audio control icon
      Adapt.audio.autoPlayOnIOS = false;

      // Check if iOS is being used
      if (navigator.userAgent.match(/iPad/i) || navigator.userAgent.match(/iPhone/i)) {
        Adapt.audio.autoPlayOnIOS = false;
      } else {
        Adapt.audio.autoPlayOnIOS = true;
      }

      // Get names for icons from course.config
      Adapt.audio.iconOn = Adapt.course.get('_audio')._icons._audioOn;
      Adapt.audio.iconOff = Adapt.course.get('_audio')._icons._audioOff;
      Adapt.audio.iconPlay = Adapt.course.get('_audio')._icons._audioPlay;
      Adapt.audio.iconPause = Adapt.course.get('_audio')._icons._audioPause;

      // Set number of audio channels specified in the course JSON
      Adapt.audio.numChannels = 3;
      // Create audio objects based on the number of channels
      for (var i = 0; i < Adapt.audio.numChannels; i++) {
        Adapt.audio.audioClip[i] = new Audio();
      }

      // Assign variables to each audio object
      for (var i = 0; i < Adapt.audio.numChannels; i++) {
        Adapt.audio.audioClip[i].isPlaying = false;
        Adapt.audio.audioClip[i].playingID = "";
        Adapt.audio.audioClip[i].newID = "";
        Adapt.audio.audioClip[i].prevID = "";
        Adapt.audio.audioClip[i].onscreenID = "";
      }

      //Set default audio status for each channel base on the course config
      Adapt.audio.audioClip[0].status = Adapt.course.get('_audio')._channels._narration._status;
      Adapt.audio.audioClip[1].status = Adapt.course.get('_audio')._channels._effects._status;
      Adapt.audio.audioClip[2].status = Adapt.course.get('_audio')._channels._music._status;
      Adapt.audio.audioStatus = Adapt.audio.audioClip[0].status;

      // Collect data from offline storage
      if(Adapt.offlineStorage.get("audio_level") == "1" || Adapt.offlineStorage.get("audio_level") == "0") {
        // Set to saved audio status and text size
        Adapt.audio.audioStatus = Adapt.offlineStorage.get("audio_level");
        Adapt.audio.textSize = Adapt.offlineStorage.get("audio_textSize");
      }
      // Update channels based on preference
      for (var i = 0; i < Adapt.audio.numChannels; i++) {
        Adapt.audio.audioClip[i].status = parseInt(Adapt.audio.audioStatus);
      }
      // Change text and audio based on preference
      this.updateAudioStatus(0,Adapt.audio.audioStatus);
      this.changeText(Adapt.audio.textSize);
    },

    loadNavigationView: function(navigationView) {
      var audioModel = Adapt.course.get('_audio');
      var audioNavigationModel = new Backbone.Model(audioModel);
      navigationView.$('.navigation-drawer-toggle-button').after(new AudioNavigationView({
        model: audioNavigationModel
      }).$el);
    },

    checkLaunch: function() {
      // Check launch based on the saved location
      if ((Adapt.offlineStorage.get("location") === "undefined") || (Adapt.offlineStorage.get("location") === undefined) || (Adapt.offlineStorage.get("location") == "")) {
        if (Adapt.course.get('_audio')._prompt._isEnabled) {
          this.listenToOnce(Adapt, 'pageView:ready menuView:ready', this.onReady);
        } else {
          this.audioConfigured();
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
        }
        this.audioConfigured();
      }
    },

    onReady: function() {
      this.stopListening(Adapt, 'pageView:ready menuView:ready', this.onReady);
      this.showAudioPrompt();
    },

    bookmarkOpened: function() {
      Adapt.audio.promptIsOpen = true;
      this.listenToOnce(Adapt, "bookmarking:cancel", this.onPromptClosed);
    },

    onLangChange: function() {
      this.stopListening(Adapt, {
          "navigationView:postRender": this.loadNavigationView,
          "menuView:postRender": this.onMenuReady,
          "articleView:postRender blockView:postRender componentView:postRender": this.onABCReady,
          "audio:onscreenOff": this.onscreenOff,
          "audio:playAudio": this.playAudio,
          "audio:pauseAudio": this.pauseAudio,
          "audio:audioEnded": this.audioEnded,
          "audio:updateAudioStatus": this.updateAudioStatus,
          "audio:showAudioDrawer": this.setupDrawerAudio,
          "audio:changeText": this.changeText,
          "notify:closed": this.notifyClosed,
          "audio:popupOpened": this.popupOpened,
          "audio:popupClosed": this.popupClosed,
          "audio:audio:stopAllChannels menuView:preRender pageView:preRender": this.stopAllChannels
      });

      // Set empty location so that the prompt is checked
      Adapt.offlineStorage.set("location", "");

      this.listenToOnce(Adapt, "app:dataReady", this.onDataReady);
    },

    showAudioPrompt: function() {
      if (Adapt.audio.promptIsOpen) return;

      Adapt.audio.promptIsOpen = true;

      var audioPromptModel = Adapt.course.get('_audio')._prompt;

      // Set model data depending on audio and text settings
      var promptTitle = "";
      var promptBody = "";
      var promptButton1Text = "";
      var promptButton2Text = "";
      var promptButton1Callback = "";
      var promptButton2Callback = "";

      // If audio is off
      if (Adapt.audio.audioStatus == 0) {
        if (this.reducedTextEnabled) {
          promptTitle = audioPromptModel.title;
          promptBody = audioPromptModel.bodyAudioOff;

          promptButton1Text = audioPromptModel._buttons.full;
          promptButton2Text = audioPromptModel._buttons.reduced;

          promptButton1Callback = "fullTextAudioOff";
          promptButton2Callback = "reducedTextAudioOff";

        } else {
          promptTitle = audioPromptModel.titleNoReduced;
          promptBody = audioPromptModel.bodyNoReducedAudioOff;

          promptButton1Text = audioPromptModel._buttons.continue;
          promptButton2Text = audioPromptModel._buttons.turnOn;

          promptButton1Callback = "selectContinueAudioOff";
          promptButton2Callback = "selectOn";
        }
      } else {
        if (this.reducedTextEnabled) {
          promptTitle = audioPromptModel.title;
          promptBody = audioPromptModel.bodyAudioOn;

          promptButton1Text = audioPromptModel._buttons.full;
          promptButton2Text = audioPromptModel._buttons.reduced;

          promptButton1Callback = "fullTextAudioOn";
          promptButton2Callback = "reducedTextAudioOn";

        } else {
          promptTitle = audioPromptModel.titleNoReduced;
          promptBody = audioPromptModel.bodyNoReducedAudioOn;

          promptButton1Text = audioPromptModel._buttons.continue;
          promptButton2Text = audioPromptModel._buttons.turnOff;

          promptButton1Callback = "selectContinueAudioOn";
          promptButton2Callback = "selectOff";
        }
      }

      var audioPrompt = new Backbone.Model(audioPromptModel);

      audioPrompt.set('promptTitle', promptTitle);
      audioPrompt.set('promptBody', promptBody);
      audioPrompt.set('promptButton1Text', promptButton1Text);
      audioPrompt.set('promptButton2Text', promptButton2Text);
      audioPrompt.set('promptButton1Callback', promptButton1Callback);
      audioPrompt.set('promptButton2Callback', promptButton2Callback);

      Adapt.audio.promptView = new AudioPromptView({
          model: audioPrompt
      });

      Adapt.trigger("notify:popup", {
          _view: Adapt.audio.promptView,
          _isCancellable: true,
          _showCloseButton: false,
          _closeOnBackdrop: true,
          _classes: ' audio-prompt'
      });

      this.listenToOnce(Adapt, {
          'popup:closed': this.onPromptClosed
      });
    },

    onPromptClosed: function() {
      if (Adapt.audio.externalPromptIsOpen == true) {
        Adapt.audio.promptIsOpen = true;
      } else {
        Adapt.audio.promptIsOpen = false;
      }

      this.audioConfigured();
      this.stopAllChannels();

      for (var i = 0; i < Adapt.audio.numChannels; i++) {
        Adapt.audio.audioClip[i].onscreenID = "";
        if(Adapt.audio.audioClip[i].status == 1) {
          this.playAudio(Adapt.audio.audioClip[i].src, Adapt.audio.audioClip[i].playingID, i);
        }
      }
    },

    playCurrentAudio: function(channel){
      if(Adapt.audio.audioClip[channel].status == 1) {
        Adapt.audio.audioClip[channel].play();
        Adapt.audio.audioClip[channel].isPlaying = true;
        this.showAudioIcon(channel);
      }
    },

    changeText: function(value) {
      Adapt.audio.textSize = value;
      this.updateOfflineStorage();
    },

    onscreenOff: function(id, channel){
      if(id == Adapt.audio.audioClip[channel].playingID){
        Adapt.audio.audioClip[channel].onscreenID = "";
        this.pauseAudio(channel);
      }
    },

    playAudio: function(audioClip, id, channel, popup) {
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
        if ((Adapt.audio.promptIsOpen == false || popup == true) && Adapt.audio.autoPlayOnIOS) {
          try {
            var delay = 500;
            if (id === null) {
              delay = 0;
            }
            setTimeout(function() {
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
    },

    pauseAudio: function(channel) {
      if (!Adapt.audio.audioClip[channel].paused) {
        Adapt.audio.audioClip[channel].isPlaying = false;
        Adapt.audio.audioClip[channel].pause();
        this.hideAudioIcon(channel);
      }
    },

    audioEnded: function(channel) {
      Adapt.audio.audioClip[channel].isPlaying = false;
      this.hideAudioIcon(channel);
    },

    notifyClosed: function() {
      this.stopAllChannels();
      Adapt.audio.promptIsOpen = false;
    },

    popupOpened: function() {
      this.stopAllChannels();
      Adapt.audio.promptIsOpen = true;
      Adapt.audio.externalPromptIsOpen = true;
    },

    popupClosed: function() {
      this.stopAllChannels();
      Adapt.audio.promptIsOpen = false;
      Adapt.audio.audioClip[0].onscreenID = "";
    },

    stopAllChannels: function() {
      // Pause all channels
      for (var i = 0; i < Adapt.audio.numChannels; i++) {
        this.pauseAudio(i);
      }
    },

    showAudioIcon: function(channel) {
      var audioHTMLId = '#'+Adapt.audio.audioClip[channel].newID;

      $(audioHTMLId).removeClass(Adapt.audio.iconPlay);
      $(audioHTMLId).addClass(Adapt.audio.iconPause);
      $(audioHTMLId).addClass('playing');

      if (Adapt.audio.pauseStopAction == "pause") {
        $(audioHTMLId).attr('aria-label', $.a11y_normalize(Adapt.course.get("_globals")._extensions._audio.pauseAriaLabel));
      } else {
        $(audioHTMLId).attr('aria-label', $.a11y_normalize(Adapt.course.get("_globals")._extensions._audio.stopAriaLabel));
      }
    },

    hideAudioIcon: function(channel) {
      if (!Adapt.audio.audioClip[channel].playingID) return;

      var audioHTMLId = '#'+Adapt.audio.audioClip[channel].playingID;

      $(audioHTMLId).removeClass(Adapt.audio.iconPause);
      $(audioHTMLId).addClass(Adapt.audio.iconPlay);
      $(audioHTMLId).removeClass('playing');

      $(audioHTMLId).attr('aria-label', $.a11y_normalize(Adapt.course.get("_globals")._extensions._audio.playAriaLabel));
    },

    updateAudioStatus: function(channel, value) {
      Adapt.audio.audioClip[channel].status = value;
      // Pause audio channel
      Adapt.trigger('audio:pauseAudio', channel);
      // Set to off
      Adapt.audio.audioStatus = 0;
      // Check for narration channel being on
      if(Adapt.audio.audioClip[0].status == 1){
        Adapt.audio.audioStatus = 1;
      }
      this.updateOfflineStorage();
    },

    updateOfflineStorage: function() {
      Adapt.offlineStorage.set("audio_level", Adapt.audio.audioStatus);
      Adapt.offlineStorage.set("audio_textSize", Adapt.audio.textSize);
    },

    audioConfigured: function() {
      Adapt.trigger('audio:configured');
    },

    addAudioDrawerItem: function() {
      var drawerAudio = Adapt.course.get('_audio');
      var drawerObject = {
        title: drawerAudio.title,
        description: drawerAudio.description,
        className: 'audio-drawer',
        drawerOrder: drawerAudio._drawerOrder || 0
      };
      Adapt.drawer.addItem(drawerObject, 'audio:showAudioDrawer');
    },

    setupDrawerAudio: function() {
      var audioDrawerModel = Adapt.course.get('_audio');
      var audioDrawerModel = new Backbone.Model(audioDrawerModel);

      Adapt.drawer.triggerCustomView(new AudioDrawerView({
        model: audioDrawerModel
      }).$el);
    },

    onMenuReady: function(view) {
      if (view.model && view.model.get("_audio") && view.model.get('_type') == "menu" && view.model.get("_audio")._isEnabled) {
        // Pause all channels on view load
        this.stopAllChannels();
        try{
         new AudioMenuView({model:view.model});
        } catch(e){
         console.log(e);
        }
      }
    },

    onABCReady: function(view) {
      if (view.model && view.model.get("_audio") && view.model.get("_audio")._isEnabled) {
        // Pause all channels on view load
        this.stopAllChannels();
        try{
          // Only render view if it DOESN'T already exist - Work around for hotgraphic component
          if (!$('.' + view.model.get('_id')).find('.audio-controls').length) {
            new AudioControlsView({model:view.model});
          }
        } catch(e){
          console.log(e);
        }
      }
      if (view.model && view.model.get("_audioAssessment") && view.model.get("_audioAssessment")._isEnabled) {
        // Pause all channels on view load
        this.stopAllChannels();
        try{
          // Only render view if it DOESN'T already exist - Work around for assessmentResults component
          if (!$('.' + view.model.get('_id')).find('.audio-controls').length) {
            new AudioResultsView({model:view.model});
          }
        } catch(e){
          console.log(e);
        }
      }
    }

  }, Backbone.Events);

    AudioController.initialize();

    return AudioController;

});
