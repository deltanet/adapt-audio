define([
    'coreJS/adapt',
    './audio-toggle-view',
    './audio-drawer-view',
    './audio-menu-view',
    './audio-controls-view',
    './audio-results-view'
], function(Adapt, AudioToggleView, AudioDrawerView, AudioMenuView, AudioControlsView, AudioResultsView) {

  var AudioController = _.extend({

    initialize: function() {
        this.listenToOnce(Adapt, "app:dataReady", this.onDataReady);
    },

    onDataReady: function() {
      if (Adapt.course.get("_audio") && Adapt.course.get("_audio")._isEnabled) {
        this.setupEventListeners();
        this.setupAudio();
        this.addAudioDrawerItem();
      }
    },

    setupEventListeners: function() {
      // load navigation toggle button
      this.listenTo(Adapt, "navigationView:postRender", this.onAddToggle);
      // load menu audio
      this.listenTo(Adapt, "menuView:postRender", this.onMenuReady);
      // load article, block, component audio
      this.listenTo(Adapt, "articleView:postRender blockView:postRender componentView:postRender", this.onABCReady);
      this.listenTo(Adapt, "audio:onscreenOff", this.onscreenOff);
      this.listenTo(Adapt, "audio:playAudio", this.playAudio);
      this.listenTo(Adapt, "audio:pauseAudio", this.pauseAudio);
      this.listenTo(Adapt, "audio:stopAllChannels", this.stopAllChannels);
      this.listenTo(Adapt, "audio:audioEnded", this.audioEnded);
      // listen to toggle audio on or off
      this.listenTo(Adapt, "audio:updateAudioStatus", this.updateAudioStatus);
      // setup audio in drawer
      this.listenTo(Adapt, "audio:showAudioDrawer", this.setupDrawerAudio);
      // listen to text change in nav bar toggle prompt
      this.listenTo(Adapt, "audio:changeText", this.changeText);
      // Check for first launch of course
      this.listenToOnce(Adapt, "router:location", this.checkLaunch);
      // Listen for bookmarking being cancelled
      this.listenToOnce(Adapt, "bookmarking:cancel", this.promptClosed);
      // Listen for language change
      this.listenTo(Adapt.config, 'change:_activeLanguage', this.onLangChange);
      // Listen for notify closing
      this.listenTo(Adapt, 'notify:closed', this.notifyClosed);
      // Listeners for new popup functionality
      this.listenTo(Adapt, 'audio:popupOpened', this.popupOpened);
      this.listenTo(Adapt, 'audio:popupClosed', this.popupClosed);
      // // Stop all audio channels before the pages load
      this.listenTo(Adapt, "menuView:preRender pageView:preRender", this.stopAllChannels);
    },

    setupAudio: function() {
      if (Adapt.course.get("_audio") && Adapt.course.get("_audio")._reducedTextisEnabled) {
        this.reducedTextEnabled = Adapt.course.get("_audio")._reducedTextisEnabled;
      } else {
        this.reducedTextEnabled = false;
      }

      // Define audio model for all other views and components to reference
      Adapt.audio = {};
      Adapt.audio.audioClip = new Array();

      // Set variable to be used for the initial prompt event
      Adapt.audio.promptIsOpen = false;

      // Set variable to be used for the initial prompt event
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

    onAddToggle: function(navigationView) {
      var audioModel = Adapt.course.get('_audio');
      var audioToggleModel = new Backbone.Model(audioModel);
      navigationView.$('.navigation-drawer-toggle-button').after(new AudioToggleView({
        model: audioToggleModel
      }).$el);
    },

    checkLaunch: function() {
      // Check launch based on the saved location
      if((Adapt.offlineStorage.get("location") === "undefined") || (Adapt.offlineStorage.get("location") === undefined) || (Adapt.offlineStorage.get("location") == "")) {
        if (Adapt.course.get('_audio')._prompt._isEnabled) {
          this.showAudioPrompt();
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
      }
    },

    bookmarkOpened: function() {
      Adapt.audio.promptIsOpen = true;
    },

    onLangChange: function() {
      this.listenToOnce(Adapt, "app:dataReady", this.onDataChanged);
    },

    onDataChanged: function() {
      if (Adapt.course.get("_audio") && Adapt.course.get("_audio")._reducedTextisEnabled) {
        this.reducedTextEnabled = Adapt.course.get("_audio")._reducedTextisEnabled;
      } else {
        this.reducedTextEnabled = false;
      }

      // Set variable to be used for the initial prompt event
      Adapt.audio.promptIsOpen = false;

      // Set default text size to full
      Adapt.audio.textSize = 0;

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

      Adapt.offlineStorage.set("location", "");
      this.listenToOnce(Adapt, "router:location", this.checkLaunch);
    },

    showAudioPrompt: function() {
      Adapt.audio.promptIsOpen = true;

      var audioPromptModel = Adapt.course.get('_audio')._prompt;

      this.listenToOnce(Adapt, "audio:fullTextAudioOn", this.setFullTextAudioOn);
      this.listenToOnce(Adapt, "audio:reducedTextAudioOn", this.setReducedTextAudioOn);

      this.listenToOnce(Adapt, "audio:fullTextAudioOff", this.setFullTextAudioOff);
      this.listenToOnce(Adapt, "audio:reducedTextAudioOff", this.setReducedTextAudioOff);

      this.listenToOnce(Adapt, "audio:selectContinueAudioOn", this.setContinueAudioOn);
      this.listenToOnce(Adapt, "audio:selectContinueAudioOff", this.setContinueAudioOff);

      this.listenToOnce(Adapt, "audio:selectOff", this.setAudioOff);
      this.listenToOnce(Adapt, "audio:selectOn", this.setAudioOn);

      // Set variable to use when adding the image to the notify popup
      if(Adapt.course.get('_audio')._prompt._graphic && !Adapt.course.get('_audio')._prompt._graphic.src == "") {
        var headerImage = "<div class='audio-prompt-image'><img src='"+Adapt.course.get('_audio')._prompt._graphic.src+"'/></div>";
      } else {
        var headerImage = "";
      }

      // If audio is off
      if(Adapt.audio.audioStatus == 0) {
        if(this.reducedTextEnabled) {
          var audioPromptObject = {
            title: headerImage+audioPromptModel.title,
            body: audioPromptModel.bodyAudioOff,
            _prompts:[
                {
                    promptText: audioPromptModel._buttons.full,
                    _callbackEvent: "audio:fullTextAudioOff",
                },
                {
                    promptText: audioPromptModel._buttons.reduced,
                    _callbackEvent: "audio:reducedTextAudioOff",
                }
            ],
            _showIcon: false
          }
        } else {
          var audioPromptObject = {
            title: headerImage+audioPromptModel.titleNoReduced,
            body: audioPromptModel.bodyNoReducedAudioOff,
            _prompts:[
                {
                    promptText: audioPromptModel._buttons.continue,
                    _callbackEvent: "audio:selectContinueAudioOff",
                },
                {
                    promptText: audioPromptModel._buttons.turnOn,
                    _callbackEvent: "audio:selectOn",
                }
            ],
            _showIcon: false
          }
        }
      } else {
        if(this.reducedTextEnabled) {
          var audioPromptObject = {
            title: headerImage+audioPromptModel.title,
            body: audioPromptModel.bodyAudioOn,
            _prompts:[
                {
                    promptText: audioPromptModel._buttons.full,
                    _callbackEvent: "audio:fullTextAudioOn",
                },
                {
                    promptText: audioPromptModel._buttons.reduced,
                    _callbackEvent: "audio:reducedTextAudioOn",
                }
            ],
            _showIcon: false
          }
        } else {
          var audioPromptObject = {
            title: headerImage+audioPromptModel.titleNoReduced,
            body: audioPromptModel.bodyNoReducedAudioOn,
            _prompts:[
                {
                    promptText: audioPromptModel._buttons.continue,
                    _callbackEvent: "audio:selectContinueAudioOn",
                },
                {
                    promptText: audioPromptModel._buttons.turnOff,
                    _callbackEvent: "audio:selectOff",
                }
            ],
            _showIcon: false
          }
        }
      }
      Adapt.trigger('notify:prompt', audioPromptObject);
    },

    setFullTextAudioOn: function() {
      this.audioConfigured();
      Adapt.audio.audioStatus = 1;
      Adapt.audio.autoPlayOnIOS = true;
      Adapt.trigger('audio:changeText', 0);
      this.stopListening(Adapt, "audio:fullTextAudioOn");
      this.promptClosed();
    },

    setFullTextAudioOff: function() {
      this.audioConfigured();
      this.updatePromptStatus();
      Adapt.audio.audioStatus = 0;
      Adapt.audio.autoPlayOnIOS = true;
      Adapt.trigger('audio:changeText', 0);
      this.stopListening(Adapt, "audio:fullTextAudioOff");
    },

    setReducedTextAudioOn: function() {
      this.audioConfigured();
      Adapt.audio.audioStatus = 1;
      Adapt.audio.autoPlayOnIOS = true;
      Adapt.trigger('audio:changeText', 1);
      this.stopListening(Adapt, "audio:reducedTextAudioOn");
      this.promptClosed();
    },

    setReducedTextAudioOff: function() {
      this.audioConfigured();
      this.updatePromptStatus();
      Adapt.audio.audioStatus = 0;
      Adapt.audio.autoPlayOnIOS = true;
      Adapt.trigger('audio:changeText', 1);
      this.stopListening(Adapt, "audio:reducedTextAudioOff");
    },

    setContinueAudioOn: function() {
      this.audioConfigured();
      this.updatePromptStatus();
      Adapt.audio.audioStatus = 1;
      Adapt.audio.autoPlayOnIOS = true;
      Adapt.trigger('audio:changeText', 0);
      this.stopListening(Adapt, "audio:selectContinueAudioOn");
      this.promptClosed();
    },

    setContinueAudioOff: function() {
      this.audioConfigured();
      this.updatePromptStatus();
      Adapt.audio.audioStatus = 0;
      Adapt.audio.autoPlayOnIOS = true;
      Adapt.trigger('audio:changeText', 0);
      this.stopListening(Adapt, "audio:selectContinueAudioOn");
    },

    setAudioOff: function() {
      this.audioConfigured();
      Adapt.audio.audioStatus = 0;
      Adapt.audio.autoPlayOnIOS = true;
      for (var i = 0; i < Adapt.audio.numChannels; i++) {
        Adapt.audio.audioClip[i].status = parseInt(Adapt.audio.audioStatus);
      }
      Adapt.trigger('audio:updateAudioStatus', 0,0);
      Adapt.trigger('audio:changeText', 0);
      this.stopListening(Adapt, "audio:selectOff");
      this.promptClosed();
    },

    setAudioOn: function() {
      this.audioConfigured();
      Adapt.audio.audioStatus = 1;
      Adapt.audio.autoPlayOnIOS = true;
      for (var i = 0; i < Adapt.audio.numChannels; i++) {
        Adapt.audio.audioClip[i].status = parseInt(Adapt.audio.audioStatus);
      }
      Adapt.trigger('audio:updateAudioStatus', 0,1);
      Adapt.trigger('audio:changeText', 0);
      this.stopListening(Adapt, "audio:selectOn");
      this.promptClosed();
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

    promptClosed: function() {
      this.stopAllChannels();
      this.updatePromptStatus();
      Adapt.audio.audioClip[0].onscreenID = "";
      if(Adapt.audio.audioClip[0].status == 1) {
        this.playAudio(Adapt.audio.audioClip[0].src, Adapt.audio.audioClip[0].playingID, 0);
      }
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

    updatePromptStatus: function() {
      if (Adapt.audio.externalPromptIsOpen == true) {
        Adapt.audio.promptIsOpen = true;
      } else {
        Adapt.audio.promptIsOpen = false;
      }
    },

    stopAllChannels: function() {
      // Pause all channels
      for (var i = 0; i < Adapt.audio.numChannels; i++) {
        this.pauseAudio(i);
      }
    },

    showAudioIcon: function(channel) {
      var audioHTMLId = '#'+Adapt.audio.audioClip[channel].newID;
      try {
        $(audioHTMLId).removeClass(Adapt.audio.iconPlay);
        $(audioHTMLId).addClass(Adapt.audio.iconPause);
        $(audioHTMLId).addClass('playing');
      } catch(e) {
        console.error("audio error");
      }
    },

    hideAudioIcon: function(channel) {
      try {
        $('#'+Adapt.audio.audioClip[channel].playingID).removeClass(Adapt.audio.iconPause);
        $('#'+Adapt.audio.audioClip[channel].playingID).addClass(Adapt.audio.iconPlay);
        $('#'+Adapt.audio.audioClip[channel].playingID).removeClass('playing');
      } catch(e) {
        console.error("audio error");
      }
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
          new AudioControlsView({model:view.model});
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

})
