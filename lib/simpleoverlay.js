/*
SimpleOverlay v.0.1

Copyright (c) 2013 Tymoteusz Dzienniak

Permission is hereby granted, free of charge, to any person obtaining a copy of 
this software and associated documentation files (the "Software"), to deal in 
the Software without restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell copies of 
the Software, and to permit persons to whom the Software is furnished to do so, 
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all 
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A 
PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT 
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF 
CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE 
OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

//Some polyfills

//Quick fix (if nescessary) to the substr method.
//Source: https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/String/substr
if ('ab'.substr(-1) != 'b')
{
  /**
   *  Get the substring of a string
   *  @param  {integer}  start   where to start the substring
   *  @param  {integer}  length  how many characters to return
   *  @return {string}
   */
  String.prototype.substr = function(substr) {
    return function(start, length) {
      // did we get a negative start, calculate how much it is from the beginning of the string
      if (start < 0) start = this.length + start;
       
      // call the original function
      return substr.call(this, start, length);
    }
  }(String.prototype.substr);
}

//namespace
this.so = {};

so = (function () {
    var events = {},
        defaultUnit = "px",
        imageExtensions = "jpg|png|gif", //default image extensions
        overlayTriggerEvent = "click", //default overlay trigger event
        defaultDimensions = "inherit",
        loadingIndicator = '<span class="so-loading">Loading data...</span>',
        overlayFragment, //DOM fragment used to perform operations on nodes
        overlayMainLayer, //main overlay layer element
        overlayTargetBox; //overlayed box with content
    
    function init (options) {
        var options = options || {};
        var overlayTriggers = document.querySelectorAll(".so-onsite, .so-resource, .so-image");
        /*var overlayAjaxTriggers = document.querySelectorAll(".so-resource");
        var overlayImageTriggers = document.querySelectorAll(".so-image");*/

        overlayTriggerEvent = options.overlayTriggerEvent || overlayTriggerEvent;

        if (options.imageExtensions) {
            imageExtensions += "|" + options.imageExtensions;
        }

        for (var i = 0, length = overlayTriggers.length; i < length; i += 1) {
            overlayTriggers[i].addEventListener(overlayTriggerEvent, overlay, false);
        }
    }

    function overlay (event) {
        //first, check if we deal with correct tag
        if (this.nodeName !== "A") {
            console.log("SimpleOverlay error: overlay trigger must be an 'a' tag")
            return;
        }

        //prevent default "a" tag behavior
        event.preventDefault();

        //create new document fragment, it will be container for overlay
        overlayFragment = document.createDocumentFragment();

        //create main overlay layer
        overlayMainLayer = document.createElement("div");
        overlayMainLayer.setAttribute("id", "so-overlay");
        overlayTargetBox = document.createElement("div");
        overlayTargetBox.setAttribute("id", "so-target-box");
        overlayFragment.appendChild(overlayMainLayer);
        overlayFragment.appendChild(overlayTargetBox);

        //close overlay after click outside the target box
        overlayMainLayer.addEventListener("click", function (event) {
            closeOverlay(this);
        }, false);

        //choose strategy accordingly to element's class name
        if (hasClass(this, "so-onsite")) {
            onPageOverlay.call(this);
        } else if (hasClass(this, "so-image")) {
            imageOverlay.call(this);
        } else if (hasClass(this, "so-resource")) {
            resourceOverlay.call(this);
        }

        //in this part we check if there are any overlay close triggers put in the target element by user
        var overlayCloseTriggers = overlayTargetBox.querySelectorAll(".so-close");

        //if so, add click events with close function
        if (overlayCloseTriggers !== null) {
            for (var i = 0, length = overlayCloseTriggers.length; i < length; i += 1) {
                overlayCloseTriggers[i].addEventListener("click", function (event) {
                    closeOverlay();
                }, false);
            }
        }

        for (selector in events) {
            var eventElements = overlayTargetBox.querySelectorAll(selector);

            for (var i = 0, length = eventElements.length; i < length; i += 1) {
                events[selector].forEach(function (event, index, events) {
                    eventElements[i].addEventListener(event.type, event.callback, false);
                });
            }
        }
    }

    function onPageOverlay () {
        var targetId = this.getAttribute("data-target"),
            targetElement = document.getElementById(targetId);

        if (targetElement === "null") {
            console.log("SimpleOverlay error: there is no such target element: #" + targetId);
            return;
        }

        //clone target element
        targetElement = targetElement.cloneNode(true);
        //make cloned element visible
        targetElement.style.display = "block";

        overlayTargetBox.appendChild(targetElement); 

        //append overlay to document
        document.body.appendChild(overlayFragment);

        /*
        This part is a bit tricky. Browser fills element's info about dimensions afetr it became a part of a DOM tree.
        That's why this code is at the end of function, after appending overlay to DOM. Another not obvious thing is that
        element's width is set immediately after it is computed. Thus, height is computed with width taken into account.
        That effects in better height computation 
        */
        var dimensionsString = this.getAttribute("data-dimensions");

        if (dimensionsString === "inherit") {
            overlayTargetBox.style.width = targetElement.style.width;
            overlayTargetBox.style.height = targetElement.style.height;
        } else {
            var dimensions = parseDimensions(dimensionsString),
                widthUnit = dimensions.widthUnit || defaultUnit,
                heightUnit = dimensions.heightUnit || defaultUnit;

            overlayTargetBox.style.width = (dimensions.width === "auto") ? targetElement.offsetWidth + "px" : dimensions.width + widthUnit;
            overlayTargetBox.style.height = (dimensions.height === "auto") ? targetElement.offsetHeight + "px" : dimensions.height + heightUnit;
        }

        overlayMainLayer.style.opacity = 1;
        overlayTargetBox.style.opacity = 1;
    }

    function imageOverlay (event) {
        var imageUrl = this.href,
            currentImageExtension = imageUrl.substr(-3, 3);

        if (imageExtensions.indexOf(currentImageExtension) === -1) {
            console.log("SimpleOverlay error: unregistered image extension. Consider adding it in so.init() method.");
            return;
        }

        overlayTargetBox.innerHTML = loadingIndicator;
        overlayTargetBox.style.height = "200px";
        overlayTargetBox.style.width = "200px";

        //append overlay to document
        document.body.appendChild(overlayFragment);

        overlayMainLayer.style.opacity = 1;
        overlayTargetBox.style.opacity = 1;

        var imageElement = new Image();
        imageElement.src = imageUrl;
        imageElement.addEventListener("load", function (event) {
            overlayTargetBox.innerHTML = "";
            overlayTargetBox.appendChild(this);
            overlayTargetBox.style.width = this.width + "px";
            overlayTargetBox.style.height = this.height + "px";
        }, false);
    }

    function galleryOverlay () {

    }

    function resourceOverlay (event) {
        var httpRequest,
            resourceUrl = this.href;

        if (resourceUrl === "") {
            console.log("SimpleOverlay error: resource URL cannot be empty.");
            return;
        }

        //append overlay to document
        document.body.appendChild(overlayFragment);

        //set target box dimensions
        var dimensionsString = this.getAttribute("data-dimensions");

        if (dimensionsString !== null) {
            var dimensions = parseDimensions(dimensionsString),
                widthUnit = dimensions.widthUnit || defaultUnit,
                heightUnit = dimensions.heightUnit || defaultUnit;

            overlayTargetBox.style.width = (dimensions.width === "auto") ? "auto" : dimensions.width + widthUnit;
            overlayTargetBox.style.height = (dimensions.height === "auto") ? "auto" : dimensions.height + heightUnit;
        }

        overlayMainLayer.style.opacity = 1;
        overlayTargetBox.style.opacity = 1;


        if (window.XMLHttpRequest) { // Mozilla, Safari, ...
            httpRequest = new XMLHttpRequest();
        } else if (window.ActiveXObject) { // IE 8 and older
            httpRequest = new ActiveXObject("Microsoft.XMLHTTP");
        }

        httpRequest.addEventListener("progress", function () {
            overlayTargetBox.innerHTML = loadingIndicator;
        }, false);

        httpRequest.addEventListener("load", function (event) {
            overlayTargetBox.innerHTML = this.responseText;
        }, false);

        httpRequest.addEventListener("error", function () {
            console.log("SimpleOverlay error: there was an error on AJAX request.");
        }, false);

        httpRequest.open("get", resourceUrl, true);
        httpRequest.send(null);
    }
    

    function parseDimensions (dimensionsString) {
        var dimensionsTokens = dimensionsString.split("|");

        //if there are informations about dimension unit get them
        if (dimensionsTokens[1]) {
            var units = dimensionsTokens[1].split(":"),
                widthUnit = units[0],
                heightUnit = units[1];
        }

        var widthAndHeight = dimensionsTokens[0].split("-");

        return {
            width: widthAndHeight[0],
            height: widthAndHeight[1],
            widthUnit: widthUnit,
            heightUnit: heightUnit
        };
    }

    function isDimensionsString (dimensionsString) {

    }
    
    /**
     * Removes given element from DOM tree.
     * 
     * @param  {DOM Element} element
     * @return {DOM Element} removed element
     */
    function removeElement (element) {
        return element.parentNode.removeChild(element);
    }

    function hasClass (element, className) {
        if (element.className.indexOf(className) !== -1) {
            return true;
        }
        return false;
    }

    /**
     * Closes overlay on demand.
     * @return {undefined}
     */
    function closeOverlay (overlayMainLayer, overlayTargetBox) {
        var overlayMainLayer = overlayMainLayer || document.getElementById("so-overlay"),
            overlayTargetBox = overlayTargetBox || document.getElementById("so-target-box");

        if (overlayMainLayer !== null) {
            overlayMainLayer.style.opacity = 0;
            overlayTargetBox.style.opacity = 0;

            setTimeout(function () {
                removeElement(overlayMainLayer);
                removeElement(overlayTargetBox);
            }, 500);
        }
    }

    function addEventListener (type, selector, callback) {
        events[selector] = events[selector] || [];
        events[selector].push({
            type: type,
            callback: callback
        });
    }

    return {
        init: init,
        addEventListener: addEventListener
    };
})();