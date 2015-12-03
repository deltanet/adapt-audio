define(function(require) {

    var Adapt = require('coreJS/adapt');
    var Backbone = require('backbone');

    var AudioToggleView = Backbone.View.extend({

        className: 'audioToggle',

        initialize: function() {
            this.listenTo(Adapt, 'remove', this.remove);
            this.listenTo(Adapt, 'audio:updateAudioStatus', this.updateToggle);
            this.render();
        },

        events: {
            "click .audio-nav-toggle":"toggleAudio"
        },

        render: function() {
            var data = this.model.toJSON();
            var template = Handlebars.templates["audioToggle"];
            this.$el.html(template(data)).appendTo('#wrapper'+'>.navigation'+'>.navigation-inner');

            // Check for any channel being on
            for (var i = 0; i < Adapt.audio.numChannels; i++) {
                if(Adapt.audio.audioClip[i].status==1){
                    this.$('.audio-nav-toggle').addClass('fa-volume-up');
                } else {
                    this.$('.audio-nav-toggle').addClass('fa-volume-off');
                }
            }
            return this;
        },

        updateToggle: function(){
            // Update based on overall audio status
            if(Adapt.audio.audioStatus == 1){
                this.$('.audio-nav-toggle').removeClass('fa-volume-off');
                this.$('.audio-nav-toggle').addClass('fa-volume-up');
            } else {
                this.$('.audio-nav-toggle').removeClass('fa-volume-up');
                this.$('.audio-nav-toggle').addClass('fa-volume-off');
            }
            /*
            // Check for any channel being on
            for (var i = 0; i < Adapt.audio.numChannels; i++) {
                if(Adapt.audio.audioClip[i].status==1){
                    this.$('.audio-nav-toggle').removeClass('fa-volume-off');
                    this.$('.audio-nav-toggle').addClass('fa-volume-up');
                } else {
                    this.$('.audio-nav-toggle').removeClass('fa-volume-up');
                    this.$('.audio-nav-toggle').addClass('fa-volume-off');
                }
            }
            */
        },

        toggleAudio: function(event) {
            if (event) event.preventDefault();
            // Check if skinnyText is enabled
            if(Adapt.config.get("_skinnyText") && Adapt.config.get("_skinnyText")._isEnabled){
                // Init notify confirm
                this.showPrompt();
            } else {
                // Pause all channels and set each channel to off
                if(Adapt.audio.audioStatus == 1){
                    for (var i = 0; i < Adapt.audio.numChannels; i++) {
                        Adapt.trigger('audio:pauseAudio', i);
                        Adapt.audio.audioClip[i].status = 0;
                    }
                    // Turn audio off
                    Adapt.audio.audioStatus = 0;
                } else {
                    for (var i = 0; i < Adapt.audio.numChannels; i++) {
                        Adapt.audio.audioClip[i].status = 1;
                    }
                    // Turn audio on
                    Adapt.audio.audioStatus = 1;
                }
            this.updateToggle();
            }

        },

        showPrompt: function() {
            var audioPromptModel = Adapt.course.get('_skinnyText');
            // Determine audio status
            if(Adapt.audio.audioStatus == 1){
                // Turn audio off and show alert with just a confirm button
                if (!audioPromptModel._buttons) {
                    audioPromptModel._buttons = {
                        confirm: "Confirm"
                    };
                }
                if (!audioPromptModel._buttons.confirm) audioPromptModel._buttons.confirm = "Confirm";
                // Set listener
                this.listenToOnce(Adapt, "audio:confirm", this.confirmText);

                var promptObject = {
                    title: audioPromptModel.title,
                    body: audioPromptModel.bodyAudioOn,
                    _prompts:[
                        {
                            promptText: audioPromptModel._buttons.confirm,
                            _callbackEvent: "audio:confirm",
                        }
                    ],
                    _showIcon: false
                }
                Adapt.trigger('notify:prompt', promptObject);
            } else {
                // Turn audio off and show alert with just a confirm button
                if (!audioPromptModel._buttons) {
                    audioPromptModel._buttons = {
                        full: "Full",
                        small: "Small"
                    };
                }
                if (!audioPromptModel._buttons.full) audioPromptModel._buttons.full = "Full";
                if (!audioPromptModel._buttons.small) audioPromptModel._buttons.small = "Small";
                // Set listeners
                this.listenToOnce(Adapt, "audio:fullText", this.setFullText);
                this.listenToOnce(Adapt, "audio:smallText", this.setSmallText);

                var promptObject = {
                    title: audioPromptModel.title,
                    body: audioPromptModel.bodyAudioOff,
                    _prompts:[
                        {
                            promptText: audioPromptModel._buttons.full,
                            _callbackEvent: "audio:fullText",
                        },
                        {
                            promptText: audioPromptModel._buttons.small,
                            _callbackEvent: "audio:smallText",
                        }
                    ],
                    _showIcon: false
                }
                Adapt.trigger('notify:prompt', promptObject);
            }
            
        },

        confirmText: function() {
            // Turn audio off and update toggle
            Adapt.audio.audioStatus = 0;
            this.updateToggle();
            // Set text to full
            if(Adapt.audio.textSize == 1){
                Adapt.trigger('audio:changeText', 0);
            }
            //
            this.stopListening(Adapt, "audio:confirm");
        },

        setFullText: function() {
            // Turn audio on and update toggle
            Adapt.audio.audioStatus = 1;
            this.updateToggle();
            // Set text to full
            Adapt.trigger('audio:changeText', 0);
            //
            this.stopListening(Adapt, "audio:fullText");
        },

        setSmallText: function() {
            // Turn audio on and update toggle
            Adapt.audio.audioStatus = 1;
            this.updateToggle();
            // Set text to small
            Adapt.trigger('audio:changeText', 1);
            //
            this.stopListening(Adapt, "audio:smallText");
        }

    });

    return AudioToggleView;

});