define([
  'core/js/adapt'
], function (Adapt) {

  var AudioResultsView = Backbone.View.extend({

    className: 'audio',

    initialize: function () {
      this.listenTo(Adapt, {
        'remove': this.remove,
        'audio:updateAudioStatus': this.updateToggle
      });

      this.listenToOnce(Adapt, 'remove', this.removeInViewListeners);

      this.render();
    },

    render: function () {
      var data = this.model.toJSON();
      var template = Handlebars.templates['audioResults'];

      if (this.model.get('_audioAssessment')._location=='bottom-left' || this.model.get('_audioAssessment')._location=='bottom-right') {
        $(this.el).html(template(data)).appendTo('.' + this.model.get('_id') + ' > .'+this.model.get('_type')+'__inner');
      } else {
        $(this.el).html(template(data)).prependTo('.' + this.model.get('_id') + ' > .'+this.model.get('_type')+'__inner');
      }
      // Add class so it can be referenced in the theme if needed
      $(this.el).addClass(this.model.get('_type')+'-audio');

      // Set vars
      this.audioChannel = this.model.get('_audioAssessment')._channel;
      this.elementId = this.model.get('_id');
      this.audioIcon = Adapt.audio.iconPlay;

      // Add audio icon
      this.$('.audio__controls-icon').addClass(this.audioIcon);

      // Hide controls
      if (this.model.get('_audioAssessment')._showControls == false || Adapt.audio.audioClip[this.audioChannel].status == 0) {
        this.$('.audio__controls').addClass('hidden');
      }

      // Set clip ID
      Adapt.audio.audioClip[this.audioChannel].newID = this.elementId;

      // Set listener for when clip ends
      $(Adapt.audio.audioClip[this.audioChannel]).on('ended', this.onAudioEnded.bind(this));
    },

    onAudioEnded: function() {
      Adapt.trigger('audio:audioEnded', this.audioChannel);
    },

    updateToggle: function() {
      if (Adapt.audio.audioClip[this.audioChannel].status == 1 && this.model.get('_audioAssessment')._showControls) {
        this.$('.audio__controls').removeClass('hidden');
      } else {
        this.$('.audio__controls').addClass('hidden');
      }
    },

    removeInViewListeners: function () {
      Adapt.trigger('audio:pauseAudio', this.audioChannel);
    }

  });

  return AudioResultsView;

});
