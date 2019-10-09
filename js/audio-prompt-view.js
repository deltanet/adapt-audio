define([
    'core/js/adapt'
], function(Adapt) {

    var AudioPromptView = Backbone.View.extend({

        className: "audio-prompt-content",

        events: {
          'click .audio-fullTextAudioOn': 'setFullTextAudioOn',
          'click .audio-reducedTextAudioOn': 'setReducedTextAudioOn',
          'click .audio-fullTextAudioOff': 'setFullTextAudioOff',
          'click .audio-reducedTextAudioOff': 'setReducedTextAudioOff',
          'click .audio-selectContinueAudioOn': 'setContinueAudioOn',
          'click .audio-selectContinueAudioOff': 'setContinueAudioOff',
          'click .audio-selectOff': 'setAudioOff',
          'click .audio-selectOn': 'setAudioOn'
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
