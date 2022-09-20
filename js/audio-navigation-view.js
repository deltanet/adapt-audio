import Adapt from 'core/js/adapt';
import a11y from 'core/js/a11y';
import device from 'core/js/device';

export default class AudioNavigationView extends Backbone.View {

  tagName() {
    return 'button';
  }

  className() {
    return 'btn-icon nav__btn nav__audio-btn js-nav-audio-btn';
  }

  attributes() {
    return {
      'aria-label': Adapt.course.get('_globals')._extensions._audio.statusOnAriaLabel + ' ' + Adapt.course.get('_globals')._extensions._audio.navigationAriaLabel
    }
  }

  events() {
    return {
      'click': 'toggleAudio'
    };
  }

  initialize() {
    this.listenTo(Adapt.config, 'change:_activeLanguage', this.remove);
    this.listenTo(Adapt, 'audio:updateAudioStatus', this.updateToggle);
    this.listenTo(Adapt, 'device:changed', this.onDeviceChanged);

    this.render();
  }

  render() {
    const data = this.model.toJSON();
    const template = Handlebars.templates['audioNavigation'];

    this.$el.html(template({
      audioToggle:data
    }));

    this.updateToggle();
    this.onDeviceChanged();
  }

  updateToggle() {
    // Update based on overall audio status
    if (Adapt.audio.audioStatus == 1){
      this.$('.audio__controls-icon').removeClass(Adapt.audio.iconOff);
      this.$('.audio__controls-icon').addClass(Adapt.audio.iconOn);
      this.$el.attr('aria-label', a11y.normalize(Adapt.course.get('_globals')._extensions._audio.statusOnAriaLabel + ' ' + Adapt.course.get('_globals')._extensions._audio.navigationAriaLabel));
    } else {
      this.$('.audio__controls-icon').removeClass(Adapt.audio.iconOn);
      this.$('.audio__controls-icon').addClass(Adapt.audio.iconOff);
      this.$el.attr('aria-label', a11y.normalize(Adapt.course.get('_globals')._extensions._audio.statusOffAriaLabel + ' ' + Adapt.course.get('_globals')._extensions._audio.navigationAriaLabel));
    }
  }

  toggleAudio(event) {
    if (event) event.preventDefault();
    Adapt.trigger('audio:showAudioDrawer');
  }

  onDeviceChanged() {
    if (device.screenSize === 'small') {
      this.$el.addClass('u-display-none');
    } else {
      this.$el.removeClass('u-display-none');
    }
  }
}
