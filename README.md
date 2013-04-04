SimpleOverlay
=============

Really simple overlay, without use of jQuery and such.

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

##Examples of use##

The simplest way to get overlay working is to put the element, that should be overlayed directly into the page:
```html
<div class="so-target">This is the element that should be overlayed</div>
```
