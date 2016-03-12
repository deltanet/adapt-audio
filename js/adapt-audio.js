define([
    'coreJS/adapt',
    './audio-toggle-view',
    './audio-drawer-view',
    './audio-controls-view',
    './audio-results-view',
    './audio-reducedText'
], function(Adapt, AudioToggleView, AudioDrawerView, AudioControlsView, AudioResultsView) {

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
    },

    setupAudio: function() {
      if (Adapt.config.get("_audio") && Adapt.config.get("_audio")._isEnabled) {
        this.audioEnabled = Adapt.config.get("_audio")._isEnabled;
      } else {
        this.audioEnabled = false;
      }

      // Define audio model for all other views and components to reference
      Adapt.audio = {};
      Adapt.audio.audioChannel = new Array();
      Adapt.audio.audioClip = new Array();

      // Set global course autoplay based on modernizer.touch then course JSON.
      //Adapt.audio.autoPlayGlobal = Modernizr.touch ? false : Adapt.course.get('_audio')._autoplay ? true : false;

      // Set global course autoplay based on course JSON.
      Adapt.audio.autoPlayGlobal = Adapt.course.get('_audio')._autoplay ? true : false;

      // Set number of audio channels specified in the course JSON
      //Adapt.audio.numChannels = Adapt.course.get('_audio')._audioItems ? Adapt.course.get('_audio')._audioItems.length : 0;
      Adapt.audio.numChannels = 2; //HAD TO HARD CODE VALUE IN OTHER WISE IN THE AUTHORING TOOL GIVES _audioItems ERROR EVEN WITH EXTENSION NOT ENABLED ON COURSE

      // Create audio objects based on the number of channels
      for (var i = 0; i < Adapt.audio.numChannels; i++) {
        Adapt.audio.audioClip[i] = new Audio();
      }

      // Collect saved audio status 
      Adapt.audio.audioStatus = Adapt.offlineStorage.get("audio_level");
      // If status is not zero then presume one hasn't been stored and set to default on
      if(Adapt.audio.audioStatus !== 0) {
        Adapt.audio.audioStatus = 1;
      }

      // Assign variables to each audio object
      for (var i = 0; i < Adapt.audio.numChannels; i++) {
        Adapt.audio.audioClip[i].status = parseInt(Adapt.audio.audioStatus);
        Adapt.audio.audioClip[i].isPlaying = false;
        Adapt.audio.audioClip[i].playingID = "";
        Adapt.audio.audioClip[i].newID = "";
        Adapt.audio.audioClip[i].prevID = "";
      }

      // Reduced text - Only available if audio is enabled
      if (Adapt.config.get("_reducedText") && Adapt.config.get("_reducedText")._isEnabled && this.audioEnabled) {
        // Detrermine text size based on audio preference
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
      if (this.audioEnabled) {
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

      if(Adapt.config.get("_reducedText") && Adapt.config.get("_reducedText")._isEnabled) {
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

    showAudioIcon: function(channel) {
      var audioHTMLId = '#'+Adapt.audio.audioClip[channel].newID;
      try {
        $(audioHTMLId).removeClass('fa-play');
        $(audioHTMLId).addClass('fa-pause');
        $(audioHTMLId).addClass('playing');
      } catch(e) {
        console.error("audio error");
      }
    },

    hideAudioIcon: function(channel) {
      try {
        $('#'+Adapt.audio.audioClip[channel].playingID).removeClass('fa-pause');
        $('#'+Adapt.audio.audioClip[channel].playingID).addClass('fa-play');
        $('#'+Adapt.audio.audioClip[channel].playingID).removeClass('playing');
      } catch(e) {
        console.error("audio error");
      }
    },

    updateAudioStatus: function(channel, value) {
      Adapt.audio.audioClip[channel].status = value;
      // Check for any channel being on
      for (var i = 0; i < Adapt.audio.numChannels; i++) {
        if(Adapt.audio.audioClip[i].status==1){
          Adapt.audio.audioStatus = 1;
        } else {
          Adapt.audio.audioStatus = 0;
        }
      }
      // store audio preference, 
      Adapt.offlineStorage.set("audio_level", Adapt.audio.audioStatus);
    },

    addAudioDrawerItem: function() {
      var drawerAudio = Adapt.course.get('_audio');

      if (this.audioEnabled && drawerAudio && drawerAudio._enableAudioDrawer) {
        var drawerObject = {
              title: drawerAudio.title,
              description: drawerAudio.description,
              className: 'audio-drawer'
          };
          Adapt.drawer.addItem(drawerObject, 'audio:showAudioDrawer');
      } else {
        return console.log('Sorry, audio is disabled or no audio object is set on the course.json file.');
      }
    },

    setupDrawerAudio: function() {
      var audioDrawerModel = Adapt.course.get('_audio');
      var audioItems = audioDrawerModel._audioItems;
      var audioDrawerCollection = new Backbone.Collection(audioItems);
      var audioDrawerModel = new Backbone.Model(audioDrawerModel);

      Adapt.drawer.triggerCustomView(new AudioDrawerView({
        model: audioDrawerModel, 
        collection: audioDrawerCollection
      }).$el);
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