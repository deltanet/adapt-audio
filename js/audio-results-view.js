define([
    'core/js/adapt'
], function(Adapt) {

    var AudioResultsView = Backbone.View.extend({

        className: "audio-controls",

        initialize: function () {
            this.listenTo(Adapt, {
                "remove": this.remove,
                "audio:updateAudioStatus device:resize": this.updateToggle
            });

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
            this.audioIcon = Adapt.audio.iconPlay;

            // Add audio icon
            this.$('.audio-toggle').addClass(this.audioIcon);

            // Hide controls
            if (this.model.get('_audioAssessment')._showControls == false || Adapt.audio.audioClip[this.audioChannel].status == 0) {
                this.$('.audio-inner button').hide();
            }

            // Set clip ID
            Adapt.audio.audioClip[this.audioChannel].newID = this.elementId;

            // Set listener for when clip ends
            $(Adapt.audio.audioClip[this.audioChannel]).on('ended', _.bind(this.onAudioEnded, this));

            _.defer(_.bind(function() {
                this.postRender();
            }, this));
        },

        postRender: function() {
            this.updateToggle();
        },

        onAudioEnded: function() {
            Adapt.trigger('audio:audioEnded', this.audioChannel);
        },

        updateToggle: function() {
            if (Adapt.audio.audioClip[this.audioChannel].status == 1 && this.model.get('_audioAssessment')._showControls == true) {
                this.$('.audio-inner button').show();

                var outerWidth = this.$('.audio-toggle').outerWidth();
                var elementWidth = $('.'+this.elementId).find('.component-header').outerWidth();
                var padding = outerWidth - this.$('.audio-toggle').width();
                var maxWidth = (elementWidth - outerWidth) - padding;

                // Set width on elements title or body
                if (this.model.get('displayTitle') == "") {
                  $('.'+this.elementId).find('.component-body-inner').css("max-width", maxWidth);
                } else {
                  $('.'+this.elementId).find('.component-title-inner').css("max-width", maxWidth);
                }

            } else {
                this.$('.audio-inner button').hide();
                // Reset
                $('.'+this.elementId).find('.component-body-inner').css("max-width", "");
                $('.'+this.elementId).find('.component-title-inner').css("max-width", "");
            }
        },

        removeInViewListeners: function () {
            Adapt.trigger('audio:pauseAudio', this.audioChannel);
        }

    });

    return AudioResultsView;

});
