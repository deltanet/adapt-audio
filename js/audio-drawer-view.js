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
            "click .drawer-audio-toggle":"toggleAudio"
        },

        render: function() {
            var collectionData = this.collection.toJSON();
            var modelData = this.model.toJSON();
            var template = Handlebars.templates["audioDrawer"];
            this.$el.html(template({model: modelData, audio:collectionData, _globals: Adapt.course.get('_globals')}));

            // Display appropriate icon
            for (var i = 0; i < Adapt.audio.numChannels; i++) {
                if(Adapt.audio.audioClip[i].status==1){
                    this.$('.item-'+i).addClass('fa-play');
                } else {
                    this.$('.item-'+i).addClass('fa-volume-off');
                }
            }

            _.defer(_.bind(this.postRender, this));
            return this;
        },

        postRender: function() {
            this.listenTo(Adapt, 'drawer:triggerCustomView', this.remove);
        },

        toggleAudio: function(event) {

            if (event) event.preventDefault();

            var currentItem = $(event.currentTarget).data('id');

            this.$('.item-'+currentItem).removeClass('fa-play');
            this.$('.item-'+currentItem).addClass('fa-volume-off');

            if(Adapt.audio.audioClip[currentItem].status == 0){
                this.$('.item-'+currentItem).removeClass('fa-volume-off');
                this.$('.item-'+currentItem).addClass('fa-play');
                Adapt.trigger('audio:updateAudioStatus', currentItem, 1);

            } else {
                this.$('.item-'+currentItem).removeClass('fa-play');
                this.$('.item-'+currentItem).addClass('fa-volume-off');
                Adapt.trigger('audio:updateAudioStatus', currentItem, 0);
            }

        }

    });

    return AudioDrawerView;
})
