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
        utils,
        galleries = {},
        defaultUnit = "px",
        imageExtensions = "jpg|png|gif", //default image extensions
        overlayTriggerEvent = "click", //default overlay trigger event
        defaultDimensions = "inherit",
        loadingIndicator = '<span class="so-loading">Loading data...</span>',
        overlayFragment, //DOM fragment used to perform operations on nodes
        overlayMainLayer, //main overlay layer element
        overlayTargetBox,
        closeButtonWrapper,
        closeButton,
        XHRObject,
        nextArrow = '<img src="img/next.png" />',
        prevArrow = '<img src="img/prev.png" />'; //overlayed box with content
    
    function init (options) {
        //This particular chunk of code is taken from Stoyan Stefanov book:
        //JavaScript Patterns, by Stoyan Stefanov (O’Reilly). Copyright 2010 Yahoo!, Inc., 9780596806750.
        // the interface of event listener utility
        utils = {
            addListener: null,
            removeListener: null
        };

        if (typeof window.addEventListener === 'function') {
            utils.addListener = function (el, type, fn) {
                el.addEventListener(type, fn, false);
            };
            utils.removeListener = function (el, type, fn) {
                el.removeEventListener(type, fn, false);
            };
        } else if (typeof document.attachEvent === 'function') { // IE
            utils.addListener = function (el, type, fn) {
                el.attachEvent('on' + type, fn);
            };
            utils.removeListener = function (el, type, fn) {
                el.detachEvent('on' + type, fn);
            };
        } else { // older browsers
            utils.addListener = function (el, type, fn) {
                el['on' + type] = fn;
            };
            utils.removeListener = function (el, type, fn) {
                el['on' + type] = null;
            };
        }

        var options = options || {};
        var overlayTriggers = document.querySelectorAll(".so-onpage, .so-resource, .so-image, .so-gallery");

        overlayTriggerEvent = options.overlayTriggerEvent || overlayTriggerEvent;

        if (options.imageExtensions) {
            imageExtensions += "|" + options.imageExtensions;
        }

        for (var i = 0, length = overlayTriggers.length; i < length; i += 1) {
            utils.addListener(overlayTriggers[i], overlayTriggerEvent, overlay);

            //scan for galleries
            if (hasClass(overlayTriggers[i], "so-gallery")) {
                var galleryName = overlayTriggers[i].getAttribute("data-gallery");

                if (galleryName === null) {
                    console.log("SimpleOverlay error: you have to specify gallery name");
                    continue;
                }  

                galleries[galleryName] = galleries[galleryName] || [];
                galleries[galleryName].push(overlayTriggers[i]);
            }
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

        closeButtonWrapper = document.createElement('div');
        closeButtonWrapper.setAttribute("id", "so-close-button-wrapper");

        closeButton = document.createElement("div");
        closeButton.setAttribute("id", "so-close-button");
        utils.addListener(closeButton, "click", function (event) {
            closeOverlay(overlayMainLayer, overlayTargetBox, closeButton);
        });

        closeButtonWrapper.appendChild(closeButton);

        overlayFragment.appendChild(closeButtonWrapper);
        overlayFragment.appendChild(overlayMainLayer);
        overlayFragment.appendChild(overlayTargetBox);
        
        document.body.appendChild(overlayFragment);

        //close overlay after click outside the target box
        overlayMainLayer.addEventListener("click", function (event) {
            closeOverlay(this, overlayTargetBox, closeButton);
        }, false);

        //choose strategy accordingly to element's class name
        if (hasClass(this, "so-onpage")) {
            onPageOverlay.call(this);
        } else if (hasClass(this, "so-image")) {
            imageOverlay.call(this);
        } else if (hasClass(this, "so-resource")) {
            resourceOverlay.call(this);
        } else if (hasClass(this, "so-gallery")) {
            galleryOverlay.call(this);
        } 

        var overrideClass = this.getAttribute("data-style");

        if (overrideClass !== null) {
            overlayTargetBox.className = overrideClass;
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

        addEvents();
        addCloseEvents();
        addCloseButton();        
    }

    function imageOverlay (event) {
        var imageUrl = this.href,
            currentImageExtension = imageUrl.substr(-3, 3);

        if (imageExtensions.indexOf(currentImageExtension) === -1) {
            console.log("SimpleOverlay error: unregistered image extension. Consider adding it in so.init() method.");
            return;
        }

        var description = this.getAttribute("data-description");
        
        overlayTargetBox.innerHTML = loadingIndicator;
        overlayTargetBox.style.height = "200px";
        overlayTargetBox.style.width = "200px";
        
        var imageElement = new Image();
        imageElement.src = imageUrl;
        utils.addListener(imageElement, "load", function (event) {
            overlayTargetBox.innerHTML = "";
            overlayTargetBox.appendChild(this);
            overlayTargetBox.style.width = this.width + "px";
            overlayTargetBox.style.height = this.height + "px";

            if (description !== null) {
                var descriptionDiv = document.createElement("div");
                descriptionDiv.className = "so-image-description";
                descriptionDiv.innerHTML = '<p class="so-description-text">' + description + '</p>';
                overlayTargetBox.appendChild(descriptionDiv);
            }

            overlayMainLayer.style.opacity = 1;
            overlayTargetBox.style.opacity = 1;

            addCloseButton();
        });
    }

    function galleryOverlay (element) {
        overlayTargetBox.innerHTML = "";

        var element = element || this;
            imageUrl = element.href,
            currentImageExtension = imageUrl.substr(-3, 3),
            gallery = element.getAttribute("data-gallery");

        if (imageExtensions.indexOf(currentImageExtension) === -1) {
            console.log("SimpleOverlay error: unregistered image extension. Consider adding it in so.init() method.");
            return;
        }

        var galleryImagesQuantity = galleries[gallery].length;
        var currentImageIndex = element.getAttribute("data-index") || galleries[gallery].indexOf(element);
        currentImageIndex = parseInt(currentImageIndex);

        var nextImage = galleries[gallery][currentImageIndex + 1] || null,
            prevImage = galleries[gallery][currentImageIndex - 1] || null;

        var imageElement = new Image();
        imageElement.src = imageUrl;
        utils.addListener(imageElement, "load", function (event) {
            overlayTargetBox.innerHTML = "";
            overlayTargetBox.appendChild(this);
            overlayTargetBox.style.width = this.width + "px";
            overlayTargetBox.style.height = this.height + "px";

            var descriptionDiv = document.createElement("div");
            descriptionDiv.className = "so-image-description";

            var description = document.createElement("p");
            description.className = "so-description-text";

            var navBox = document.createElement("div");
            navBox.className = "so-nav-box";

            if (prevImage !== null) {
                navBox.appendChild(addPrevNextButton(prevImage, currentImageIndex, "prev"));
            }
            /*
            var position = document.createElement("span");
            position.className = "so-image-position"
            position.textContent = (currentImageIndex + 1) + "/" + galleryImagesQuantity;
            navBox.appendChild(position);*/

            if (nextImage !== null) {
                navBox.appendChild(addPrevNextButton(nextImage, currentImageIndex, "next"));
            }

            description.appendChild(navBox);

            var descriptionText = document.createTextNode("Tu będzie opis!");
            description.appendChild(descriptionText);

            descriptionDiv.appendChild(description);
            overlayTargetBox.appendChild(descriptionDiv);
            
            overlayMainLayer.style.opacity = 1;
            overlayTargetBox.style.opacity = 1;

            addCloseButton();
        });
    }

    /*
    Gallery iteration functions
     */
    
    function addPrevNextButton (imageElement, currentImageIndex, which) {
        var imageElement = imageElement.cloneNode(true);

        if (which === "next") {
            var elementIndicator = 1,
                arrowElement = nextArrow;
        } else {
            var elementIndicator = -1,
                arrowElement = prevArrow;
        }
        
        imageElement.innerHTML = arrowElement;
        imageElement.setAttribute("data-index", currentImageIndex + elementIndicator);

        utils.addListener(imageElement, "click", function (event) {
            event.preventDefault();
            galleryOverlay(imageElement);
        });

        return imageElement;
    }

    function resourceOverlay (event) {
        var resourceUrl = this.href;

        if (resourceUrl === "") {
            console.log("SimpleOverlay error: resource URL cannot be empty.");
            return;
        }

        //set target box dimensions
        var dimensionsString = this.getAttribute("data-dimensions");

        if (dimensionsString !== null) {
            var dimensions = parseDimensions(dimensionsString),
                widthUnit = dimensions.widthUnit || defaultUnit,
                heightUnit = dimensions.heightUnit || defaultUnit;

            overlayTargetBox.style.width = (dimensions.width === "auto") ? "auto" : dimensions.width + widthUnit;
            overlayTargetBox.style.height = (dimensions.height === "auto") ? "auto" : dimensions.height + heightUnit;
        }

        //XHR feature detection
        var activeXids = [
                'MSXML2.XMLHTTP.3.0',
                'MSXML2.XMLHTTP',
                'Microsoft.XMLHTTP'
            ];

        if (typeof XMLHttpRequest === "function") { // native XHR
            var xhr = new XMLHttpRequest();
        } else { // IE before 7
            for (var i = 0; i < activeXids.length; i += 1) {
                try {
                    var xhr = new ActiveXObject(activeXids[i]);
                    break;
                } catch (e) {}
            }
        }

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    overlayTargetBox.innerHTML = this.responseText;

                    addEvents();
                    addCloseEvents();
                    addCloseButton();
                } else {
                    console.log("SimpleOverlay error: there was an error on AJAX request.");
                    return;
                }
            } else {
                overlayTargetBox.innerHTML = loadingIndicator;
                overlayMainLayer.style.opacity = 1;
                overlayTargetBox.style.opacity = 1;
            }
        }

        xhr.open("get", resourceUrl, true);
        xhr.send(null);
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

    function addEvents() {
        for (selector in events) {
            var eventElements = overlayTargetBox.querySelectorAll(selector);

            for (var i = 0, length = eventElements.length; i < length; i += 1) {
                events[selector].forEach(function (event, index, events) {
                    utils.addListener(eventElements[i], event.type, event.callback);
                    //eventElements[i].addEventListener(event.type, event.callback, false);
                });
            }
        }
    }

    function addCloseEvents () {
        //in this part we check if there are any overlay close triggers put in the target element by user
        var overlayCloseTriggers = overlayTargetBox.querySelectorAll(".so-close");

        //if so, add click events with close function
        if (overlayCloseTriggers !== null) {
            for (var i = 0, length = overlayCloseTriggers.length; i < length; i += 1) {
                utils.addListener(overlayCloseTriggers[i], "click", function (event) {
                    closeOverlay();
                });
            }
        }
    }

    function addCloseButton () {
        //var boundings = overlayTargetBox.getBoundingClientRect();
        closeButtonWrapper.style.width = overlayTargetBox.offsetWidth + "px";
        closeButtonWrapper.style.opacity = 1;
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
    function closeOverlay (overlayMainLayer, overlayTargetBox, closeButton) {
        var overlayMainLayer = overlayMainLayer || document.getElementById("so-overlay"),
            overlayTargetBox = overlayTargetBox || document.getElementById("so-target-box"),
            closeButtonWrapper = closeButtonWrapper || document.getElementById("so-close-button-wrapper");

        if (overlayMainLayer !== null) {
            overlayMainLayer.style.opacity = 0;
            overlayTargetBox.style.opacity = 0;
            closeButtonWrapper.style.opacity = 0;

            setTimeout(function () {
                removeElement(overlayMainLayer);
                removeElement(overlayTargetBox);
                removeElement(closeButtonWrapper);
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