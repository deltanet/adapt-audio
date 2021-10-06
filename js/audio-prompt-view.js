import Adapt from 'core/js/adapt';

export default class AudioPromptView extends Backbone.View {

  className() {
    return 'audio-prompt__content';
  }

  events() {
    return {
      'click .js-audio-fullTextAudioOn': 'setFullTextAudioOn',
      'click .js-audio-reducedTextAudioOn': 'setReducedTextAudioOn',
      'click .js-audio-fullTextAudioOff': 'setFullTextAudioOff',
      'click .js-audio-reducedTextAudioOff': 'setReducedTextAudioOff',
      'click .js-audio-selectContinueAudioOn': 'setContinueAudioOn',
      'click .js-audio-selectContinueAudioOff': 'setContinueAudioOff',
      'click .js-audio-selectOff': 'setAudioOff',
      'click .js-audio-selectOn': 'setAudioOn'
    };
  }

  initialize() {
    this.render();
  }

  render() {
    const data = this.model.toJSON();
    const template = Handlebars.templates["audioPrompt"];
    this.$el.html(template(data));
  }

  setFullTextAudioOn(event) {
    Adapt.audio.audioStatus = 1;
    Adapt.trigger('audio:changeText', 0);
    this.closePopup();
  }

  setFullTextAudioOff(event) {
    Adapt.audio.audioStatus = 0;
    Adapt.trigger('audio:changeText', 0);
    this.closePopup();
  }

  setReducedTextAudioOn(event) {
    Adapt.audio.audioStatus = 1;
    Adapt.trigger('audio:changeText', 1);
    this.closePopup();
  }

  setReducedTextAudioOff(event) {
    Adapt.audio.audioStatus = 0;
    Adapt.trigger('audio:changeText', 1);
    this.closePopup();
  }

  setContinueAudioOn(event) {
    Adapt.audio.audioStatus = 1;
    Adapt.trigger('audio:changeText', 0);
    this.closePopup();
  }

  setContinueAudioOff(event) {
    Adapt.audio.audioStatus = 0;
    Adapt.trigger('audio:changeText', 0);
    this.closePopup();
  }

  setAudioOff(event) {
    Adapt.audio.audioStatus = 0;

    for (let i = 0; i < Adapt.audio.numChannels; i++) {
      Adapt.audio.audioClip[i].status = parseInt(Adapt.audio.audioStatus);
    }

    Adapt.trigger('audio:updateAudioStatus', 0, 0);
    Adapt.trigger('audio:changeText', 0);
    this.closePopup();
  }

  setAudioOn(event) {
    Adapt.audio.audioStatus = 1;

    for (let i = 0; i < Adapt.audio.numChannels; i++) {
      Adapt.audio.audioClip[i].status = parseInt(Adapt.audio.audioStatus);
    }

    Adapt.trigger('audio:updateAudioStatus', 0, 1);
    Adapt.trigger('audio:changeText', 0);
    this.closePopup();
  }

  closePopup() {
    Adapt.trigger('notify:close');
  }
}
