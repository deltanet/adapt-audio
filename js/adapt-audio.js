define([
    'coreJS/adapt',
    './audio-toggle-view',
    './audio-drawer-view',
    './audio-helpers',
    './audio-controls-view'
], function(Adapt, AudioToggleView, AudioDrawerView, AudioHelpers, AudioControlsView) {

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
      this.listenTo(Adapt, "pageView:ready", this.onPageReady);
      // load article, block, component audio
      this.listenTo(Adapt, "articleView:postRender blockView:postRender componentView:postRender", this.onABCReady);
      this.listenTo(Adapt, "audio:playAudio", this.playAudio);
      this.listenTo(Adapt, "audio:pauseAudio", this.pauseAudio);
      this.listenTo(Adapt, "audio:audioEnded", this.audioEnded);
      // listen to toggle audio on or off
      this.listenTo(Adapt, "audio:updateAudioStatus", this.updateAudioStatus);
      // setup audio in drawer
      this.listenTo(Adapt, "audio:showAudioDrawer", this.setupDrawerAudio)
    },

    setupAudio: function() {
      if (Adapt.config.get("_audio") && Adapt.config.get("_audio")._isEnabled) {
        this.audioEnabled = Adapt.config.get("_audio")._isEnabled;
      } else {
        this.audioEnabled = {"_isEnabled": false};
      }

      // Define audio model for all other views and components to reference
      Adapt.audio = {};
      Adapt.audio.audioChannel = new Array();
      Adapt.audio.audioClip = new Array();

      // Set number of audio channels specified in the course JSON
      Adapt.audio.numChannels = Adapt.course.get('_audio')._audioItems ? Adapt.course.get('_audio')._audioItems.length : 0;
      // Create audio objects based on the number of channels
      for (var i = 0; i < Adapt.audio.numChannels; i++) {
        Adapt.audio.audioClip[i] = new Audio();
      }

      // set audio status, needs to check if this should be on/off but set to 1 for now. 
      var audioPreference = Adapt.offlineStorage.get("audio_level");
      if (audioPreference) {
        Adapt.audio.audioStatus = Adapt.offlineStorage.get("audio_level");
      } else {
        Adapt.audio.audioStatus = 1;
      }

      // Assign variables to each audio object
      for (var i = 0; i < Adapt.audio.numChannels; i++) {
        Adapt.audio.audioClip[i].status = parseInt(Adapt.audio.audioStatus);
        Adapt.audio.audioClip[i].isPlaying = false;
        Adapt.audio.audioClip[i].playingID = "";
        Adapt.audio.audioClip[i].newID = "";
      }
    },

    onPageReady: function(view) {
      if (this.audioEnabled) {
          new AudioToggleView({model:view.model});
      }
    },

    playAudio: function(audioClip, id, channel) {
      // Update previous player
      this.hideAudioIcon(channel);
      // Update player to new clip vars
      Adapt.audio.audioClip[channel].src = audioClip;
      Adapt.audio.audioClip[channel].newID = id;
      // Play clip
      if(Adapt.audio.audioClip[channel].status==1){
        try {
          setTimeout(function() {Adapt.audio.audioClip[channel].play();},500);
          Adapt.audio.audioClip[channel].isPlaying = true;
          this.showAudioIcon(channel);
        } catch(e) {
          console.log('Audio play error:' + e);
        }
      }
      // Update player ID to new clip
      Adapt.audio.audioClip[channel].playingID = Adapt.audio.audioClip[channel].newID;

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
      //this.pauseAudio(channel);

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

      if (this.audioEnabled  && view.model && view.model.get("_audio")) {
          try{
            new AudioControlsView({model:view.model});
          } catch(e){
            console.log(e);
          }
      }
    }

  }, Backbone.Events);


    AudioController.initialize();

    return AudioController;

})