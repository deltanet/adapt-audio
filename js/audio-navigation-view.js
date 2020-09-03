define([
  'core/js/adapt'
], function (Adapt) {

  var AudioNavigationView = Backbone.View.extend({

    tagName: 'button',

    className: 'btn-icon nav__btn nav__audio-btn js-nav-audio-btn',

    events: {
      'click': 'toggleAudio'
    },

    initialize: function () {
      this.listenTo(Adapt.config, 'change:_activeLanguage', this.remove);
      this.listenTo(Adapt, 'audio:updateAudioStatus', this.updateToggle);

      this.render();
    },

    render: function () {
      var data = this.model.toJSON();
      var template = Handlebars.templates['audioNavigation'];

      this.$el.html(template({
        audioToggle:data
      }));

      // Check for audio being on
      if (Adapt.audio.audioStatus == 1){
        this.$('.audio__controls-icon').addClass(Adapt.audio.iconOn);
      } else {
        this.$('.audio__controls-icon').addClass(Adapt.audio.iconOff);
      }
    },

    updateToggle: function (){
      // Update based on overall audio status
      if (Adapt.audio.audioStatus == 1){
        this.$('.audio__controls-icon').removeClass(Adapt.audio.iconOff);
        this.$('.audio__controls-icon').addClass(Adapt.audio.iconOn);
      } else {
        this.$('.audio__controls-icon').removeClass(Adapt.audio.iconOn);
        this.$('.audio__controls-icon').addClass(Adapt.audio.iconOff);
      }
    },

    toggleAudio: function (event) {
      if (event) event.preventDefault();
      Adapt.trigger('audio:showAudioDrawer');
    }

  });

  return AudioNavigationView;

});
