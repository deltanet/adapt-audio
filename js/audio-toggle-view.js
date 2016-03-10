define(function(require) {

    var Adapt = require('coreJS/adapt');
    var Backbone = require('backbone');

    var AudioToggleView = Backbone.View.extend({

        className: 'audio-toggle',

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

            // Check for audio being on
            if(Adapt.audio.audioStatus == 1){
                this.$('.audio-nav-toggle').addClass('fa-volume-up');
            } else {
                this.$('.audio-nav-toggle').addClass('fa-volume-off');
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
        },

        toggleAudio: function(event) {
            if (event) event.preventDefault();
            // Check if reducedText is enabled
            if(Adapt.config.get("_reducedText") && Adapt.config.get("_reducedText")._isEnabled){
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
            var audioPromptModel = Adapt.course.get('_audio')._togglePrompt;
            // Determine audio status
            if(Adapt.audio.audioStatus == 1){
                // Turn audio off and show alert with just a confirm button

                // Set listener
                this.listenToOnce(Adapt, "audio:confirm", this.confirmText);
                this.listenToOnce(Adapt, "audio:cancel", this.cancelText);

                var promptObject = {
                    header: audioPromptModel._graphic.src,
                    title: audioPromptModel.title,
                    body: audioPromptModel.bodyAudioOn,
                    _prompts:[
                        {
                            promptText: audioPromptModel._buttons.confirm,
                            _callbackEvent: "audio:confirm"
                        },
                        {
                            promptText: audioPromptModel._buttons.cancel,
                            _callbackEvent: "audio:cancel"
                        }
                    ],
                    _showIcon: false
                }
            } else {
                // Turn audio off and show alert with just a confirm button

                // Set listeners
                this.listenToOnce(Adapt, "audio:fullText", this.setFullText);
                this.listenToOnce(Adapt, "audio:reducedText", this.setReducedText);
                this.listenToOnce(Adapt, "audio:cancelReducedText", this.closeNotify);

                var promptObject = {
                    header: audioPromptModel._graphic.src,
                    title: audioPromptModel.title,
                    body: audioPromptModel.bodyAudioOff,
                    _prompts:[
                        {
                            promptText: audioPromptModel._buttons.full,
                            _callbackEvent: "audio:fullText",
                        },
                        {
                            promptText: audioPromptModel._buttons.reduced,
                            _callbackEvent: "audio:reducedText",
                        },
                        {
                            promptText: audioPromptModel._buttons.cancel,
                            _callbackEvent: "audio:cancelReducedText",
                        }
                    ],
                    _showIcon: false
                }
            }

            Adapt.trigger('notify:prompt', promptObject);

            $('.notify-popup-body-inner').css('text-align','center');
            
        },

        confirmText: function() {
            // Turn audio off
            Adapt.audio.audioStatus = 0;
            // Turn all audio channels off
            for (var i = 0; i < Adapt.audio.numChannels; i++) {
                Adapt.audio.audioClip[i].status = 0;
            }
            // Update audio status
            Adapt.trigger('audio:updateAudioStatus', 0, 0);
            // Set text to full
            if(Adapt.audio.textSize == 1){
                Adapt.trigger('audio:changeText', 0);
            }
            //
            this.stopListening(Adapt, "audio:confirm");
        },

        cancelText: function() {
            this.stopListening(Adapt, "audio:cancel");
        },

        setFullText: function() {
            // Turn audio on
            Adapt.audio.audioStatus = 1;
            // Turn all audio channels on
            for (var i = 0; i < Adapt.audio.numChannels; i++) {
                Adapt.audio.audioClip[i].status = 1;
            }
            // Update audio status
            Adapt.trigger('audio:updateAudioStatus', 0, 1);
            // Set text to full
            Adapt.trigger('audio:changeText', 0);
            //
            this.stopListening(Adapt, "audio:fullText");
        },

        setReducedText: function() {
            // Turn audio on
            Adapt.audio.audioStatus = 1;
            // Turn all audio channels on
            for (var i = 0; i < Adapt.audio.numChannels; i++) {
                Adapt.audio.audioClip[i].status = 1;
            }
            // Update audio status
            Adapt.trigger('audio:updateAudioStatus', 0, 1);
            // Set text to small
            Adapt.trigger('audio:changeText', 1);
            //
            this.stopListening(Adapt, "audio:reducedText");
        },

        closeNotify: function() {
            Adapt.trigger('popup:closed');
        }

    });

    return AudioToggleView;

});