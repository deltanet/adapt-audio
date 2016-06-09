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
      this.setupEventListeners();
      this.setupAudio();
      this.addAudioDrawerItem();
    },

    setupEventListeners: function() {
      // load topnav AudioToggleView
      this.listenTo(Adapt, "router:page router:menu", this.onAddToggle);
      // load menu audio
      this.listenTo(Adapt, "menuView:postRender", this.onMenuReady);
      // load article, block, component audio
      this.listenTo(Adapt, "articleView:postRender blockView:postRender componentView:postRender", this.onABCReady);
      this.listenTo(Adapt, "audio:inviewOff", this.inviewOff);
      this.listenTo(Adapt, "audio:playAudio", this.playAudio);
      this.listenTo(Adapt, "audio:pauseAudio", this.pauseAudio);
      this.listenTo(Adapt, "audio:audioEnded", this.audioEnded);
      // listen to toggle audio on or off
      this.listenTo(Adapt, "audio:updateAudioStatus", this.updateAudioStatus);
      // setup audio in drawer
      this.listenTo(Adapt, "audio:showAudioDrawer", this.setupDrawerAudio);
      // listen to text change in nav bar toggle prompt
      this.listenTo(Adapt, "audio:changeText", this.changeText);
      // Listen for bookmark
      this.listenToOnce(Adapt, "router:location", this.checkBookmark);
      // Listen for notify closing
      this.listenTo(Adapt, 'notify:closed', this.stopAllChannels);
    },

    setupAudio: function() {
      if (Adapt.course.get("_audio") && Adapt.course.get("_audio")._isEnabled) {
        this.audioEnabled = Adapt.course.get("_audio")._isEnabled;
      } else {
        this.audioEnabled = false;
      }

      if (Adapt.course.get("_audio") && Adapt.course.get("_audio")._reducedTextisEnabled) {
        this.reducedTextEnabled = Adapt.course.get("_audio")._reducedTextisEnabled;
      } else {
        this.reducedTextEnabled = false;
      }

      // Define audio model for all other views and components to reference
      Adapt.audio = {};
      Adapt.audio.audioChannel = new Array();
      Adapt.audio.audioClip = new Array();

      // Set global course autoplay based on course JSON.
      Adapt.audio.autoPlayGlobal = Adapt.course.get('_audio')._autoplay ? true : false;

      // Get names for icons from course.config
      Adapt.audio.iconOn = Adapt.course.get('_audio')._icons._audioOn;
      Adapt.audio.iconOff = Adapt.course.get('_audio')._icons._audioOff;
      Adapt.audio.iconPause = Adapt.course.get('_audio')._icons._audioPause;

      // Set number of audio channels specified in the course JSON
      Adapt.audio.numChannels = 3;
      // Create audio objects based on the number of channels
      for (var i = 0; i < Adapt.audio.numChannels; i++) {
        Adapt.audio.audioClip[i] = new Audio();
      }

      //Set default audio status for each channel base on the course config
      Adapt.audio.audioClip[0].status = Adapt.course.get('_audio')._channels._narration._status;
      Adapt.audio.audioClip[1].status = Adapt.course.get('_audio')._channels._effects._status;
      Adapt.audio.audioClip[2].status = Adapt.course.get('_audio')._channels._music._status;

      // Collect saved audio status 
      Adapt.audio.audioStatus = Adapt.offlineStorage.get("audio_level");
      // If status is not zero then presume one hasn't been stored and set to default on
      if(Adapt.audio.audioStatus !== 0) {
        Adapt.audio.audioStatus = 1;
      } else {
        Adapt.audio.audioClip[0].status = 0;
        Adapt.audio.audioClip[1].status = 0;
        Adapt.audio.audioClip[2].status = 0;
      }

      // Assign variables to each audio object
      for (var i = 0; i < Adapt.audio.numChannels; i++) {
        Adapt.audio.audioClip[i].isPlaying = false;
        Adapt.audio.audioClip[i].playingID = "";
        Adapt.audio.audioClip[i].newID = "";
        Adapt.audio.audioClip[i].prevID = "";
      }
      
      // Reduced text - Only available if audio is enabled
      if (this.reducedTextEnabled && this.audioEnabled) {
        // Determine text size based on audio preference
        // If audio is off then show full text
        if (Adapt.audio.audioStatus == 0) {
          Adapt.audio.textSize = 0;
        } else {
          // If audio is on then show reduced text
          Adapt.audio.textSize = 1;
        }
      } else {
        // If reduced text is disabled then set size to full
        Adapt.audio.textSize = 0;
      }

    },

    onAddToggle: function(pageModel) {
      if (this.audioEnabled && Adapt.course.get('_audio')._showOnNavbar) {
          new AudioToggleView({model:pageModel});
      }
    },

    checkBookmark: function() {
      if (this.audioEnabled) {
        if((typeof Adapt.offlineStorage.get("location") === "undefined") || (Adapt.offlineStorage.get("location") == "")) {
          this.showAudioPrompt();
        }
      }
    },

    showAudioPrompt: function() {
      // Pause all channels
      for (var i = 0; i < Adapt.audio.numChannels; i++) {
        Adapt.trigger('audio:pauseAudio', i);
      }

      var audioPromptModel = Adapt.course.get('_audio')._prompt;

      this.listenToOnce(Adapt, "audio:fullText", this.setFullText);
      this.listenToOnce(Adapt, "audio:reducedText", this.setReducedText);

      this.listenToOnce(Adapt, "audio:selectContinue", this.setContinue);
      this.listenToOnce(Adapt, "audio:selectOff", this.setAudioOff);

      if(this.reducedTextEnabled) {
        var audioPromptObject = {
          header: Adapt.course.get('_audio')._prompt._graphic.src,
          title: audioPromptModel.title,
          body: audioPromptModel.body,
          _prompts:[
              {
                  promptText: audioPromptModel._buttons.full,
                  _callbackEvent: "audio:fullText",
              },
              {
                  promptText: audioPromptModel._buttons.reduced,
                  _callbackEvent: "audio:reducedText",
              }
          ],
          _showIcon: false
        }
      } else {
        var audioPromptObject = {
          header: Adapt.course.get('_audio')._prompt._graphic.src,
          title: audioPromptModel.titleNoReduced,
          body: audioPromptModel.bodyNoReduced,
          _prompts:[
              {
                  promptText: audioPromptModel._buttons.continue,
                  _callbackEvent: "audio:selectContinue",
              },
              {
                  promptText: audioPromptModel._buttons.turnOff,
                  _callbackEvent: "audio:selectOff",
              }
          ],
          _showIcon: false
        }
      }
      Adapt.trigger('notify:prompt', audioPromptObject);
    },

    setFullText: function() {
      Adapt.audio.audioStatus = 1;
      Adapt.trigger('audio:changeText', 0);
      this.playCurrentAudio(0);
      this.stopListening(Adapt, "audio:fullText");
    },

    setReducedText: function() {
      Adapt.audio.audioStatus = 1;
      Adapt.trigger('audio:changeText', 1);
      this.playCurrentAudio(0);
      this.stopListening(Adapt, "audio:reducedText");
    },

    setContinue: function() {
      Adapt.audio.audioStatus = 1;
      Adapt.trigger('audio:changeText', 0);
      this.playCurrentAudio(0);
      this.stopListening(Adapt, "audio:selectContinue");
    },

    setAudioOff: function() {
      Adapt.audio.audioStatus = 0;
      for (var i = 0; i < Adapt.audio.numChannels; i++) {
        Adapt.audio.audioClip[i].status = parseInt(Adapt.audio.audioStatus);
      }
      Adapt.trigger('audio:updateAudioStatus', 0,0);
      Adapt.trigger('audio:changeText', 0);
      this.stopListening(Adapt, "audio:selectOff");
    },

    playCurrentAudio: function(channel){
      Adapt.audio.audioClip[channel].play();
      Adapt.audio.audioClip[channel].isPlaying = true;
      this.showAudioIcon(channel);
    },

    changeText: function(value) {
      Adapt.audio.textSize = value;
    },

    inviewOff: function(id, channel){
      if(id == Adapt.audio.audioClip[channel].playingID){
        Adapt.trigger('audio:pauseAudio', channel);
      }
    },

    playAudio: function(audioClip, id, channel) {
      if(this.audioEnabled){
        // Update previous player
        this.hideAudioIcon(channel);
        Adapt.audio.audioClip[channel].prevID = Adapt.audio.audioClip[channel].playingID;
        // Update player to new clip vars
        Adapt.audio.audioClip[channel].src = audioClip;
        Adapt.audio.audioClip[channel].newID = id;
        try {
          setTimeout(function() {Adapt.audio.audioClip[channel].play();},500);
          Adapt.audio.audioClip[channel].isPlaying = true;
          this.showAudioIcon(channel);

        } catch(e) {
          console.log('Audio play error:' + e);
        }
        // Update player ID to new clip
        Adapt.audio.audioClip[channel].playingID = Adapt.audio.audioClip[channel].newID;
      }
    },

    pauseAudio: function(channel) {
      if (!Adapt.audio.audioClip[channel].paused) {
        Adapt.audio.audioClip[channel].pause();
        this.hideAudioIcon(channel);
      }
    },

    audioEnded: function(channel) {
      Adapt.audio.audioClip[channel].isPlaying = false;
      this.hideAudioIcon(channel);
    },

    stopAllChannels: function() {
      // Pause all channels
      for (var i = 0; i < Adapt.audio.numChannels; i++) {
        Adapt.trigger('audio:pauseAudio', i);
      }
    },

    showAudioIcon: function(channel) {
      var audioHTMLId = '#'+Adapt.audio.audioClip[channel].newID;
      try {
        $(audioHTMLId).removeClass(Adapt.audio.iconOn);
        $(audioHTMLId).addClass(Adapt.audio.iconPause);
        $(audioHTMLId).addClass('playing');
      } catch(e) {
        console.error("audio error");
      }
    },

    hideAudioIcon: function(channel) {
      try {
        $('#'+Adapt.audio.audioClip[channel].playingID).removeClass(Adapt.audio.iconPause);
        $('#'+Adapt.audio.audioClip[channel].playingID).addClass(Adapt.audio.iconOn);
        $('#'+Adapt.audio.audioClip[channel].playingID).removeClass('playing');
      } catch(e) {
        console.error("audio error");
      }
    },

    updateAudioStatus: function(channel, value) {
      Adapt.audio.audioClip[channel].status = value;
      // Pause audio channel
      Adapt.trigger('audio:pauseAudio', channel);
      // Check for narration channel being on
      if(Adapt.audio.audioClip[0].status==1){
          Adapt.audio.audioStatus = 1;
        } else {
          Adapt.audio.audioStatus = 0;
      }
      // Store audio preference
      Adapt.offlineStorage.set("audio_level", Adapt.audio.audioStatus);
    },

    addAudioDrawerItem: function() {
      var drawerAudio = Adapt.course.get('_audio');

      if (this.audioEnabled) {
        var drawerObject = {
              title: drawerAudio.title,
              description: drawerAudio.description,
              className: 'audio-drawer'
          };
          Adapt.drawer.addItem(drawerObject, 'audio:showAudioDrawer');
      }
    },

    setupDrawerAudio: function() {
      var audioDrawerModel = Adapt.course.get('_audio');
      var audioDrawerModel = new Backbone.Model(audioDrawerModel);

      Adapt.drawer.triggerCustomView(new AudioDrawerView({
        model: audioDrawerModel
      }).$el);
    },

    onMenuReady: function(view) {
      // Pause all channels on view load
      for (var i = 0; i < Adapt.audio.numChannels; i++) {
        Adapt.trigger('audio:pauseAudio', i);
      }

      if (this.audioEnabled && view.model && view.model.get("_audio") && view.model.get('_type') == "menu") {
          try{
            new AudioMenuView({model:view.model});
          } catch(e){
            console.log(e);
          }
      }

    },

    onABCReady: function(view) {
      // Pause all channels on view load
      for (var i = 0; i < Adapt.audio.numChannels; i++) {
        Adapt.trigger('audio:pauseAudio', i);
      }
      if (this.audioEnabled && view.model && view.model.get("_audio")) {
          try{
            new AudioControlsView({model:view.model});
          } catch(e){
            console.log(e);
          }
      }
      if (this.audioEnabled && view.model && view.model.get("_audioAssessment")) {
          try{
            new AudioResultsView({model:view.model});
          } catch(e){
            console.log(e);
          }
      }
    }

  }, Backbone.Events);

    AudioController.initialize();

    return AudioController;

})