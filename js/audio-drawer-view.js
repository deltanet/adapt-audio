define([
  'core/js/adapt'
], function (Adapt) {

  var AudioDrawerView = Backbone.View.extend({

    className: 'audio-drawer',

    events: {
      'change .js-item-narration': 'toggleNarration',
      'change .js-item-effects': 'toggleEffects',
      'change .js-item-music': 'toggleMusic',
      'click .js-full-button': 'setFullText',
      'click .js-reduced-button': 'setReducedText'
    },

    initialize: function () {
      this.listenTo(Adapt, 'remove', this.remove);
      this.listenTo(Adapt.config, 'change:_activeLanguage', this.remove);
      this.render();
    },

    render: function () {
      var modelData = this.model.toJSON();
      var template = Handlebars.templates['audioDrawer'];
      this.$el.html(template({model: modelData}));

      this.numChannels = 0;

      if (Adapt.course.get('_audio')._channels._narration._isEnabled) {
        this.checkNarration();
        this.numChannels ++;
      }

      if (Adapt.course.get('_audio')._channels._effects._isEnabled) {
        this.checkEffects();
        this.numChannels ++;
      }

      if (Adapt.course.get('_audio')._channels._music._isEnabled) {
        this.checkMusic();
        this.numChannels ++;
      }

      this.checkTextSize();

      _.defer(function () {
        this.postRender();
      }.bind(this));
    },

    postRender: function () {
      this.listenTo(Adapt, 'drawer:triggerCustomView', this.remove);
    },

    toggleNarration: function (event) {
      if (event) event.preventDefault();

      if (this.numChannels == 1) {
        this.toggleAll(Adapt.audio.audioClip[0].status);
      } else {
        if (Adapt.audio.audioClip[0].status == 0){
          Adapt.trigger('audio:updateAudioStatus', 0, 1);
        } else {
          Adapt.trigger('audio:updateAudioStatus', 0, 0);
        }
        this.checkNarration();
      }
    },

    toggleEffects: function (event) {
      if (event) event.preventDefault();

      if (this.numChannels == 1) {
        this.toggleAll(Adapt.audio.audioClip[1].status);
      } else {
        if (Adapt.audio.audioClip[1].status == 0){
          Adapt.trigger('audio:updateAudioStatus', 1, 1);
        } else {
          Adapt.trigger('audio:updateAudioStatus', 1, 0);
        }
        this.checkEffects();
      }
    },

    toggleMusic: function (event) {
      if (event) event.preventDefault();

      if (this.numChannels == 1) {
        this.toggleAll(Adapt.audio.audioClip[2].status);
      } else {
        if (Adapt.audio.audioClip[2].status == 0){
          Adapt.trigger('audio:updateAudioStatus', 2, 1);
        } else {
          Adapt.trigger('audio:updateAudioStatus', 2, 0);
        }
        this.checkMusic();
      }
    },

    toggleAll: function (status) {
      if (status == 0){
        Adapt.trigger('audio:updateAudioStatus', 0, 1);
        Adapt.trigger('audio:updateAudioStatus', 1, 1);
        Adapt.trigger('audio:updateAudioStatus', 2, 1);
      } else {
        Adapt.trigger('audio:updateAudioStatus', 0, 0);
        Adapt.trigger('audio:updateAudioStatus', 1, 0);
        Adapt.trigger('audio:updateAudioStatus', 2, 0);
      }
      this.checkNarration();
      this.checkEffects();
      this.checkMusic();
    },

    checkTextSize: function () {
      if (Adapt.audio.textSize==0){
        this.$('.text-body').html(Adapt.course.get('_audio')._reducedText.descriptionFull);
        this.$('.js-full-button').hide();
        this.$('.js-reduced-button').show();
      } else {
        this.$('.text-body').html(Adapt.course.get('_audio')._reducedText.descriptionReduced);
        this.$('.js-reduced-button').hide();
        this.$('.js-full-button').show();
      }
    },

    checkNarration: function () {
      if (Adapt.audio.audioClip[0].status==1){
        this.$('.narration-body').html(Adapt.course.get('_audio')._channels._narration.descriptionOn);
        this.$('.js-item-narration').find('input').attr('checked', true);
        this.$('.js-item-narration').attr('aria-label', $.a11y_normalize(Adapt.audio.stopAriaLabel));
      } else {
        this.$('.narration-body').html(Adapt.course.get('_audio')._channels._narration.descriptionOff);
        this.$('.js-item-narration').find('input').attr('checked', false);
        this.$('.js-item-narration').attr('aria-label', $.a11y_normalize(Adapt.audio.playAriaLabel));
      }
    },

    checkEffects: function () {
      if (Adapt.audio.audioClip[1].status==1){
        this.$('.effects-body').html(Adapt.course.get('_audio')._channels._effects.descriptionOn);
        this.$('.js-item-effects').find('input').attr('checked', true);
        this.$('.js-item-effects').attr('aria-label', $.a11y_normalize(Adapt.audio.stopAriaLabel));
      } else {
        this.$('.effects-body').html(Adapt.course.get('_audio')._channels._effects.descriptionOff);
        this.$('.js-item-effects').find('input').attr('checked', false);
        this.$('.js-item-effects').attr('aria-label', $.a11y_normalize(Adapt.audio.playAriaLabel));
      }
    },

    checkMusic: function () {
      if (Adapt.audio.audioClip[2].status==1){
        this.$('.music-body').html(Adapt.course.get('_audio')._channels._music.descriptionOn);
        this.$('.js-item-music').find('input').attr('checked', true);
        this.$('.js-item-music').attr('aria-label', $.a11y_normalize(Adapt.audio.stopAriaLabel));
      } else {
        this.$('.music-body').html(Adapt.course.get('_audio')._channels._music.descriptionOff);
        this.$('.js-item-music').find('input').attr('checked', false);
        this.$('.js-item-music').attr('aria-label', $.a11y_normalize(Adapt.audio.playAriaLabel));
      }
    },

    setFullText: function (event) {
      if (event) event.preventDefault();
      // Set text to full
      Adapt.trigger('audio:changeText', 0);
      this.checkTextSize();
    },

    setReducedText: function (event) {
      if (event) event.preventDefault();
      // Set text to small
      Adapt.trigger('audio:changeText', 1);
      this.checkTextSize();
    }

  });

  return AudioDrawerView;

});
