define([
    'core/js/adapt'
], function(Adapt) {

    var AudioDrawerView = Backbone.View.extend({

        className: "audio-drawer",

        initialize: function() {
            this.listenTo(Adapt, 'remove', this.remove);
            this.listenTo(Adapt.config, 'change:_activeLanguage', this.remove);
            this.render();
        },

        events: {
            "click .item-narration":"toggleNarration",
            "click .item-effects":"toggleEffects",
            "click .item-music":"toggleMusic",
            "click .full-button":"setFullText",
            "click .reduced-button":"setReducedText"
        },

        render: function() {
            var modelData = this.model.toJSON();
            var template = Handlebars.templates["audioDrawer"];
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

            _.defer(_.bind(this.postRender, this));
            return this;
        },

        postRender: function() {
            this.listenTo(Adapt, 'drawer:triggerCustomView', this.remove);
        },

        toggleNarration: function(event) {
            if (event) event.preventDefault();

            if (this.numChannels == 1) {
              this.toggleAll(Adapt.audio.audioClip[0].status);
            } else {
              if(Adapt.audio.audioClip[0].status == 0){
                  Adapt.trigger('audio:updateAudioStatus', 0, 1);
              } else {
                  Adapt.trigger('audio:updateAudioStatus', 0, 0);
              }
              this.checkNarration();
            }
        },

        toggleEffects: function(event) {
            if (event) event.preventDefault();

            if (this.numChannels == 1) {
              this.toggleAll(Adapt.audio.audioClip[1].status);
            } else {
              if(Adapt.audio.audioClip[1].status == 0){
                  Adapt.trigger('audio:updateAudioStatus', 1, 1);
              } else {
                  Adapt.trigger('audio:updateAudioStatus', 1, 0);
              }
              this.checkEffects();
            }
        },

        toggleMusic: function(event) {
            if (event) event.preventDefault();

            if (this.numChannels == 1) {
              this.toggleAll(Adapt.audio.audioClip[2].status);
            } else {
              if(Adapt.audio.audioClip[2].status == 0){
                  Adapt.trigger('audio:updateAudioStatus', 2, 1);
              } else {
                  Adapt.trigger('audio:updateAudioStatus', 2, 0);
              }
              this.checkMusic();
            }
        },

        toggleAll: function(status) {
            if(status == 0){
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

        checkTextSize: function() {
            if(Adapt.audio.textSize==0){
                this.$('.text-description').html(Adapt.course.get('_audio')._reducedText.descriptionFull);
                this.$('.full-button').hide();
                this.$('.reduced-button').show();
            } else {
                this.$('.text-description').html(Adapt.course.get('_audio')._reducedText.descriptionReduced);
                this.$('.reduced-button').hide();
                this.$('.full-button').show();
            }
        },

        checkNarration: function() {
            if(Adapt.audio.audioClip[0].status==1){
                this.$('.narration-description').html(Adapt.course.get('_audio')._channels._narration.descriptionOn);
                this.$('.item-narration').removeClass(Adapt.audio.iconOff);
                this.$('.item-narration').addClass(Adapt.audio.iconOn);
                this.$('.item-narration').attr('aria-label', $.a11y_normalize(Adapt.audio.stopAriaLabel));
            } else {
                this.$('.narration-description').html(Adapt.course.get('_audio')._channels._narration.descriptionOff);
                this.$('.item-narration').removeClass(Adapt.audio.iconOn);
                this.$('.item-narration').addClass(Adapt.audio.iconOff);
                this.$('.item-narration').attr('aria-label', $.a11y_normalize(Adapt.audio.playAriaLabel));
            }
        },

        checkEffects: function() {
            if(Adapt.audio.audioClip[1].status==1){
                this.$('.effects-description').html(Adapt.course.get('_audio')._channels._effects.descriptionOn);
                this.$('.item-effects').removeClass(Adapt.audio.iconOff);
                this.$('.item-effects').addClass(Adapt.audio.iconOn);
                this.$('.item-effects').attr('aria-label', $.a11y_normalize(Adapt.audio.stopAriaLabel));
            } else {
                this.$('.effects-description').html(Adapt.course.get('_audio')._channels._effects.descriptionOff);
                this.$('.item-effects').removeClass(Adapt.audio.iconOn);
                this.$('.item-effects').addClass(Adapt.audio.iconOff);
                this.$('.item-effects').attr('aria-label', $.a11y_normalize(Adapt.audio.playAriaLabel));
            }
        },

        checkMusic: function() {
            if(Adapt.audio.audioClip[2].status==1){
                this.$('.music-description').html(Adapt.course.get('_audio')._channels._music.descriptionOn);
                this.$('.item-music').removeClass(Adapt.audio.iconOff);
                this.$('.item-music').addClass(Adapt.audio.iconOn);
                this.$('.item-music').attr('aria-label', $.a11y_normalize(Adapt.audio.stopAriaLabel));
            } else {
                this.$('.music-description').html(Adapt.course.get('_audio')._channels._music.descriptionOff);
                this.$('.item-music').removeClass(Adapt.audio.iconOn);
                this.$('.item-music').addClass(Adapt.audio.iconOff);
                this.$('.item-music').attr('aria-label', $.a11y_normalize(Adapt.audio.playAriaLabel));
            }
        },

        setFullText: function(event) {
            if (event) event.preventDefault();
            // Set text to full
            Adapt.trigger('audio:changeText', 0);
            this.checkTextSize();
        },

        setReducedText: function(event) {
            if (event) event.preventDefault();
            // Set text to small
            Adapt.trigger('audio:changeText', 1);
            this.checkTextSize();
        }
    });

    return AudioDrawerView;

});
