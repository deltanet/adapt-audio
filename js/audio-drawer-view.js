import Adapt from 'core/js/adapt';
import a11y from 'core/js/a11y';

export default class AudioDrawerView extends Backbone.View {

  className() {
    return 'audio-drawer';
  }

  events() {
    return {
      'click .js-item-narration': 'toggleNarration',
      'click .js-item-effects': 'toggleEffects',
      'click .js-item-music': 'toggleMusic',
      'click .js-full-button': 'setFullText',
      'click .js-reduced-button': 'setReducedText'
    };
  }

  initialize() {
    this.listenTo(Adapt, 'remove', this.remove);
    this.listenTo(Adapt.config, 'change:_activeLanguage', this.remove);
    this.render();
  }

  render() {
    const modelData = this.model.toJSON();
    const template = Handlebars.templates['audioDrawer'];
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

    _.defer(() => {
      this.postRender();
    });
  }

  postRender() {
    this.listenTo(Adapt, 'drawer:triggerCustomView', this.remove);
  }

  toggleNarration(event) {
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
  }

  toggleEffects(event) {
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
  }

  toggleMusic(event) {
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
  }

  toggleAll(status) {
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
  }

  checkTextSize() {
    if (Adapt.audio.textSize==0){
      this.$('.text-body').html(Adapt.course.get('_audio')._reducedText.descriptionFull);
      this.$('.js-full-button').hide();
      this.$('.js-reduced-button').show();
    } else {
      this.$('.text-body').html(Adapt.course.get('_audio')._reducedText.descriptionReduced);
      this.$('.js-reduced-button').hide();
      this.$('.js-full-button').show();
    }
  }

  checkNarration() {
    if (Adapt.audio.audioClip[0].status==1){
      this.$('.narration-body').html(Adapt.course.get('_audio')._channels._narration.descriptionOn);
      this.$('.js-item-narration').removeClass(Adapt.audio.iconOff);
      this.$('.js-item-narration').addClass(Adapt.audio.iconOn);
      this.$('.js-item-narration').attr('aria-label', a11y.normalize(Adapt.audio.stopAriaLabel));
    } else {
      this.$('.narration-body').html(Adapt.course.get('_audio')._channels._narration.descriptionOff);
      this.$('.js-item-narration').removeClass(Adapt.audio.iconOn);
      this.$('.js-item-narration').addClass(Adapt.audio.iconOff);
      this.$('.js-item-narration').attr('aria-label', a11y.normalize(Adapt.audio.playAriaLabel));
    }
  }

  checkEffects() {
    if (Adapt.audio.audioClip[1].status==1){
      this.$('.effects-body').html(Adapt.course.get('_audio')._channels._effects.descriptionOn);
      this.$('.js-item-effects').removeClass(Adapt.audio.iconOff);
      this.$('.js-item-effects').addClass(Adapt.audio.iconOn);
      this.$('.js-item-effects').attr('aria-label', a11y.normalize(Adapt.audio.stopAriaLabel));
    } else {
      this.$('.effects-body').html(Adapt.course.get('_audio')._channels._effects.descriptionOff);
      this.$('.js-item-effects').removeClass(Adapt.audio.iconOn);
      this.$('.js-item-effects').addClass(Adapt.audio.iconOff);
      this.$('.js-item-effects').attr('aria-label', a11y.normalize(Adapt.audio.playAriaLabel));
    }
  }

  checkMusic() {
    if (Adapt.audio.audioClip[2].status==1){
      this.$('.music-body').html(Adapt.course.get('_audio')._channels._music.descriptionOn);
      this.$('.js-item-music').removeClass(Adapt.audio.iconOff);
      this.$('.js-item-music').addClass(Adapt.audio.iconOn);
      this.$('.js-item-music').attr('aria-label', a11y.normalize(Adapt.audio.stopAriaLabel));
    } else {
      this.$('.music-body').html(Adapt.course.get('_audio')._channels._music.descriptionOff);
      this.$('.js-item-music').removeClass(Adapt.audio.iconOn);
      this.$('.js-item-music').addClass(Adapt.audio.iconOff);
      this.$('.js-item-music').attr('aria-label', a11y.normalize(Adapt.audio.playAriaLabel));
    }
  }

  setFullText(event) {
    if (event) event.preventDefault();
    // Set text to full
    Adapt.trigger('audio:changeText', 0);
    this.checkTextSize();
  }

  setReducedText(event) {
    if (event) event.preventDefault();
    // Set text to small
    Adapt.trigger('audio:changeText', 1);
    this.checkTextSize();
  }
}
