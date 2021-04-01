# adapt-audio

**Audio** is an *extension* for the [Adapt framework](https://github.com/adaptlearning/adapt_framework).   

This extension allows audio to be added within menus, pages, page structure and components.

##Installation

This extension must be manually installed.

If **Audio** has been uninstalled from the Adapt authoring tool, it may be reinstalled using the [Plug-in Manager](https://github.com/adaptlearning/adapt_authoring/wiki/Plugin-Manager).  

## Settings Overview

**Audio** can be configured on course (*course.json*), page (*contentObjects.json*), article (*articles.json*), block (*blocks.json*) and component (*components.json*).

The attributes listed below are properly formatted as JSON in [*example.json*](https://github.com/deltanet/adapt-audio/blob/master/example.json).

### Attributes

**Course**
The **_audio** attribute at course level contains values for **_isEnabled**, **_reducedTextisEnabled**, **_autoplay**, **_autoPlayOnce**, **_showOnNavbar**, **_pauseStopAction**, **_triggerPosition**, **title**, **description**, **_drawerOrder**, **_channels**, **_reducedText**, **_icons**, and **_prompt**.

>**_isEnabled** (boolean):  Turns on and off the **Audio** extension. Can be set to disable **Audio** when not required.  

>**_reducedTextisEnabled** (boolean):  Turns on and off the Reduced Text functionality.  

>**_autoplay** (boolean):  Defines whether the audio will auto play when on screen.  

>**_autoPlayOnce** (boolean):  Defines whether the audio will auto play when only occur once. If set to `false` the audio will play when the element is on screen again.  

>**_showOnNavbar** (boolean):  Defines whether an audio button will be added to the navigation bar. This button will trigger the drawer functionality.  

>**_pauseStopAction** (string):  Defines how the audio is stopped when the toggle button is clicked. Options are `stop` and `pause`.  

>**_triggerPosition** (number):  Defines the percentage from the top of the screen for when the audio will play when the element is in view.   

>**title** (string):  Defines the title text for the core Drawer item.  

>**description** (string):  Defines the description text for the core Drawer item.  

>**_drawerOrder** (number): Determines the order in which this extension appears as a drawer item. Acceptable values are numbers.  

>**_channels** (object): This `_channels` attributes group stores the properties for the audio objects. There are 3 altogether which will allow multiple audio clips to be played at the same time. It contains values for **_narration**, **_effects**, and **_music**.  

>>**_narration** (object): This `_narration` attributes group stores the properties for narration channel. It contains values for **_isEnabled**, **_status**, **title**, **descriptionOn**, and **descriptionOff**.  

>>>**_isEnabled** (boolean):  Turns on and off the **_narration** channel.  

>>>**_status** (number):  Defines the initial status of the channel. Options are `1` (on) and `0` (muted).  

>>>**title** (string):  Defines the title text for the core Drawer item.  

>>>**descriptionOn** (string):  Defines the description text for the core Drawer item when the channel is on.  

>>>**descriptionOff** (string):  Defines the description text for the core Drawer item when the channel is muted.  

>>**_effects** (object): This `_effects` attributes group stores the properties for sound effects. It contains values for **_isEnabled**, **_status**, **title**, **descriptionOn**, and **descriptionOff**.  

>>>**_isEnabled** (boolean):  Turns on and off the **_effects** channel.  

>>>**_status** (number):  Defines the initial status of the channel. Options are `1` (on) and `0` (muted).  

>>>**title** (string):  Defines the title text for the core Drawer item.  

>>>**descriptionOn** (string):  Defines the description text for the core Drawer item when the channel is on.  

>>>**descriptionOff** (string):  Defines the description text for the core Drawer item when the channel is muted.  

>>**_music** (object): This `_music` attributes group stores the properties for music. It contains values for **_isEnabled**, **_status**, **title**, **descriptionOn**, and **descriptionOff**.  

>>>**_isEnabled** (boolean):  Turns on and off the **_music** channel.  

>>>**_status** (number):  Defines the initial status of the channel. Options are `1` (on) and `0` (muted).  

>>>**title** (string):  Defines the title text for the core Drawer item.  

>>>**descriptionOn** (string):  Defines the description text for the core Drawer item when the channel is on.  

>>>**descriptionOff** (string):  Defines the description text for the core Drawer item when the channel is muted.  

>**_reducedText** (object): This `_reducedText` attributes group stores the properties for the drawer reduced text. It contains values for **title**, **descriptionFull**, **descriptionReduced**, and **_buttons**.  

>>**title** (string):  Defines the title text for the core Drawer item.  

>>**descriptionFull** (string):  Defines the description text for the core Drawer item when the reduced text is off.  

>>**descriptionReduced** (string):  Defines the description text for the core Drawer item when the reduced text is on.  

>>**_buttons** (object): This `_buttons` attributes group stores the properties for reduced text drawer buttons. It contains values for **full**, and **reduced**.  

>>>**full** (string):  This becomes the text for the button that sets the reduced text off.  

>>>**reduced** (string):  This becomes the text for the button that sets the reduced text on.  

>**_icons** (object): This `_icons` attributes group stores the properties for css icons used for the audio controls. It contains values for **_audioOn**, **_audioOff**, **_audioPlay**, and **_audioPause**.  

>>**_audioOn** (string):  Class name for the icon(s) used on the button when the audio is on. The class should be defined in the theme. Default is `icon-audio-on audio-volume-medium`.  

>>**_audioOff** (string):  Class name for the icon(s) used on the button when the audio is off. The class should be defined in the theme. Default is `icon-audio-off audio-volume-mute`.  

>>**_audioPlay** (string):  Class name for the icon(s) used on the button to play the audio. The class should be defined in the theme. Default is `icon-audio-play audio-play`.  

>>**_audioPause** (string):  Class name for the icon(s) used on the button to pause the audio. The class should be defined in the theme. Default is `icon-audio-pause audio-stop`.  

>**_prompt** (object): This `_prompt` attributes group stores the properties for a prompt when the course loads. It contains values for **_isEnabled**, **title**, **titleNoReduced**, **bodyAudioOn**, **bodyAudioOff**, **bodyNoReducedAudioOn**, **bodyNoReducedAudioOff**, **_buttons**, and **_graphic**.  

>>**_isEnabled** (boolean):  Turns on and off the prompt.  

>>**title** (string):  This becomes the prompt title if reduced text is enabled.  

>>**titleNoReduced** (string):  This becomes the prompt title if reduced text is turned off.  

>>**bodyAudioOn** (string):  This becomes the prompt body text if reduced text is turned on and the audio is on.  

>>**bodyAudioOff** (string):  This becomes the prompt body text if reduced text is turned on and the audio is turned off.  

>>**bodyNoReducedAudioOn** (string):  This becomes the prompt body text if reduced text is turned off and the audio is on.  

>>**bodyNoReducedAudioOff** (string):  This becomes the prompt body text if reduced text is turned off and the audio is turned off.  

>>**_buttons** (object): This `_buttons` attributes group stores the properties for the prompt buttons. It contains values for **full**, **reduced**, **continue**, **turnOff**, and **turnOn**.  

>>>**full** (string):  This becomes the text for the button that sets the reduced text off.  

>>>**reduced** (string):  This becomes the text for the button that sets the reduced text on.  

>>>**continue** (string):  This becomes the text for the continue button.  

>>>**turnOff** (string):  This becomes the text for the turn audio off button.  

>>>**turnOn** (string):  This becomes the text for the turn audio on button.  

>>**_graphic** (object): This `_graphic` attributes group stores the properties for the prompt graphic. It contains values for **src**.  

>>>**src** (string): File name (including path) of the image. Path should be relative to the *src* folder.  

<div float align=right><a href="#top">Back to Top</a></div>

**Article, Block and Component**
The **_audio** attribute at Article, Block and Component level contains values for **_isEnabled**, **_showControls**, **_autoplay**, **_autoPlayOnce**, **_channel**, **_location**, **_media**, **_reducedTextisEnabled**, **displayTitleReduced**, **bodyReduced**, and **_feedback**.

>**_isEnabled** (boolean):  Turns on and off the **Audio** extension. Can be set to disable **Audio** when not required.  

>**_showControls** (boolean):  Defines whether the audio control button will be displayed on screen.  

>**_autoplay** (boolean):  Defines whether the audio will auto play when on screen.  

>**_autoPlayOnce** (boolean):  Defines whether the audio will auto play when only occur once. If set to `false` the audio will play when the element is on screen again.  

>**_channel** (number):  Defines the channel number. Options are `0`, `1` and `2`.  

>**_location** (string):  Defines the location of the audio button within the element. Options are `top-left`, `top-right`, `bottom-left` and `bottom-right`.  

>**_media** (object): This `_media` attributes group stores the properties for the audio clips. It contains values for **desktop**, and **mobile**.  

>>**desktop** (string): File name (including path) of the mp3 when the screen size is larger than mobile. Path should be relative to the *src* folder.  

>>**mobile** (string): File name (including path) of the mp3 when the screen size is mobile. Path should be relative to the *src* folder.  

>**_reducedTextisEnabled** (boolean):  Turns on and off the Reduced Text functionality.  

>**displayTitleReduced** (string): This text becomes the element's display title if Reduced Text is enabled.  

>**bodyReduced** (string): This text becomes the element's body text if Reduced Text is enabled.  

>**_feedback** (object): This `_feedback` attributes group stores the properties for question components. It contains values for **_isEnabled**, **_correct**, **_incorrect**, **_partlyCorrect**, **_soundEffect**, and **_items**.  

>>**_isEnabled** (boolean):  Turns on and off the **Audio** functionality on question component feedback.  

>>**_correct** (object): This `_correct` attributes group stores the properties for the question's correct feedback. It contains values for **correctReduced**, and **_correct**.  

>>>**correctReduced** (string): This text becomes the feedback body when the question is correct and Reduced Text is enabled.  

>>>**_correct** (string): File name (including path) of the mp3 when the question is correct. Path should be relative to the *src* folder.  

>>**_incorrect** (object): This `_incorrect` attributes group stores the properties for the question's incorrect feedback. It contains values for **notFinalReduced**, **finalReduced**, **_notFinal**, and **_final**.  

>>>**notFinalReduced** (string): This text becomes the feedback body when the question is incorrect and their are attempts remaining, and Reduced Text is enabled.  

>>>**finalReduced** (string): This text becomes the feedback body when the question is incorrect with no attempts remaining, and Reduced Text is enabled.  

>>>**_notFinal** (string): File name (including path) of the mp3 when the question is incorrect and their are attempts remaining. Path should be relative to the *src* folder.  

>>>**_final** (string): File name (including path) of the mp3 when the question is incorrect with no attempts remaining. Path should be relative to the *src* folder.  

>>**_partlyCorrect** (object): This `_partlyCorrect` attributes group stores the properties for the question's partly correct feedback. It contains values for **notFinalReduced**, **finalReduced**, **_notFinal**, and **_final**.  

>>>**notFinalReduced** (string): This text becomes the feedback body when the question is partly correct and their are attempts remaining, and Reduced Text is enabled.  

>>>**finalReduced** (string): This text becomes the feedback body when the question is partly correct with no attempts remaining, and Reduced Text is enabled.  

>>>**_notFinal** (string): File name (including path) of the mp3 when the question is partly correct and their are attempts remaining. Path should be relative to the *src* folder.  

>>>**_final** (string): File name (including path) of the mp3 when the question is partly correct with no attempts remaining. Path should be relative to the *src* folder.  

>>**_soundEffect** (object): This `_soundEffect` attributes group stores the properties for sound effects played when the question feedback is shown. It contains values for **_isEnabled**, **_correct**, **_incorrect**, and **_partlyCorrect**.  

>>>**_isEnabled** (boolean):  Turns on and off the Sound Effect functionality on question component feedback.  

>>>**_correct** (string): File name (including path) of the mp3 when the question is correct. Path should be relative to the *src* folder.  

>>>**_incorrect** (string): File name (including path) of the mp3 when the question is incorrect. Path should be relative to the *src* folder.  

>>>**_partlyCorrect** (string): File name (including path) of the mp3 when the question is partly correct. Path should be relative to the *src* folder.  

>>**_items** (object array): Multiple items may be created. Each item represents a question option. **_items** contains values for **_src**.  

>>>**_src** (string): File name (including path) of the mp3 which is played when option specific feedback is shown. Path should be relative to the *src* folder.  

<div float align=right><a href="#top">Back to Top</a></div>

**Page**
The **_audio** attribute at Page level contains values for **_isEnabled**, **_showControls**, **_autoplay**, **_autoPlayOnce**, **_channel**, **_location**, and **_media**.

>**_isEnabled** (boolean):  Turns on and off the **Audio** extension. Can be set to disable **Audio** when not required.  

>**_showControls** (boolean):  Defines whether the audio control button will be displayed on screen.  

>**_autoplay** (boolean):  Defines whether the audio will auto play when on screen.  

>**_autoPlayOnce** (boolean):  Defines whether the audio will auto play when only occur once. If set to `false` the audio will play when the element is on screen again.  

>**_channel** (number):  Defines the channel number. Options are `0`, `1` and `2`.  

>**_location** (string):  Defines the location of the audio button within the element. Options are `top-left`, `top-right`, `bottom-left` and `bottom-right`.  

>**_media** (object): This `_media` attributes group stores the properties for the audio clip. It contains values for **src**.  

>>**src** (string): File name (including path) of the mp3. Path should be relative to the *src* folder.  


<div float align=right><a href="#top">Back to Top</a></div>

----------------------------
**Version number:**  4.1.8   
**Framework versions supported:**  4+    
**Author / maintainer:** DeltaNet with [contributors](https://github.com/deltanet/adapt-audio/graphs/contributors)     
**Accessibility support:** Yes  
**RTL support:** Yes     
**Authoring tool support:** Yes
