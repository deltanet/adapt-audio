/*
* adapt-audio
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Robert Peek <robert@delta-net.co.uk>
*/
define(function(require) {

	var Adapt = require('coreJS/adapt');
	var Backbone = require('backbone');
	var AudioToggleView = require('extensions/adapt-audio/js/audio-toggle-view');
	var AudioDrawerView = require('extensions/adapt-audio/js/audio-drawer-view');
	var AudioHelpers = require('extensions/adapt-audio/js/audio-helpers');
	var AudioControlsView = require('extensions/adapt-audio/js/audio-controls-view');

	// Define audio model for all other views and components to reference
	Adapt.audio = {};

	// Create audio channels for the types of audio available
	Adapt.audio.narrationClip = new Audio();
	Adapt.audio.musicClip = new Audio();
	Adapt.audio.effectsClip = new Audio();

	// Set default for each audio channel as 'Not playing' *** Used for the audio player toggle button
	Adapt.audio.narrationClip.isPlaying = false;
	Adapt.audio.musicClip.isPlaying = false;
	Adapt.audio.effectsClip.isPlaying = false;

	Adapt.audio.narrationClip.playingID = "";
	Adapt.audio.musicClip.playingID = "";
	Adapt.audio.effectsClip.playingID = "";

	Adapt.audio.narrationClip.newID = "";
	Adapt.audio.musicClip.newID = "";
	Adapt.audio.effectsClip.newID = "";

	// Create functions for other views and components to trigger playing and pausing/stopping each audio channel
	//
	///// Narration Audio /////
	Adapt.on('audio:playNarrationAudio', function(audioClip,id) {
		// Stop current clip
        Adapt.trigger('audio:pauseNarrationAudio');
        // Update player to new clip vars
        Adapt.audio.narrationClip.src = audioClip;
        Adapt.audio.narrationClip.newID = id;
        // Play clip
        if(Adapt.audio.narrationAudio==1){
        	setTimeout(function() {Adapt.audio.narrationClip.play();},3000);
            Adapt.audio.narrationClip.isPlaying=true;
            $('#'+Adapt.audio.narrationClip.newID).removeClass('fa-volume-off');
            $('#'+Adapt.audio.narrationClip.newID).addClass('fa-volume-up');
	        $('#'+Adapt.audio.narrationClip.newID).addClass('playing');
        }
        // Update player ID to new clip
        Adapt.audio.narrationClip.playingID = Adapt.audio.narrationClip.newID;
	});

	Adapt.on('audio:pauseNarrationAudio', function() {
        Adapt.audio.narrationClip.pause();
        Adapt.trigger('audio:narrationEnded');
	});

	Adapt.on('audio:narrationEnded', function () {
		Adapt.audio.narrationClip.isPlaying=false;
		$('#'+Adapt.audio.narrationClip.playingID).removeClass('fa-volume-up');
        $('#'+Adapt.audio.narrationClip.playingID).addClass('fa-volume-off');
        $('#'+Adapt.audio.narrationClip.playingID).removeClass('playing');
	});
	//////////////////////////
	//
	//
	///// Music Audio /////
	Adapt.on('audio:playMusicAudio', function(audioClip,id) {
		// Stop current clip
        Adapt.trigger('audio:pauseMusicAudio');
        // Update player to new clip vars
        Adapt.audio.musicClip.src = audioClip;
        Adapt.audio.musicClip.newID = id;
        // Play clip
        if(Adapt.audio.musicAudio==1){
            Adapt.audio.musicClip.play();
            Adapt.audio.musicClip.isPlaying=true;
            $('#'+Adapt.audio.musicClip.newID).removeClass('fa-volume-off');
            $('#'+Adapt.audio.musicClip.newID).addClass('fa-volume-up');
	        $('#'+Adapt.audio.musicClip.newID).addClass('playing');
        }
        // Update player ID to new clip
        Adapt.audio.musicClip.playingID = Adapt.audio.musicClip.newID;
	});

	Adapt.on('audio:pauseMusicAudio', function() {
        Adapt.audio.musicClip.pause();
        Adapt.trigger('audio:musicEnded');
	});

	Adapt.on('audio:musicEnded', function () {
		Adapt.audio.musicClip.isPlaying=false;
		$('#'+Adapt.audio.musicClip.playingID).removeClass('fa-volume-up');
        $('#'+Adapt.audio.musicClip.playingID).addClass('fa-volume-off');
        $('#'+Adapt.audio.musicClip.playingID).removeClass('playing');
	});
	///////////////////////
	//
	//
	///// Effects Audio /////
	Adapt.on('audio:playEffectsAudio', function(audioClip) {
		// Stop current clip
        Adapt.trigger('audio:pauseEffectsAudio');
        // Update player to new clip vars
        Adapt.audio.musicClip.src = audioClip;
        Adapt.audio.musicClip.newID = id;
        // Play clip
        if(Adapt.audio.effectsAudio==1){
            Adapt.audio.effectsClip.play();
            Adapt.audio.effectsClip.isPlaying=true;
            $('#'+Adapt.audio.effectsClip.newID).removeClass('fa-volume-off');
            $('#'+Adapt.audio.effectsClip.newID).addClass('fa-volume-up');
	        $('#'+Adapt.audio.effectsClip.newID).addClass('playing');
        }
        // Update player ID to new clip
        Adapt.audio.effectsClip.playingID = Adapt.audio.effectsClip.newID;
	});

	Adapt.on('audio:pauseEffectsAudio', function() {
        Adapt.audio.effectsClip.pause();
        Adapt.trigger('audio:effectsEnded');
	});

	Adapt.on('audio:effectsEnded', function () {
		Adapt.audio.effectsClip.isPlaying=false;
		$('#'+Adapt.audio.effectsClip.playingID).removeClass('fa-volume-up');
        $('#'+Adapt.audio.effectsClip.playingID).addClass('fa-volume-off');
        $('#'+Adapt.audio.effectsClip.playingID).removeClass('playing');
	});
	////////////////////////
	//
	// Audio on/off events
	Adapt.on('audio:updateNarrationStatus', function (value) {
		Adapt.audio.narrationAudio = value;
		Adapt.trigger('audio:pauseNarrationAudio');
	});
	Adapt.on('audio:updateEffectsStatus', function (value) {
		Adapt.audio.effectsAudio = value;
		Adapt.trigger('audio:pauseEffectsAudio');
	});
	Adapt.on('audio:updateMusicStatus', function (value) {
		Adapt.audio.musicAudio = value;
		Adapt.trigger('audio:pauseMusicAudio');
	});

    Adapt.on('app:dataReady', function() {
    	// Get default audio status for each audio channel
    	// *** Will need to work on this if user's settings are going to be stored in SCORM ***
		Adapt.audio.narrationAudio = Adapt.config.get('_audio')._audioNarrationStatus;
		Adapt.audio.effectsAudio = Adapt.config.get('_audio')._audioEffectsStatus;
		Adapt.audio.musicAudio = Adapt.config.get('_audio')._audioMusicStatus;

    });

	// -----
    // Drawer item
    // -----
	function setupDrawerAudio(audioDrawerModel, audioItems) {

		var audioDrawerCollection = new Backbone.Collection(audioItems);
		var audioDrawerModel = new Backbone.Model(audioDrawerModel);

		Adapt.on('audio:showAudioDrawer', function() {

			Adapt.drawer.triggerCustomView(new AudioDrawerView({
				model: audioDrawerModel, 
				collection: audioDrawerCollection
			}).$el);
		});
	
	}
	Adapt.once('app:dataReady', function() {

		var drawerAudio = Adapt.course.get('_audio');

		if (drawerAudio) {
			var drawerObject = {
		        title: drawerAudio.title,
		        description: drawerAudio.description,
		        className: 'audio-drawer'
		    };
		    Adapt.drawer.addItem(drawerObject, 'audio:showAudioDrawer');
		} else {
			return console.log('Sorry, no audio object is set on the course.json file.');
		}
		setupDrawerAudio(drawerAudio, drawerAudio._audioItems);

	});
	// -----
    // Toggle button view
    // -----
    Adapt.on("pageView:postRender", function(view) {
    	if (Adapt.config.get("_audio")._isEnabled) {
	        new AudioToggleView({model:view.model});
	    }
    });
    // -----
    // Audio controls view
    // -----
    Adapt.on('articleView:postRender blockView:postRender componentView:postRender', function(view) {

        if (view.model.get("_audio")) {
          if ($('html').hasClass('accessibility')) {
                // Do nothing
            } else {
                new AudioControlsView({model:view.model});
            }
        }

    });

})