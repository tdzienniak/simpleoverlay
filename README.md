SimpleOverlay
=============

Really simple overlay, without use of jQuery and such.

__Note:__ This library is not ready yet. Not all features are implemented. When it's done, I will remove this note and add version number.

###Features###
- very simple
- written in [VanillaJS](http://vanilla-js.com/ "VanillaJS") framework, thus, no additional libraries are required
- small size (about 6K minified)
- multiple overlay targets (on page elements, remote files, images)
- highly customizable (either by editing its CSS file or adding custom classes)

So, if you don't like/want/have to use jQuery and its overlay plugins, you can find this tiny library useful. However, if you are already using jQuery in one of your projects, it is probably better solution to use jQuery overlay plugin. There are plenty of them on the Web.

##Installation##

To install SimpleOverlay just add following code to `head` section of your page:
```html
<link rel="stylesheet" type="text/css" href="css/simpleoverlay.css" />
```
and this after `body` section:
```html
<script src="lib/simpleoverlay.js"></script>
<script>
  so.init();
</script>   
```
As you've noticed, we call `so.init()` method to initialize overlay. During initialization SimpleOverlay
is adding event listeners to trigger elements on the page. I will tell you about trigger elements later. 
If you want, you can pass a JavaScript object as a parameter to `so.init()` method. It should look like this:
```javascript
so.init({
  imageExtensions: "png|jpg|bmp", //for example purpose, .jpg and .png are set by default
  defaultUnit: "em", //overlay dimensions unit, "px" by default
  overlayTriggerEvent: "mouseover" //event that triggers overlay when it happens on trigger element, "click" by default
});
```
You don't have to specify all properties, just the ones you want to override/extend.

##Usage##

You can use SimpleOverlay to overlay elements on the page, display content obtained via AJAX request or create galleries.

###Elements on the page###

The simplest way to get overlay working is to put the element, that should be overlayed directly into the page:
```html
<div class="so-target" id="some-div">This is the element that should be overlayed</div>
```
Now you have to add a trigger element. Trigger elements are `a` tags with some special attributes:
```html
<a href="" class="so-onpage" data-target="some-div" data-dimensions="300-300|px:px">Click to get overlay</a>
```
As you can see, `div` element has `so-target` class and `id` attribute. Both are __required__. That class tells SimpleOverlay that this element is the target
element and should not be displayed in browser until it is overlayed. It's done via CSS.

Trigger element has to have both `data-target` and `data-dimensions` attributes set. `data-target` is simply an `id` of target element. `data-dimensions` is specially formated string.
The format is: `width-height|widthUnit:heightUnit`. Width and height could be an exact value or `auto`. `auto` means, that SimpleOverlay will try to determine dimensions on his own. 
You don't have to determine units. In that case just write `width-height` - default units will be used. However, if you want do set units you must set both - for width and height. Units are those used to describe CSS dimensions. Dimensions string also can have `inherit` value. In that case you have to set width and height of target element in your style sheet (inline or in CSS file).

###AJAX request content###

If you want to load some content to overlay using AJAX, you can do this by providing `href` attribute of trigger element and setting it's class to `so-resource`:
```html
<a href="content.html" class="so-resource" data-dimensions="300-300">Click to display remote content</a>
```
In this particular example SimpleOverlay will put content of _content.html_ file into overlay. It is recommended to provide exact (numbers) dimensions of overlay box. `href` attribute can be either a file and back-end script that returns HTML or plain text.
Due to _same origin policy_ URL has to indicate local (in range of domain) resource.

###Single images###

If you set `href` attribute of trigger element to image resource and class to `so-image` SimpleOverlay will automatically load that image to overlay:
```html
<a href="images/myimage.png" class="so-image" data-description="This is my image">Click to display my image in overlay</a>
```
In that case you don't have to specify dimensions. They will be set automatically. SimpleOverlay will also add a `div` element to overlay box with image description, if `data-description` attribute is set. You can customize description `div` look in _simpleoverlay.css_ file.

###Galleries of images###

You can use SimpleOverlay to create galleries:

```html
<a href="images/image1-big.png" class="so-gallery" data-gallery="mygallery"><img src="thumb1.png" /></a>
<a href="images/image2-big.png" class="so-gallery" data-gallery="mygallery"><img src="thumb2.png" /></a>
<a href="images/image3-big.png" class="so-gallery" data-gallery="mygallery"><img src="thumb3.png" /></a>
<a href="images/image4-big.png" class="so-gallery" data-gallery="mygallery"><img src="thumb4.png" /></a>
<a href="images/image5-big.png" class="so-gallery" data-gallery="mygallery"><img src="thumb5.png" /></a>
```
As you can see, the way how you make galleries is similar to overlaying images. One additional attribute is `data-gallery`.
You have to provide it. This attribute is used to simply group images together. The images with the same `data-gallery` form gallery. In this way, you can have multiple independent galleries on one page. SimpleOverlay automatically adds "Previous" and "Next" button to every image in gallery. Check out the examples to see how it works and how you can customize the gallery navigation.

###Overriding/extending overlay box styling###

If you don't like default overlay appearance you can edit global SimpleOverlay CSS file (by default in _css_ directory) or add `data-style` attribute to trigger element. This attribute must contain name of a class with your custom styles. Those CSS rules will be applied to overlay box. It means, that you can have different overlay styling for every target element. To see how it works look at the examples in _examples_ folder in this project. The most importatnt thing is to add `!important` keyword to each of your custom overlay properties. In fact, you have to add that keyword only when you are overriding property from SimpleOverlay global CSS file, not when you add one.

###Closing overlay###

By default overlay will be closed when you click outside the overlay box or on the close button on top right corner of that box. Hovewer, you can add close functionality to whatever you want in the target element:
```html
<div class="so-target" id="mydiv">
  <button class="so-close">Click me to close overlay</button>
</div>
```
As you can see, all you have to do is to add `so-close` class to any element inside target. After clicking this element, overlay will be closed.

###Events in overlayed elements###
Due to some browser stuff event handlers added to the element that should be overlayed won't work in overlay. SimpleOverlay provides a method to add events to those elements. All you have to do, is to use SimpleOverlay method:
```javascript
so.addEventListener(selector, event, callback);
```
This method has a lot in common with `addEventListener` method of any DOM element. The main difference (despite slightly different arguments) is the fact, that this method adds event listener to an element that could not exist yet. It behaves like `live()` (now `on()`) method of jQuery library. In the first argument you have to provide CSS selector of element (or elements, selector could be a class) you want to add event listener to. Second is the event like "click" or "mouseover". Note, that even if you are using old IE, you don't write "onclick" or "onmouseover" - method do this automatically. The last, but not the least argument is callback. There is a standard event object passed to it, and `this` inside callback indicates (just like in normal `addEventListener`) the element that triggers the event. All arguments are required. Remember, to use this method __only__ for elements in overlay, not for normal page elements.

##Compatibility##

SimpleOverlay is trying to perform well on any browser, but let's get it straight - the main concern is IE prior to version 9. I put an effort to get the overlay working well on them too, so things like adding event listeners and AJAX requests will work. However, most of CSS3 features that I use (transitions, shadows, border radius) won't work and I don't provide any polyfills for them. It doesn't break overlay itself, it will just look uglier (or prettier - matter of taste).

##Author and license##

MIT license:
