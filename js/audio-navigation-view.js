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
      this.listenTo(Adapt, 'device:changed', this.onDeviceChanged);

      this.render();
    },

    render: function () {
      var data = this.model.toJSON();
      var template = Handlebars.templates['audioNavigation'];

      this.$el.html(template({
        audioToggle:data
      }));

      this.updateToggle();
      this.onDeviceChanged();
    },

    updateToggle: function (){
      // Update based on overall audio status
      if (Adapt.audio.audioStatus == 1){
        this.$('.audio__controls-icon').removeClass(Adapt.audio.iconOff);
        this.$('.audio__controls-icon').addClass(Adapt.audio.iconOn);
        this.$el.attr('aria-label', $.a11y_normalize(Adapt.course.get('_globals')._extensions._audio.statusOnAriaLabel + ' ' + Adapt.course.get('_globals')._extensions._audio.navigationAriaLabel));
      } else {
        this.$('.audio__controls-icon').removeClass(Adapt.audio.iconOn);
        this.$('.audio__controls-icon').addClass(Adapt.audio.iconOff);
        this.$el.attr('aria-label', $.a11y_normalize(Adapt.course.get('_globals')._extensions._audio.statusOffAriaLabel + ' ' + Adapt.course.get('_globals')._extensions._audio.navigationAriaLabel));
      }
    },

    toggleAudio: function (event) {
      if (event) event.preventDefault();
      Adapt.trigger('audio:showAudioDrawer');
    },

    onDeviceChanged: function() {
      if (Adapt.device.screenSize === 'small') {
        this.$el.addClass('u-display-none');
      } else {
        this.$el.removeClass('u-display-none');
      }
    }

  });

  return AudioNavigationView;

});
