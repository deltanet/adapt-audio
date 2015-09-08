/*
* adapt-audio
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Robert Peek <robert@delta-net.co.uk>
*/
define(function(require) {

    var Adapt = require('coreJS/adapt');
    var Backbone = require('backbone');

    var AudioToggleView = Backbone.View.extend({

        className: 'audioToggle',

        initialize: function() {
            this.listenTo(Adapt, 'remove', this.remove);
            this.listenTo(Adapt, 'audio:updateNarrationStatus', this.updateToggle);
            this.render();
        },

        events: {
            "click .audio-nav-toggle":"toggleAudio"
        },

        render: function() {
            var data = this.model.toJSON();
            var template = Handlebars.templates["audioToggle"];
            this.$el.html(template(data)).appendTo('#wrapper'+'>.navigation'+'>.navigation-inner');

            if(Adapt.audio.narrationAudio == 1){
                this.$('.audio-nav-toggle').addClass('fa-volume-up');
            } else {
                this.$('.audio-nav-toggle').addClass('fa-volume-off');
            }
            
            return this;
        },

        updateToggle: function(){
            if(Adapt.audio.narrationAudio == 1){
                this.$('.audio-nav-toggle').removeClass('fa-volume-off');
                this.$('.audio-nav-toggle').addClass('fa-volume-up');
            } else {
                this.$('.audio-nav-toggle').removeClass('fa-volume-up');
                this.$('.audio-nav-toggle').addClass('fa-volume-off');
            }
        },

        toggleAudio: function(event) {

            if (event) event.preventDefault();
            Adapt.trigger("audio:showAudioDrawer");

        }

    });

    return AudioToggleView;

});