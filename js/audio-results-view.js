import Adapt from 'core/js/adapt';

export default class AudioResultsView extends Backbone.View {

  className() {
    return 'audio';
  }

  initialize() {
    this.listenTo(Adapt, {
      'remove': this.remove,
      'audio:updateAudioStatus device:resize': this.updateToggle
    });

    this.listenToOnce(Adapt, 'remove', this.removeInViewListeners);

    this.render();
  }

  render() {
    const data = this.model.toJSON();
    const template = Handlebars.templates['audioResults'];

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

    this.elementHeight = this.$('.audio__controls').outerHeight();

    // Hide controls
    if (this.model.get('_audioAssessment')._showControls == false || Adapt.audio.audioClip[this.audioChannel].status == 0) {
      this.$('.audio__controls').addClass('is-hidden');
    }

    // Set clip ID
    Adapt.audio.audioClip[this.audioChannel].newID = this.elementId;

    // Set listener for when clip ends
    $(Adapt.audio.audioClip[this.audioChannel]).on('ended', this.onAudioEnded.bind(this));

    _.defer(() => {
      this.postRender();
    });
  }

  postRender() {
    this.updateToggle();
  }

  onAudioEnded() {
    Adapt.trigger('audio:audioEnded', this.audioChannel);
  }

  updateToggle() {
    // Reset
    $('.'+this.elementId).find('.component__body-inner').css('max-width', "");
    $('.'+this.elementId).find('.component__title-inner').css('max-width', "");

    this.$('.audio__controls').css('padding', "");
    this.$('.audio__controls').css('height', "");
    this.$('.audio__controls').css('width', "");

    if (Adapt.audio.audioClip[this.audioChannel].status == 1 && this.model.get('_audioAssessment')._showControls) {
      this.$('.audio__controls').removeClass('is-hidden');

      const outerWidth = this.$('.js-audio-toggle').outerWidth();
      const elementWidth = $('.'+this.elementId).find('.component-header').outerWidth();
      const padding = outerWidth - this.$('.js-audio-toggle').width();
      const maxWidth = (elementWidth - outerWidth) - padding;
      const titleHeight = $('.'+this.elementId).find('.component__title').outerHeight();

      // Set width on elements title or body
      if (this.model.get('displayTitle') == "") {
        $('.'+this.elementId).find('.component__body-inner').css('max-width', maxWidth);
      } else {
        $('.'+this.elementId).find('.component__title-inner').css('max-width', maxWidth);

        if (titleHeight < this.elementHeight) {
          this.$('.audio__controls').css('padding', 0);
          this.$('.audio__controls').css('height', titleHeight);
          this.$('.audio__controls').css('width', titleHeight);
        }
      }
    } else {
      this.$('.audio__controls').addClass('is-hidden');
    }
  }

  removeInViewListeners() {
    Adapt.trigger('audio:pauseAudio', this.audioChannel);
  }
}
