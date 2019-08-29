define([
    'core/js/adapt'
], function(Adapt) {

    var AudioNavigationView = Backbone.View.extend({

        className: 'audio-navigation',

        initialize: function() {
            this.listenTo(Adapt.config, 'change:_activeLanguage', this.remove);
            this.listenTo(Adapt, 'audio:updateAudioStatus', this.updateToggle);

            this.render();
        },

        events: {
            "click .audio-button":"toggleAudio"
        },

        render: function() {
            var data = this.model.toJSON();
            var template = Handlebars.templates["audioNavigation"];

            this.$el.html(template({
                audioToggle:data
            }));

            // Check for audio being on
            if(Adapt.audio.audioStatus == 1){
                this.$('.audio-button').addClass(Adapt.audio.iconOn);
            } else {
                this.$('.audio-button').addClass(Adapt.audio.iconOff);
            }

            if (!Adapt.course.get('_audio')._showOnNavbar) {
                this.$el.addClass('hidden');
            }

            return this;
        },

        updateToggle: function(){
            // Update based on overall audio status
            if(Adapt.audio.audioStatus == 1){
                this.$('.audio-button').removeClass(Adapt.audio.iconOff);
                this.$('.audio-button').addClass(Adapt.audio.iconOn);
            } else {
                this.$('.audio-button').removeClass(Adapt.audio.iconOn);
                this.$('.audio-button').addClass(Adapt.audio.iconOff);
            }
        },

        toggleAudio: function(event) {
            if (event) event.preventDefault();

            Adapt.trigger('audio:showAudioDrawer');
        }

    });

    return AudioNavigationView;

});
