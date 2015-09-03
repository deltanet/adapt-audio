/*
* adapt-audio
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Robert Peek <robert@delta-net.co.uk>
*/
define(function(require) {

    var Backbone = require('backbone');
    var Adapt = require('coreJS/adapt');

    var AudioDrawerView = Backbone.View.extend({

        className: "audio-drawer",

        initialize: function() {

            this.listenTo(Adapt, 'remove', this.remove);
            this.render();
        },

        events: {
            'click .audio-filter a': 'onFilterClicked',
            "click .drawer-audio-toggle":"toggleAudio"
        },

        render: function() {
            var collectionData = this.collection.toJSON();
            var modelData = this.model.toJSON();
            var template = Handlebars.templates["audioDrawer"];
            this.$el.html(template({model: modelData, audio:collectionData, _globals: Adapt.course.get('_globals')}));

            // Narrator audio
            if(Adapt.audio.narrationAudio == 1){
                this.$('.item-0').addClass('fa-volume-up');
            } else {
                this.$('.item-0').addClass('fa-volume-off');
            }
            // Effects audio
            if(Adapt.audio.effectsAudio == 1){
                this.$('.item-1').addClass('fa-volume-up');
            } else {
                this.$('.item-1').addClass('fa-volume-off');
            }
            // Music audio
            if(Adapt.audio.musicAudio == 1){
                this.$('.item-2').addClass('fa-volume-up');
            } else {
                this.$('.item-2').addClass('fa-volume-off');
            }

            _.defer(_.bind(this.postRender, this));
            return this;
        },

        postRender: function() {
            this.listenTo(Adapt, 'drawer:triggerCustomView', this.remove);
        },

        onFilterClicked: function(event) {
            event.preventDefault();
            var $currentTarget = $(event.currentTarget);
            this.$('.audio-filter a').removeClass('selected');
            var filter = $currentTarget.addClass('selected').attr('data-filter');
            var items = [];

            if (filter === 'all') {
                items = this.$('.audio-item').removeClass('display-none');
            } else {
                this.$('.audio-item').removeClass('display-none').not("." + filter).addClass('display-none');
                items = this.$('.audio-item.' + filter);
            }

            if (items.length === 0) return;
            $(items[0]).a11y_focus();
        },

        toggleAudio: function(event) {

            if (event) event.preventDefault();

            var currentItem = $(event.currentTarget).data('id');

            this.$('.'+currentItem).removeClass('fa-volume-up');
            this.$('.'+currentItem).addClass('fa-volume-off');

            // Narrator audio
            if(currentItem=="item-0"){
                if(Adapt.audio.narrationAudio == 0){
                    this.$('.'+currentItem).removeClass('fa-volume-off');
                    this.$('.'+currentItem).addClass('fa-volume-up');
                    Adapt.trigger('audio:updateNarrationStatus', 1);

                } else {
                    this.$('.'+currentItem).removeClass('fa-volume-up');
                    this.$('.'+currentItem).addClass('fa-volume-off');
                    Adapt.trigger('audio:updateNarrationStatus', 0);
                }
            }

            // Effects audio
            if(currentItem=="item-1"){
                if(Adapt.audio.effectsAudio == 0){
                    this.$('.'+currentItem).removeClass('fa-volume-off');
                    this.$('.'+currentItem).addClass('fa-volume-up');
                    Adapt.trigger('audio:updateEffectsStatus', 1);

                } else {
                    this.$('.'+currentItem).removeClass('fa-volume-up');
                    this.$('.'+currentItem).addClass('fa-volume-off');
                    Adapt.trigger('audio:updateEffectsStatus', 0);
                }
            }

            // Music audio
            if(currentItem=="item-2"){
                if(Adapt.audio.musicAudio == 0){
                    this.$('.'+currentItem).removeClass('fa-volume-off');
                    this.$('.'+currentItem).addClass('fa-volume-up');
                    Adapt.trigger('audio:updateMusicStatus', 1);

                } else {
                    this.$('.'+currentItem).removeClass('fa-volume-up');
                    this.$('.'+currentItem).addClass('fa-volume-off');
                    Adapt.trigger('audio:updateMusicStatus', 0);
                }
            }

        }

    });

    return AudioDrawerView;
})
