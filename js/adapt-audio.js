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
	Adapt.audio.audioChannel = new Array();
	Adapt.audio.audioClip = new Array();

    function setVars () {

    	Adapt.audio.numChannels = Adapt.course.get('_audio')._audioItems.length;

    	for (var i = 0; i < Adapt.audio.numChannels; i++) {
    		Adapt.audio.audioClip[i] = new Audio();
	    }

	    for (var i = 0; i < Adapt.audio.numChannels; i++) {
    		// *** Will need to work on this if user's settings are going to be stored in SCORM ***
    		/// SCORM ///
			// cmi.student_preference.audio
			// cmi.suspend_data
			/////////////
	    	Adapt.audio.audioClip[i].status = Adapt.course.get('_audio')._audioItems[i]._status;
	    	Adapt.audio.audioClip[i].isPlaying = false;
	    	Adapt.audio.audioClip[i].playingID = "";
	    	Adapt.audio.audioClip[i].newID = "";
	    }

    }

    Adapt.on('audio:playAudio', function (audioClip, id, channel) {
		// Stop current clip
        Adapt.trigger('audio:pauseAudio', channel);
        // Update player to new clip vars
        Adapt.audio.audioClip[channel].src = audioClip;
        Adapt.audio.audioClip[channel].newID = id;
        console.log("newID = "+Adapt.audio.audioClip[channel].newID);
        // Play clip
        if(Adapt.audio.audioClip[i].status==1){
        	setTimeout(function() {Adapt.audio.audioClip[channel].play();},1000);
            Adapt.audio.audioClip[channel].isPlaying = true;
            console.log("isPlaying = "+Adapt.audio.audioClip[channel].isPlaying);
            $('#'+Adapt.audio.audioClip[channel].newID).removeClass('fa-volume-off');
            $('#'+Adapt.audio.audioClip[channel].newID).addClass('fa-volume-up');
	        $('#'+Adapt.audio.audioClip[channel].newID).addClass('playing');
        }
        // Update player ID to new clip
        Adapt.audio.audioClip[channel].playingID = Adapt.audio.audioClip[channel].newID;
	});

	Adapt.on('audio:pauseAudio', function (channel) {
        Adapt.audio.audioClip[channel].pause();
        Adapt.trigger('audio:audioEnded', channel);
	});

	Adapt.on('audio:audioEnded', function (channel) {
		Adapt.audio.audioClip[channel].isPlaying = false;
		$('#'+Adapt.audio.audioClip[channel].playingID).removeClass('fa-volume-up');
        $('#'+Adapt.audio.audioClip[channel].playingID).addClass('fa-volume-off');
        $('#'+Adapt.audio.audioClip[channel].playingID).removeClass('playing');
	});

	// Audio on/off events
	Adapt.on('audio:updateAudioStatus', function (channel, value) {
		Adapt.audio.audioClip[channel].status = value;
		Adapt.trigger('audio:pauseAudio', channel);
	});

    Adapt.on('app:dataReady', function() {
		setVars();
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