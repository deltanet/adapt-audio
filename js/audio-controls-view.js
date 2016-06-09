define(function(require) {

    var Adapt = require('coreJS/adapt');
    var Backbone = require('backbone');

    var AudioControlsView = Backbone.View.extend({

        className: "audio-controls",

        initialize: function () {
            this.listenTo(Adapt, 'remove', this.remove);
            this.listenTo(Adapt, 'device:changed', this.reRender);
            this.listenTo(Adapt, 'questionView:showFeedback', this.initFeedback);
            this.listenTo(Adapt, 'notify:closed', this.stopFeedbackAudio);
            this.listenTo(Adapt, 'accessibility:toggle', this.onAccessibilityToggle);
            this.listenTo(Adapt, 'audio:updateAudioStatus', this.updateToggle);
            this.listenTo(Adapt, "audio:changeText", this.replaceText);
            this.listenToOnce(Adapt, "remove", this.removeInViewListeners);
            this.preRender();
            this.render();
        },

        events: {
            'click .audio-toggle': 'toggleAudio'
        },

        preRender: function() {
        },

        render: function () {
            var data = this.model.toJSON();
            var template = Handlebars.templates["audioControls"];
            if (this.model.get('_audio') && this.model.get('_audio')._isEnabled) {
                if(this.model.get('_audio')._location=="bottom-left" || this.model.get("_audio")._location=="bottom-right") {
                    $(this.el).html(template(data)).appendTo('.' + this.model.get('_id') + " > ."+this.model.get("_type")+"-inner");
                } else {
                    $(this.el).html(template(data)).prependTo('.' + this.model.get("_id") + " > ."+this.model.get("_type")+"-inner");
                }
            }
            // Add class so it can be referenced in the theme if needed
            $(this.el).addClass(this.model.get("_type")+"-audio");

            // Set vars
            this.audioChannel = this.model.get('_audio')._channel;
            this.elementId = this.model.get("_id");
            this.audioIcon = Adapt.course.get('_audio')._icons._audioOn;

            // Add audio icon
            this.$('.audio-toggle').addClass(this.audioIcon);

            // Hide controls if set in JSON or if audio is turned off
            if(this.model.get('_audio')._showControls==false || Adapt.audio.audioClip[this.audioChannel].status==0){
                this.$('.audio-inner button').hide();
            }
            
            // Set audio file
            this.setAudioFile();

            // Set clip ID
            Adapt.audio.audioClip[this.audioChannel].newID = this.elementId;

            // Set listener for when clip ends
            $(Adapt.audio.audioClip[this.audioChannel]).on('ended', _.bind(this.onAudioEnded, this));        

            _.defer(_.bind(function() {
                this.postRender();
            }, this));
        },

        postRender: function() {
            // Add inview listener on audio element
            this.$('.audio-inner').on('inview', _.bind(this.inview, this));
            // Run function to check for reduced text
            this.replaceText(Adapt.audio.textSize);
        },

        reRender: function() {
            this.setAudioFile();
        },

        setAudioFile: function() {
            // Set audio file based on the device size
            if (Adapt.device.screenSize === 'large') {
                try {
                    this.audioFile = this.model.get("_audio")._media.desktop;
                } catch(e) {
                    console.log('An error has occured loading audio');
                }
            } else {
                try {
                    this.audioFile = this.model.get("_audio")._media.mobile;
                } catch(e) {
                    console.log('An error has occured loading audio');
                }
            }
        },

        onAudioEnded: function() {
            Adapt.trigger('audio:audioEnded', this.audioChannel);
        },

        initFeedback: function() {
            // Run a check to trigger only the current clip's feedback
            if(this.elementId == Adapt.audio.audioClip[this.audioChannel].newID) {
                if(this.model.has('_feedback') && this.model.get('_feedback')._audio) {
                    this.initQuestionFeedbackAudio();
                }
            }
        },

        initQuestionFeedbackAudio: function() {
            // Correct
            if (this.model.get('_isCorrect')) {

                try {
                    this.audioFile = this.model.get('_feedback')._audio._correct._media.src;
                } catch(e) {
                    console.log('An error has occured loading audio');
                }

            // Partly correct
            } else if (this.model.get('_isAtLeastOneCorrectSelection')) {

                try {
                    this.audioFile = this.model.get('_feedback')._audio._partlyCorrect._final._media.src;
                } catch(e) {
                    console.log('An error has occured loading audio');
                }

            // Incorrect
            } else {

                try {
                    this.audioFile = this.model.get('_feedback')._audio._incorrect._final._media.src;
                } catch(e) {
                    console.log('An error has occured loading audio');
                }
            }
            if(Adapt.audio.audioClip[this.audioChannel].status==1){
                Adapt.trigger('audio:playAudio', this.audioFile, this.elementId, this.audioChannel);
            }
        },

        stopFeedbackAudio: function() {
            if(this.model.get('_feedback') && this.model.get('_feedback')._audio) {
                Adapt.trigger('audio:pauseAudio', this.audioChannel);
            }
        },

        stopPlayingAudio: function(event) {
            if (!Adapt.audio.audioClip[this.audioChannel].paused) {
                Adapt.trigger('audio:pauseAudio', this.audioChannel);
            }
        },

        inview: function(event, visible, visiblePartX, visiblePartY) {
            if (visible && Adapt.audio.autoPlayGlobal && this.model.get("_audio")._autoplay) {
                if (visiblePartY === 'top') {
                    this._isVisibleTop = true;
                } else if (visiblePartY === 'bottom') {
                    this._isVisibleBottom = true;
                } else {
                    this._isVisibleTop = true;
                    this._isVisibleBottom = true;
                }
                // Check if visible on screen
                if (this._isVisibleTop && this._isVisibleBottom) {
                    // Check if audio is set to on
                    if(Adapt.audio.audioClip[this.audioChannel].status==1){
                        this.setAudioFile();
                        Adapt.trigger('audio:playAudio', this.audioFile, this.elementId, this.audioChannel);
                    }
                }
            } else {
                Adapt.trigger('audio:inviewOff', this.elementId, this.audioChannel);
            }
        },

        toggleAudio: function(event) {
            if (event) event.preventDefault();
            this.setAudioFile();
            if ($(event.currentTarget).hasClass('playing')) {
                Adapt.trigger('audio:pauseAudio', this.audioChannel);
            } else {
                Adapt.trigger('audio:playAudio', this.audioFile, this.elementId, this.audioChannel);
            }
        },

        onAccessibilityToggle: function() {
            var hasAccessibility = Adapt.config.has('_accessibility') && Adapt.config.get('_accessibility')._isEnabled;

            if (!hasAccessibility) {
            } else {

                for (var i = 0; i < Adapt.audio.numChannels; i++) {
                    Adapt.trigger('audio:updateAudioStatus', this.audioChannel, 0);
                }
            }
        },

        updateToggle: function(){
            console.log(this.elementId +" = "+Adapt.audio.audioClip[this.audioChannel].status);
            if(Adapt.audio.audioClip[this.audioChannel].status == 1 && this.model.get('_audio')._showControls==true){
                this.$('.audio-inner button').show();
            } else {
                this.$('.audio-inner button').hide();
            }
        },

        removeInViewListeners: function () { 
            this.$('.audio-inner').off('inview');
            Adapt.trigger('audio:pauseAudio', this.audioChannel);
        },

        replaceText: function(value) {
            // If enabled
            if (Adapt.course.get("_audio") && Adapt.course.get("_audio")._reducedTextisEnabled && this.model.get('_audio') && this.model.get('_audio')._reducedTextisEnabled) {
                
                // Article
                if(this.model.get("_type") == "article"){
                    if(value == 0) {
                        $('.'+this.model.get('_id')).find('.article-title-inner').html(this.model.get('displayTitle')).a11y_text();
                        $('.'+this.model.get('_id')).find('.article-body-inner').html(this.model.get('body')).a11y_text();
                    } else {
                        $('.'+this.model.get('_id')).find('.article-title-inner').html(this.model.get('_audio').displayTitleReduced).a11y_text();
                        $('.'+this.model.get('_id')).find('.article-body-inner').html(this.model.get('_audio').bodyReduced).a11y_text();
                    }
                }

                // Block
                if(this.model.get("_type") == "block"){
                    if(value == 0) {
                        $('.'+this.model.get('_id')).find('.block-title-inner').html(this.model.get('displayTitle')).a11y_text();
                        $('.'+this.model.get('_id')).find('.block-body-inner').html(this.model.get('body')).a11y_text();
                    } else {
                        $('.'+this.model.get('_id')).find('.block-title-inner').html(this.model.get('_audio').displayTitleReduced).a11y_text();
                        $('.'+this.model.get('_id')).find('.block-body-inner').html(this.model.get('_audio').bodyReduced).a11y_text();
                    }
                }

                // Component
                if(this.model.get("_type") == "component"){
                    if(value == 0) {
                        $('.'+this.model.get('_id')).find('.component-title-inner').html(this.model.get('displayTitle')).a11y_text();
                        $('.'+this.model.get('_id')).find('.component-body-inner').html(this.model.get('body')).a11y_text();
                    } else {
                        $('.'+this.model.get('_id')).find('.component-title-inner').html(this.model.get('_audio').displayTitleReduced).a11y_text();
                        $('.'+this.model.get('_id')).find('.component-body-inner').html(this.model.get('_audio').bodyReduced).a11y_text();
                    }
                }
                
            }
        }

    });
    
    return AudioControlsView;

});