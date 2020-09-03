define([
    'core/js/adapt'
], function(Adapt) {

    var AudioPromptView = Backbone.View.extend({

        className: "audio-prompt__content",

        events: {
          'click .js-audio-fullTextAudioOn': 'setFullTextAudioOn',
          'click .js-audio-reducedTextAudioOn': 'setReducedTextAudioOn',
          'click .js-audio-fullTextAudioOff': 'setFullTextAudioOff',
          'click .js-audio-reducedTextAudioOff': 'setReducedTextAudioOff',
          'click .js-audio-selectContinueAudioOn': 'setContinueAudioOn',
          'click .js-audio-selectContinueAudioOff': 'setContinueAudioOff',
          'click .js-audio-selectOff': 'setAudioOff',
          'click .js-audio-selectOn': 'setAudioOn'
        },

        initialize: function() {
          this.render();
        },

        render: function() {
          var data = this.model.toJSON();
          var template = Handlebars.templates["audioPrompt"];
          this.$el.html(template(data));
        },

        setFullTextAudioOn: function(event) {
          Adapt.audio.audioStatus = 1;
          Adapt.trigger('audio:changeText', 0);
          this.closePopup();
        },

        setFullTextAudioOff: function(event) {
          Adapt.audio.audioStatus = 0;
          Adapt.trigger('audio:changeText', 0);
          this.closePopup();
        },

        setReducedTextAudioOn: function(event) {
          Adapt.audio.audioStatus = 1;
          Adapt.trigger('audio:changeText', 1);
          this.closePopup();
        },

        setReducedTextAudioOff: function(event) {
          Adapt.audio.audioStatus = 0;
          Adapt.trigger('audio:changeText', 1);
          this.closePopup();
        },

        setContinueAudioOn: function(event) {
          Adapt.audio.audioStatus = 1;
          Adapt.trigger('audio:changeText', 0);
          this.closePopup();
        },

        setContinueAudioOff: function(event) {
          Adapt.audio.audioStatus = 0;
          Adapt.trigger('audio:changeText', 0);
          this.closePopup();
        },

        setAudioOff: function(event) {
          Adapt.audio.audioStatus = 0;
          for (var i = 0; i < Adapt.audio.numChannels; i++) {
            Adapt.audio.audioClip[i].status = parseInt(Adapt.audio.audioStatus);
          }
          Adapt.trigger('audio:updateAudioStatus', 0, 0);
          Adapt.trigger('audio:changeText', 0);
          this.closePopup();
        },

        setAudioOn: function(event) {
          Adapt.audio.audioStatus = 1;
          for (var i = 0; i < Adapt.audio.numChannels; i++) {
            Adapt.audio.audioClip[i].status = parseInt(Adapt.audio.audioStatus);
          }
          Adapt.trigger('audio:updateAudioStatus', 0, 1);
          Adapt.trigger('audio:changeText', 0);
          this.closePopup();
        },

        closePopup: function () {
          Adapt.trigger('notify:close');
        }

    });

    return AudioPromptView;

});
