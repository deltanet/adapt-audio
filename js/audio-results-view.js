define(function(require) {

    var Adapt = require('coreJS/adapt');
    var Backbone = require('backbone');

    var AudioResultsView = Backbone.View.extend({

        className: "audio-controls",

        initialize: function () {
            this.listenTo(Adapt, 'remove', this.remove);
            this.listenTo(Adapt, 'accessibility:toggle', this.onAccessibilityToggle);
            this.listenToOnce(Adapt, "remove", this.removeInViewListeners);
            this.render();
        },

        render: function () {
            var data = this.model.toJSON();
            var template = Handlebars.templates["audioResults"];
            if(this.model.get('_audioAssessment')._location=="bottom-left" || this.model.get("_audioAssessment")._location=="bottom-right") {
                $(this.el).html(template(data)).appendTo('.' + this.model.get('_id') + " > ."+this.model.get("_type")+"-inner");
            } else {
                $(this.el).html(template(data)).prependTo('.' + this.model.get("_id") + " > ."+this.model.get("_type")+"-inner");
            }
            // Add class so it can be referenced in the theme if needed
            $(this.el).addClass(this.model.get("_type")+"-audio");

            // Set vars
            this.audioChannel = this.model.get('_audioAssessment')._channel;
            this.elementId = this.model.get("_id");

            // Hide controls
            if(this.model.get('_audioAssessment')._showControls==false){
                this.$('.audio-toggle').addClass('hidden');
            }

            // Set clip ID
            Adapt.audio.audioClip[this.audioChannel].newID = this.elementId;
            // Set listener for when clip ends
            $(Adapt.audio.audioClip[this.audioChannel]).on('ended', _.bind(this.onAudioEnded, this));

        },

        onAudioEnded: function() {
            Adapt.trigger('audio:audioEnded', this.audioChannel);
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

        removeInViewListeners: function () {
            Adapt.trigger('audio:pauseAudio', this.audioChannel);
        }

    });

    return AudioResultsView;

});
