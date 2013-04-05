SimpleOverlay
=============

Really simple overlay, without use of jQuery and such.

###Features###
- very simple
- written in [VanillaJS](http://vanilla-js.com/ "VanillaJS") framework, thus, no additional libraries are required
- small size (about 5K minified)


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
In this particular example SimpleOverlay will put content of `content.html` file into overlay. It is recommended to provide exact (numbers) dimensions of overlay box. `href` attribute can be either a file and back-end script that returns HTML or plain text.
Due to _same origin policy_ URL has to indicate local (in range of domain) resource.

###Single images###
###Galleries of images###
