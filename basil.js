/*
  ..-  --.- ..- -.... -..-- .-..-. -.-..---.-.-....--.-- -....-.... -..-- .-.-..-.-.... .- .--

  B A S I L . J S
  An attempt to port the spirit of the Processing visualization language to Adobe Indesign.
  
  License        - MIT
  Developers     - Benedikt Groß http://benedikt-gross.de
                 - Ludwig Zeller http://ludwigzeller.de
                 - Ted Davis http://teddavis.org
  Contributers   - Stefan Landsbek, inital code architecture, http://47nord.de
                 - Philipp Adrian http://www.philippadrian.com/
  Web Site       - http://basiljs.ch
  Github Repo.   - https://github.com/basiljs/basil.js
  Processing     - http://processing.org
  Processing.js  - http://processingjs.org

  basil.js was conceived and is generously supported by
  The Visual Communication Institute / The Basel School of Design
  Department of the Academy of Art and Design Basel (HGK FHNW)
  
  http://thebaselschoolofdesign.ch

  Please note: Big general parts e.g. random() of the basil.js source code are copy & paste
  of the fantasic processing.js project created by John Resig. We would have had a hard time
  to figure all of that out on our own!

  Supported Adobe Indesign versions: CS 5, CS 5.5 and CS 6
  
  .--.--.- .-.-......-....--.-- -.... -..---.-.... .-- . .---.- -... -.-..---.-. ..--.-- -.. -
*/

#target "InDesign";

(function(glob, app, undef) {
  /**
   * @class b
   * @static
   */
  var pub = {};


  // ----------------------------------------
  // constants
  
  /**
   * The basil version
   * @property VERSION {String}
   * @cat Constants
   */
  pub.VERSION = "0.16";

  /**
   * Points
   * @property PT {String}
   * @cat Constants
   */
  pub.PT = "pt";

  /**
   * Pixels
   * @property PX {String}
   * @cat Constants
   */
  pub.PX = "px";

  /**
   * Centimeter
   * @property CM {String}
   * @cat Constants
   */

  pub.CM = "cm";

  /**
   * Millimeter
   * @property MM {String}
   * @cat Constants
   */
  pub.MM = "mm";

  /**
   * Inch
   * @property IN {String}
   * @cat Constants
   */
  pub.IN = "inch";

  /**
   * Corner, used for drawing modes.
   * @property CORNER {String}
   * @cat Constants
   */
  pub.CORNER = "corner";

  /**
   * Corners, used for drawing modes.
   * @property CORNERS {String}
   * @cat Constants
   */
  pub.CORNERS = "corners";

  /**
   * Center, used for drawing modes.
   * @property CENTER {String}
   * @cat Constants
   */
  pub.CENTER = "center";

  /**
   * Radius, used for drawing modes.
   * @property RADIUS {String}
   * @cat Constants
   */
  pub.RADIUS = "radius";

  /**
   * Two Pi
   * @property TWO_PI {Number}
   * @cat Constants
   */
  pub.TWO_PI = Math.PI*2;

  /**
   * Pi
   * @property PI {Number}
   * @cat Constants
   */
  pub.PI = Math.PI;

  /**
   * Half Pi
   * @property HALF_PI {Number}
   * @cat Constants
   */
  pub.HALF_PI = Math.PI/2;

  /**
   * Quarter Pi
   * @property QUARTER_PI {Number}
   * @cat Constants
   */
  pub.QUARTER_PI = Math.PI/4;
  
  var ERROR_PREFIX = "\n\n### Basil Error -> ",
    WARNING_PREFIX = "### Basil Warning -> ";


  // ----------------------------------------
  // public vars
  
  /**
   * System variable which stores the width of the current page.
   * @property width {Number}
   * @cat Environment
   */
  pub.width = null;

  /**
   * System variable which stores the height of the current page.
   * @property height {Number}
   * @cat Environment
   */
  pub.height = null;

  
  /**
   * @property PAPER {String}
   * @cat Constants
   */
  pub.PAPER = "paper";

  /**
   * @property PAPER {String}
   * @cat Constants
   */
  pub.MARGIN = "margin";

  /**
   * @property PAPER {String}
   * @cat Constants
   */
  pub.BLEED = "bleed";

  /**
   * @property FACING_PAGES {String}
   * @cat Constants
   */
  pub.FACING_PAGES = "facing_pages";

  
  // pub.FACING_BLEED = "facing_bleed";  

  /**
   * @property AT_BEGINNING {String}
   * @cat Constants
   */
  pub.AT_BEGINNING = LocationOptions.AT_BEGINNING;

  /**
   * @property AT_END {String}
   * @cat Constants
   */  
  pub.AT_END = LocationOptions.AT_END;

  /**
   * @property BEFORE {String}
   * @cat Constants
   */
  pub.BEFORE = LocationOptions.BEFORE;

  /**
   * @property AFTER {String}
   * @cat Constants
   */  
  pub.AFTER = LocationOptions.AFTER;


  // init has to be above the method definition below... otherwise trouble
  var cMode = pub.PAPER;

  /**
   * Use this to set the dimensions of the canvas. Choose between b.PAPER (default), b.MARGIN and b.BLEED.
   * Please note that you will loose your current MatrixTransformation. You should set the canvasMode before you attempt to use b.translate(), b.rotate() and b.scale();
   * @method canvasMode
   * @cat Environment
   */
  pub.canvasMode = function ( m ) {
    if(arguments.length == 0) {
      return cMode;
    } else if ( typeof m === "string" ) {
      cMode = m;
      updatePublicPageSizeVars();
    } else {
      error("Problem setting canvasMode. Please consult the reference.");
    }

  };

  
  // ----------------------------------------
  // private vars
  var currDoc = null,
    currPage = null,
    currLayer = null,
    currUnits = null,
    currMatrix = null,
    matrixStack = null,
    currColorMode = null,
    currFillColor = null,
    currStrokeColor = null,
    currStrokeTint = null,
    currFillTint = null,
    currStrokeWeight = null,
    currRectMode = null,
    currEllipseMode = null,
    noneSwatchColor = null,
    start = null,
    currFont = null,
    currFontSize = null,
    currAlign = null,
    currYAlign = null,
    currLeading = null,
    currKerning = null,
    currTracking = null,
    currImageMode = null;

  
  // ----------------------------------------
  // global functions


  /* todo */
  // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/filter
  if (!Array.prototype.filter) {
    Array.prototype.filter = function(fun) {
      if (this === null) throw new TypeError();
      var t = Object(this);
      var len = t.length >>> 0;
      if (typeof fun != "function") throw new TypeError();
      var res = [];
      var thisp = arguments[1];
      for (var i = 0; i < len; i++) {
        if (i in t) {
          var val = t[i]; // in case fun mutates this
          if (fun.call(thisp, val, i, t)) res.push(val);
        }
      }
      return res;
    };
  }

  /**
  * Used to run a function on all elements of an array. Please note the existance of the convenience methods b.stories(), b.paragraphs(), b.lines(), b.words() and b.characters() that are used to iterate through all instances of the given type in the given document.
  *
  * @cat Data
  * @subcat Array Functions
  * @method forEach
  * @param {Array} collection The array to be processed.
  * @param {Function} cb The function that will be called on each element. The call will be like function(item,i) where i is the current index of the item within the array.
  */
  if (!glob.forEach) {
    glob.forEach = function(collection, cb) {
      for (var i = 0, len = collection.length; i < len; i++) {
        if(cb(collection[i],i) === false) {
          return false;
        }
      }
      return true;
    };
  }


  // taken from http://pbrajkumar.wordpress.com/2011/01/17/hashmap-in-javascript/
  glob.HashList = function () {
    var that = {};
    that.length = 0;
    that.items = {};
      
    // for (var i = 0; i < arguments.length; i += 2) {
    //   if (typeof(arguments[i + 1]) != 'undefined') {
    //     that.items[arguments[i]] = arguments[i + 1];
    //     that.length++;
    //   }
    // }
    
    // Please note: this is removing Object fields, but has to be done to have an empty "bucket"
    function checkKey(key) {
      if(that.items[key] instanceof Function) {
          that.items[key] = undef; 
      };
    }

    that.remove = function(key) {
      var tmp_previous;
      if (typeof(that.items[key]) != undef) {
        var tmp_previous = that.items[key];
        delete that.items[key];
        that.length--;
      }
      return tmp_previous;
    }

    that.get = function(key) {    
      return that.items[key];
    }

    that.set = function(key, value) {
      //checkKey(key);
      if (typeof(value) != undef) {
        if (typeof(that.items[key]) === undef) {
          that.length++;
        }
        that.items[key] = value;
      }
      return that.items[key];
    }

    that.hasKey = function(key) {
      checkKey(key);
      return that.items[key] != undef;
    }

    that.hasValue = function(value) {
      var obj = that.items;
      var found = false;
      for(var key in obj) {
        if (obj[key] === value) {
          found = true;
          break;
        };
      }
      return found;
    }
      
    that.getKeysSortedByValues = function() {
        var obj = that.items;
        var keys = [];
        for(var key in obj) keys.push(key);
        return keys.sort(function(a,b){return obj[b]-obj[a]});
    }

    that.clear = function() {
      for (var i in that.items) {
        delete that.items[i];
      }
      that.length = 0;
    }

    return that;
  }  
  
  
  // ----------------------------------------
  // Structure
  
  /**
   * Suspends the calling thread for a number of milliseconds.
   * During a sleep period, checks at 100 millisecond intervals to see whether the sleep should be terminated.
   *
   * @cat Environment
   * @method delay
   * @param  {Number} milliseconds  The delay time in milliseconds
   * @param  {Category} Test
   */
  pub.delay = function (milliseconds) {
    $.sleep(milliseconds);
  };

  /**
   * If no callback function is given it returns a Collection of items otherwise calls the given callback function with each story of the given document.
   *
   * @cat Document
   * @subcat InDesign Model
   * @method stories
   * @param  {Document} doc The document instance to iterate the stories in
   * @param  {Function} cb  Optional: The callback function to call with each story. When this function returns false the loop stops. Passed arguments: story, loopCount;
   * @param  {Category} Test
   * @return {Stories} You can use it like an array.
   */
  pub.stories = function(doc, cb) {
    if(arguments.length === 1 && doc instanceof Document) {
      return doc.stories;
    } else if (cb instanceof Function) {
      return forEach(doc.stories, cb);
    } else {
      error("Incorrect call of b.stories().");
    }
  };

  /**
   * If no callback function is given it returns a Collection of items otherwise calls the given callback function with each paragraph of the given document, story or text frame.
   *
   * @cat Document
   * @subcat InDesign Model
   * @method paragraphs
   * @param  {Document|Story|TextFrame} item The story or text frame instance to iterate the paragraphs in
   * @param  {Function} cb  Optional: The callback function to call with each paragraph. When this function returns false the loop stops. Passed arguments: para, loopCount
   * @return {Paragraphs} You can use it like an array.   
   */
  pub.paragraphs = function(item, cb) {

    var err = false;
    try{
      item[0]; // check if list
      err = true; // access ok -> error
    } catch (expected) {};
    if(err) error("Array/Collection has been passed to b.paragraphs(). Single object expected.");

    if(arguments.length === 1) {
      return item.paragraphs;
    } else if (cb instanceof Function) {
      if (item instanceof Document) {
        return forEachStoryProperty(item, 'paragraphs', cb);
      } else {
        return forEach(item.paragraphs, cb);
      }
    }
  };

  /**
   * If no callback function is given it returns a Collection of strings otherwise calls the given callback function with each sentences of the given document, story or text frame.
   *
   * @cat Document
   * @subcat InDesign Model
   * @method sentences
   * @param  {Document|Story|TextFrame} item The story or text frame instance to iterate the sentences in
   * @param  {Function} cb  Optional: The callback function to call with each sentence. When this function returns false the loop stops. Passed arguments: sentence, loopCount
   * @return {Array} An array of strings
   */
  pub.sentences = function(item, cb) {

    var err = false;
    try{
      item[0]; // check if list
      err = true; // access ok -> error
    } catch (expected) {};
    if(err) error("Array/Collection has been passed to b.sentences(). Single object expected.");

    if(arguments.length >= 1 ) {
      var arr;
      try{
        str = item.contents;  
        arr = str.match( /[^\.!\?]+[\.!\?]+/g );
      } catch (e){
        error("Object passed to b.sentences() does not have text or is incompatible.");
      }

      if(arguments.length === 1) {
        return arr;
      } else if (cb instanceof Function) {
        forEach(arr,cb);
      } else {
        error("callback is not a Function.");
      }

    }

  };

  /**
   * If no callback function is given it returns a Collection of items otherwise calls the given callback function with each line of the given document, story, text frame or paragraph.
   *
   * @cat Document
   * @subcat InDesign Model
   * @method lines
   * @param  {Document|Story|TextFrame|Paragraph} item The document, story, text frame or paragraph instance to
   *                                                   iterate the lines in
   * @param  {Function} cb Optional: The callback function to call with each line. When this function returns false the loop stops. Passed arguments: line, loopCount
   * @return {Lines} You can use it like an array.
   */
  pub.lines = function(item, cb) {

    var err = false;
    try{
      item[0]; // check if list
      err = true; // access ok -> error
    } catch (expected) {};
    if(err) error("Array/Collection has been passed to b.lines(). Single object expected.");

    if(arguments.length === 1) {
      return item.lines;
    } else if (cb instanceof Function) {
      if (item instanceof Document) {
        return forEachStoryProperty(item, 'lines', cb);
      } else {
        return forEach(item.lines, cb);
      }
    }
  };

  /**
   * If no callback function is given it returns a Collection of items otherwise calls the given callback function with each word of the given document, story, text frame, paragraph or line.
   *
   * @cat Document
   * @subcat InDesign Model
   * @method words
   * @param  {Document|Story|TextFrame|Paragraph|Line} item The document, story, text frame, paragraph or line instance
   *                                                        to iterate the words in
   * @param  {Function} cb Optional: The callback function to call with each word. When this function returns false the loop stops. Passed arguments: word, loopCount
   * @return {Words} You can use it like an array.
   */
  pub.words = function(item, cb) {

    var err = false;
    try{
      item[0]; // check if list
      err = true; // access ok -> error
    } catch (expected) {};
    if(err) error("Array/Collection has been passed to b.words(). Single object expected.");
    
    if(arguments.length === 1){
      return item.words;
    } else if (cb instanceof Function) {
      if (item instanceof Document) {
        return forEachStoryProperty(item, 'words', cb);
      } else {
        return forEach(item.words, cb);
      }
    }
  };

  /**
   * If no callback function is given it returns a Collection of items otherwise calls the given callback function with each character of the given document, story, text frame, paragraph, line or word.
   *
   * @cat Document
   * @subcat InDesign Model
   * @method characters
   * @param  {Document|Story|TextFrame|Paragraph|Line|Word} item The document, story, text frame, paragraph, line or word instance to
   *                                                    iterate the characters in
   * @param  {Function} cb Optional: The callback function to call with each character. When this function returns false the loop stops. Passed arguments: character, loopCount
   * @return {Characters} You can use it like an array.
   */
  pub.characters = function(item, cb) {

    var err = false;
    try{
      item[0]; // check if list
      err = true; // access ok -> error
    } catch (expected) {};
    if(err) error("Array/Collection has been passed to b.characters(). Single object expected.");

    if(arguments.length === 1) {
      return item.characters;
    } else if ( cb instanceof Function) {
      if (item instanceof Document) {
        return forEachStoryProperty(item, 'characters', cb);
      } else {
        return forEach(item.characters, cb);
      }
    }
  };

  var forEachStoryProperty = function(doc, property, cb) {
    var loopCount = 0;
    pub.stories(doc, function(story) {
      var properties = story[property];
      for (var i = 0, len = properties.length; i < len; i++) {
        if(cb(properties[i], loopCount++) === false) {
          return false;
        }
      }
      return true;
    });
  };

  /**
   * If no callback function is given it returns a Collection of items otherwise calls the given callback function for each of the PageItems in the given Document, Page, Layer or Group.
   *
   * @cat Document
   * @subcat InDesign Model
   * @method items
   * @param  {Document|Page|Layer|Group} container The container where the PageItems sit in
   * @param  {Function|Boolean} cb Optional: The callback function to call for each PageItem. When this function returns false the loop stops. Passed arguments: item, loopCount. 
   * @return {PageItems} You can use it like an array.
   */
  pub.items = function(container, cb) {

    if (container instanceof Document 
      || container instanceof Page 
      || container instanceof Layer 
      || container instanceof Group) {

      if(arguments.length === 1){
        return container.pageItems;
      } else if(cb instanceof Function ) {
        return forEach(container.allPageItems, cb);
      }
    } else {
      error("Not a valid PageItem container, should be Document, Page, Layer or Group");
    }
  };
  

  /**
   * Removes all PageItems in the given Document, Page, Layer or Group.
   *
   * @cat Document
   * @subcat InDesign Model
   * @method clear
   * @param  {Document|Page|Layer|Group} container The container where the PageItems sit in
   */
  pub.clear = function(container) {

    if (container instanceof Document 
      || container instanceof Page 
      || container instanceof Layer 
      || container instanceof Group) {

        return forEach(container.allPageItems, function(item,n){
          // Groups have to be avoided for deletion
          // otherwise deletion process is confused
          if(item !== null && ! (item instanceof Group) ) {
            if(item.locked) error("Some items are locked. Please unlock them first.");
            item.remove();
          }
        });

      } else {
        return false;
      }
  };  

  /**
   * Checks whether a var is an Array, returns true if this is the case
   *
   * @cat Data
   * @subcat Array Functions
   * @method isArray
   * @param  {Object|String|Number}  obj The object to check
   * @return {Boolean}     [description]
   */
  var isArray = pub.isArray = function(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
  };

  /**
   * Checks whether a var is a number, returns true if this is the case
   *
   * @cat Data
   * @method isNumber
   * @param  {Object|String|Number}  num The number to ckeck
   * @return {Boolean}
   */
  var isNumber = pub.isNumber = function(num) {
    return !isNaN(parseFloat(num)) && isFinite(num);
  };

  /**
   * Checks whether a var is an indesign text object, returns true if this is the case
   *
   * @cat Document
   * @subcat InDesign Model
   * @method isText
   * @param  {Character|InsertionPoint|Line|Paragraph|TextColumn|TextStyleRange|Word}  obj The object to check
   * @return {Boolean}     [description]
   */
  var isText = pub.isText = function(obj) {
    return obj instanceof Character ||
           obj instanceof InsertionPoint ||
           obj instanceof Line ||
           obj instanceof Paragraph ||
           obj instanceof TextColumn ||
           obj instanceof TextStyleRange ||
           obj instanceof Word;
  };


  // ----------------------------------------
  // Environment
  
  /**
   * Sets or possibly creates the current document and returns it.
   * If the param doc is not given the current document gets set to the active document
   * in the application. If no document at all is open, a new document gets created.
   *
   * @cat Document
   * @method doc
   * @param  {Document} [doc] The document to set the current document to
   * @return {Document} The current document instance
   */
  pub.doc = function(doc) {
    if (doc instanceof Document) {
      setCurrDoc(doc);
    }
    return currentDoc();
  };

  /**
   * Closes the current document.
   *
   * @cat Document
   * @method close
   * @param  {SaveOptions|Booleand} [saveOptions] The indesign SaveOptions constant or either true for triggering saving before closing or false for closing without saving.
   * @param  {File} [file] Optional: The indesign file instance to save the document to
   */
  pub.close = function(saveOptions, file) {
    var doc = currentDoc();
    if (doc) {
      if( typeof saveOptions === 'boolean' && saveOptions === false ) saveOptions = SaveOptions.no;
      if( typeof saveOptions === 'boolean' && saveOptions === true ) saveOptions = SaveOptions.yes;
      doc.close(saveOptions, file);
      resetCurrDoc();
    }
  };

  /**
   * Returns the current page and sets it if argument page is given. Numbering starts with 1.
   *
   * @cat Document
   * @subcat InDesign Model
   * @method page
   * @param  {Page|Number} [page] The page or page index to set the current page to
   * @return {Page} The current page instance
   */
  pub.page = function(page) {
    if (page instanceof Page) {
      currPage = page;
    } else if (typeof page === 'number') {
      if( page < 1 ) {
        p = 0;
      } else {
        p = page - 1;
      }
      var tempPage = currentDoc().pages[p];
      try {
        tempPage.id;
      } catch (e) {
        error('Page ' + page + ' does not exist.');
      }
      currPage = tempPage;
    }
    updatePublicPageSizeVars();
    app.activeWindow.activePage = currPage; // focus in GUI
    return currentPage();
  };

  /**
   * Adds a new page to the document. Set the optional location parameter to either b.AT_END (default), b.AT_BEGINNING, b.AFTER or b.BEFORE. b.AFTER and b.BEFORE will use the current page as insertion point.
   *
   * @cat Document
   * @subcat InDesign Model
   * @method addPage
   * @param  {String} [location] The location placement mode
   * @return {Page} The new page
   */
  pub.addPage = function(location) {

    if(arguments.length === 0) location = b.AT_END; // default
    
    var nP;
    try {
      
      switch ( location ) {
        
        case b.AT_END:
          nP = currentDoc().pages.add(location);
          break;

        case b.AT_BEGINNING:
          nP = currentDoc().pages.add(location);     
          break;

        case b.AFTER:
          nP = currentDoc().pages.add(location, pub.page() ); 
          break;

        case b.BEFORE:
          nP = currentDoc().pages.add(location, pub.page() );
          break;

        default:
          throw new Error(); 
          break;

      };

      pub.page( nP ); 
      return nP;

    } catch (e) {
      error("Invalid location argument passed to addPage()");
    }

  };

  /**
   * Removes a page from the current document. This will either be the current Page if the parameter page is left empty, or the given Page object or page number.
   *
   * @cat Document
   * @subcat InDesign Model
   * @method removePage
   * @param  {Page|Number} [page] Optional: The page to be removed as Page object or page number.
   * @throws {Error} e If Page not found or invalid call.
   */
  pub.removePage = function (page) {

    if( typeof page === 'number' || arguments.length === 0 || page instanceof Page ){
      var p = pub.page(page); // get the page object, todo: add an internal method of page retrieval without setting it to current
      p.remove();
      currPage = null; // reset!
      currentPage();
    } else {
      error("Invalid call of b.removePage().");
    }

  }

  /**
   * Returns the current page number of either the current page or the given Page object.
   *
   * @cat Document
   * @subcat InDesign Model
   * @method pageNumber
   * @param  {Page} [pageObj] Optional: The page you want to know the number of.
   * @return {Number} The page number within the document.
   * @throws {Error} e If Page not found or invalid call.
   */
  pub.pageNumber = function (pageObj) {

    if(typeof pageObj === 'number') error( "b.pageNumber cannot be called with a Number argument." );

    if(pageObj instanceof Page) {
      return parseInt(pageObj.name); // current number of given page
    } else {
      return parseInt(pub.page().name); // number of current page
    }
    
  }

  // does not work?
  pub.nextPage = function () {
    var p = pub.doc().pages.nextItem(currentPage());
    return pub.page(p);
  }

  // does not work?
  pub.previousPage = function () {
    var p = pub.doc().pages.previousItem(currentPage());
    return pub.page(p);
  }

  /**
   * The number of all pages in the current document.
   *
   * @cat Document
   * @subcat InDesign Model
   * @method pageCount
   * @return The amount of pages.
   * @throws {Error} e If Page not found or invalid call.
   */
  pub.pageCount = function() {
    return currentDoc().pages.count();
  };


  /**
   * Returns the current layer and sets it if argument layer is given.
   *
   * @cat Document
   * @subcat InDesign Model
   * @method layer
   * @param  {Layer|String} [layer] The layer or layer name to set the current layer to
   * @return {Layer} The current layer instance
   */
  pub.layer = function(layer) {
    if (layer instanceof Layer) {
      currLayer = layer;
    } else if (typeof layer === 'string') {
      var layers = currentDoc().layers;
      currLayer = layers.item(layer);
      if (!currLayer.isValid) {
        currLayer = layers.add({name: layer});
      }
    }
    return currentLayer();
  };

  /**
   * Sets the units of the document (like right clicking the rulers).
   *
   * @cat Document
   * @method units
   * @param  {Constant} [units] Supported units: PT, PX, CM, MM or IN
   * @return {Constant} Current unit setting
   */
  pub.units = function (units) {
    if (arguments.length === 0) return currUnits;

    if (units === pub.CM ||
        units === pub.MM ||
        units === pub.PT ||
        units === pub.PX ||
        units === pub.IN) {
      var unitType = null;
      if      (units === pub.CM) unitType = MeasurementUnits.centimeters;
      else if (units === pub.MM) unitType = MeasurementUnits.millimeters;
      else if (units === pub.PT) unitType = MeasurementUnits.points;
      else if (units === pub.PX) unitType = MeasurementUnits.pixels;
      else if (units === pub.IN) unitType = MeasurementUnits.inches;
      var doc = currentDoc();
      with (doc.viewPreferences){
        //* MeasurementUnits.agates
        //* MeasurementUnits.picas
        //* MeasurementUnits.points
        //* MeasurementUnits.inches
        //* MeasurementUnits.inchesDecimal
        //* MeasurementUnits.millimeters
        //* MeasurementUnits.centimeters
        //* MeasurementUnits.ciceros
        horizontalMeasurementUnits = unitType;
        verticalMeasurementUnits = unitType;
      }
      currUnits = units;
      updatePublicPageSizeVars();
    } else {
      error("Not supported unit");
    }
    return currUnits;
  };

  /**
   * Creates a vertical guide line at the current spread and current layer.
   *
   * @cat Document
   * @subcat InDesign Model
   * @method guideX
   * @param  {Number} x Position of the new guide
   * @return {Guide} New guide
   */
  pub.guideX = function (x) {
    var guides = currentPage().guides;
    var guide = guides.add( currentLayer() );
    with (guide) {
      fitToPage = true;
      orientation = HorizontalOrVertical.VERTICAL;
      location = x;
    }
    return guide;
  };

  /**
   * Creates a horizontal guide line at the current spread and current layer.
   *
   * @cat Document
   * @subcat InDesign Model
   * @method guideY
   * @param  {Number} y Position of the new guide
   * @return {Guide} New guide
   */
  pub.guideY = function (y) {
    var guides = currentPage().guides;
    var guide = guides.add( currentLayer() );
    with (guide) {
      fitToPage = true;
      orientation = HorizontalOrVertical.HORIZONTAL;
      location = y;
    }
    return guide;
  };


  // ----------------------------------------
  // Data
  

  pub.JSON = {
    /*
     * Function parses and validates a string as JSON-object. Usage:
     * var obj = b.JSON.decode(str);
     * var str = b.JSON.encode(obj);
     * 
     * @cat Data
     * @subcat Input
     * @method JSON.decode
     * @param  {String} String to be parsed as JSON-object.
     * @return {Object} Returns JSON-object or throws an error if invalid JSON has been provided.
    */
    // From: jQuery JavaScript Library v1.7.1 http://jquery.com/
    decode: function( data ) {
      if ( typeof data !== "string" || !data ) {
        return null;
      }
      var rvalidchars = /^[\],:{}\s]*$/,
        rvalidescape = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,
        rvalidtokens = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
        rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g;

      // Make sure the incoming data is actual JSON
      // Logic borrowed from http://json.org/json2.js
      if ( rvalidchars.test( data.replace( rvalidescape, "@" )
        .replace( rvalidtokens, "]" )
        .replace( rvalidbraces, "")) ) {
        return ( new Function( "return " + data ) )();
      }
      error( "Invalid JSON: " + data );
    },
    /**
     * Function convert an javascript object to a JSON-string. Usage:
     * var str = b.JSON.encode(obj);
     * var obj = b.JSON.decode(str);
     *
     * @cat Data
     * @subcat Output
     * @method JSON.encode
     * @param  {Object} Object to be converted to a JSON-string
     * @return {String} Returns JSON-string
     */
    // From: https://gist.github.com/754454
    encode: function(obj) {
      var t = typeof (obj);
      if (t !== "object" || obj === null) {
        // simple data type
        if (t === "string") obj = '"' + obj + '"';
        return String(obj);
      } else {
        // recurse array or object
        var n, v, json = [], arr = (obj && obj.constructor === Array);

        for (n in obj) {
          v = obj[n];
          t = typeof(v);
          if (obj.hasOwnProperty(n)) {
            if (t === "string") v = '"' + v + '"'; else if (t === "object" && v !== null) v = pub.JSON.encode(v);
            json.push((arr ? "" : '"' + n + '":') + String(v));
          }
        }
        return (arr ? "[" : "{") + String(json) + (arr ? "]" : "}");
      }
    }
  };

  // -- Conversion --
  
  /**  @class b */

  /**
   * Converts a byte, char, int, or color to a String containing the
   * equivalent binary notation. For example color(0, 102, 153, 255) 
   * will convert to the String "11111111000000000110011010011001". This 
   * function can help make your geeky debugging sessions much happier.
   *
   
   * @cat Data
   * @subcat Conversion
   * @method binary
   * @param {Number} num value to convert
   * @param {Number} [numBits] number of digits to return
   * @return {String} A formatted string
   */
   // From: http://processingjs.org/reference/binary_/
  pub.binary = function(num, numBits) {
    var bit;
    if (numBits > 0) bit = numBits;
    else if (num instanceof Char) {
      bit = 16;
      num |= 0;
    } else {
      bit = 32;
      while (bit > 1 && !(num >>> bit - 1 & 1)) bit--;
    }
    var result = "";
    while (bit > 0) result += num >>> --bit & 1 ? "1" : "0";
    return result;
  };

  /** 
   * Converts a String representation of a binary number to its 
   * equivalent integer value. For example, unbinary("00001000") will 
   * return 8.
   *
   * @cat Data
   * @subcat Conversion
   * @method unbinary
   * @param {String} binaryString value to convert
   * @return {Number} The integer representation
   */
   // From: http://processingjs.org/reference/unbinary_/
  pub.unbinary = function(binaryString) {
    var i = binaryString.length - 1,
      mask = 1,
      result = 0;
    while (i >= 0) {
      var ch = binaryString[i--];
      if (ch !== "0" && ch !== "1") throw "the value passed into unbinary was not an 8 bit binary number";
      if (ch === "1") result += mask;
      mask <<= 1;
    }
    return result;
  };


  var decimalToHex = function(d, padding) {
    padding = padding === undef || padding === null ? padding = 8 : padding;
    if (d < 0) d = 4294967295 + d + 1;
    var hex = Number(d).toString(16).toUpperCase();
    while (hex.length < padding) hex = "0" + hex;
    if (hex.length >= padding) hex = hex.substring(hex.length - padding, hex.length);
    return hex;
  };

  /**
   * Convert a number to a hex representation. 
   *
   * @cat Data
   * @subcat Conversion
   * @method hex
   * @param {Number} value The number to convert
   * @param {Number} [len] The length of the hex number to be created, default: 8
   * @return {String} The hex representation as a string
   */
  pub.hex = function(value, len) {
    if (arguments.length === 1) len = 8;
    return decimalToHex(value, len);
  };

  var unhexScalar = function(hex) {
    var value = parseInt("0x" + hex, 16);
    if (value > 2147483647) value -= 4294967296;
    return value;
  }

  /**
   * Convert a hex representation to a number.
   *
   * @cat Data
   * @subcat Conversion
   * @method unhex
   * @param {String} hex The hex representation
   * @return {Number} The number
   */
  pub.unhex = function(hex) {
    if (hex instanceof Array) {
      var arr = [];
      for (var i = 0; i < hex.length; i++) arr.push(unhexScalar(hex[i]));
      return arr;
    }
    return unhexScalar(hex);
  };


  // -- String Functions --


  
  /**
   * Removes multiple, leading or trailing spaces and punctuation from "words". E.g. converts "word!" to "word". Especially useful together with b.words();
   * 
   * @method wordTrim
   * @cat Data
   * @subcat String Functions
   * @param {String} s The String to trim
   * @param
   */
   // from: http://www.qodo.co.uk/blog/javascript-trim-leading-and-trailing-spaces/
  pub.trimWord = function(s) { 
      s = s.replace(/(^[,.!?-]*)|([-,.!?]*$)/gi,"");
      s = s.replace(/\s*/gi,"");
  //    s = s.replace(/[ ]{2,}/gi," "); 
      s = s.replace(/\n*/,"");     
      return s;
  }  

  /**
   * Combines an array of Strings into one String, each separated by 
   * the character(s) used for the separator parameter. To join arrays 
   * of ints or floats, it's necessary to first convert them to strings 
   * using nf() or nfs().
   *
   * @method join
   * @cat Data
   * @subcat String Functions
   * @param {Array} array A string array
   * @param {String} separator The separator to be inserted
   * @return {String} The joined string
   */
   // http://processingjs.org/reference/join_/
  pub.join = function(array, separator) {
    return array.join(separator);
  };

  /**
   * The split() function breaks a string into pieces using a
   * character or string as the divider. The delim parameter specifies the
   * character or characters that mark the boundaries between each piece. A
   * String[] array is returned that contains each of the pieces.
   *
   * If the result is a set of numbers, you can convert the String[] array
   * to to a float[] or int[] array using the datatype conversion functions
   * int() and float() (see example above).
   *
   * The splitTokens() function works in a similar fashion, except that it
   * splits using a range of characters instead of a specific character or
   * sequence.    
   *  
   * @cat Data
   * @subcat String Functions
   * @method split
   * @param {String} str the String to be split
   * @param {String} [delim] The string used to separate the data
   * @return {Array} Array of strings
   */
   // http://processingjs.org/reference/split_/
  pub.split = function(str, delim) {     
    return str.split(delim);   
  };

  /**
   * The splitTokens() function splits a String at one or many character 
   * "tokens." The tokens parameter specifies the character or characters 
   * to be used as a boundary.
   *
   * If no tokens character is specified, any whitespace character is used 
   * to split. Whitespace characters include tab (\t), line feed (\n), 
   * carriage return (\r), form feed (\f), and space. To convert a String 
   * to an array of integers or floats, use the datatype conversion functions 
   * int() and float() to convert the array of Strings.
   *  
   * @cat Data
   * @subcat String Functions
   * @method splitTokens
   * @param {String} str the String to be split
   * @param {String} [tokens] list of individual characters that will be used as separators
   * @return {Array} Array of strings
   */
   // From: http://processingjs.org/reference/splitTokens_/
  pub.splitTokens = function(str, tokens) {
    if (arguments.length === 1) tokens = "\n\t\r\u000c ";
    tokens = "[" + tokens + "]";
    var ary = [];
    var index = 0;
    var pos = str.search(tokens);
    while (pos >= 0) {
      if (pos === 0) str = str.substring(1);
      else {
        ary[index] = str.substring(0, pos);
        index++;
        str = str.substring(pos);
      }
      pos = str.search(tokens);
    }
    if (str.length > 0) ary[index] = str;
    if (ary.length === 0) ary = undef;
    return ary;
  };  

  /* todo */
  pub.match = function(str, regexp) {
    return str.match(regexp);
  };

  /* todo */
  pub.matchAll = function(aString, aRegExp) {
    var results = [],
      latest;
    var regexp = new RegExp(aRegExp, "g");
    while ((latest = regexp.exec(aString)) !== null) {
      results.push(latest);
      if (latest[0].length === 0)++regexp.lastIndex;
    }
    return results.length > 0 ? results : null;
  };

  function nfCoreScalar(value, plus, minus, leftDigits, rightDigits, group) {
    var sign = value < 0 ? minus : plus;
    var autoDetectDecimals = rightDigits === 0;
    var rightDigitsOfDefault = rightDigits === undef || rightDigits < 0 ? 0 : rightDigits;
    var absValue = Math.abs(value);
    if (autoDetectDecimals) {
      rightDigitsOfDefault = 1;
      absValue *= 10;
      while (Math.abs(Math.round(absValue) - absValue) > 1.0E-6 && rightDigitsOfDefault < 7) {
        ++rightDigitsOfDefault;
        absValue *= 10;
      }
    } else if (rightDigitsOfDefault !== 0) absValue *= Math.pow(10, rightDigitsOfDefault);
    var number, doubled = absValue * 2;
    if (Math.floor(absValue) === absValue) number = absValue;
    else if (Math.floor(doubled) === doubled) {
      var floored = Math.floor(absValue);
      number = floored + floored % 2;
    } else number = Math.round(absValue);
    var buffer = "";
    var totalDigits = leftDigits + rightDigitsOfDefault;
    while (totalDigits > 0 || number > 0) {
      totalDigits--;
      buffer = "" + number % 10 + buffer;
      number = Math.floor(number / 10);
    }
    if (group !== undef) {
      var i = buffer.length - 3 - rightDigitsOfDefault;
      while (i > 0) {
        buffer = buffer.substring(0, i) + group + buffer.substring(i);
        i -= 3;
      }
    }
    if (rightDigitsOfDefault > 0) return sign + buffer.substring(0, buffer.length - rightDigitsOfDefault) + "." + buffer.substring(buffer.length - rightDigitsOfDefault, buffer.length);
    return sign + buffer;
  }
  function nfCore(value, plus, minus, leftDigits, rightDigits, group) {
    if (value instanceof Array) {
      var arr = [];
      for (var i = 0, len = value.length; i < len; i++) arr.push(nfCoreScalar(value[i], plus, minus, leftDigits, rightDigits, group));
      return arr;
    }
    return nfCoreScalar(value, plus, minus, leftDigits, rightDigits, group);
  }

  /**    
   * Utility function for formatting numbers into strings. There
   * are two versions, one for formatting floats and one for formatting
   * ints. The values for the digits, left, and right parameters should
   * always be positive integers.

   * As shown in the above example, nf() is used to add zeros to the
   * left and/or right of a number. This is typically for aligning a list
   * of numbers. To remove digits from a floating-point number, use the
   * int(), ceil(), floor(), or round() functions.    
   * 
   * @cat Data
   * @subcat String Functions
   * @method nf
   * @param {Number} value The Number to convert
   * @param {Number} leftDigits
   * @param {Number} rightDigits   
   * @return {String} The formatted string
   */
   // From: http://processingjs.org/reference/nf_/
  pub.nf = function(value, leftDigits, rightDigits) {
    return nfCore(value, "", "-", leftDigits, rightDigits);
  };

  /**    
   * Utility function for formatting numbers into strings. Similar to nf() 
   * but leaves a blank space in front of positive numbers so they align 
   * with negative numbers in spite of the minus symbol. There are two 
   * versions, one for formatting floats and one for formatting ints. The 
   * values for the digits, left, and right parameters should always be 
   * positive integers.   
   * 
   * @cat Data
   * @subcat String Functions
   * @method nfs
   * @param {Number} value The Number to convert
   * @param {Number} leftDigits
   * @param {Number} rightDigits   
   * @return {String} The formatted string
   */
   // From: http://processingjs.org/reference/nfs_/
  pub.nfs = function(value, leftDigits, rightDigits) {
    return nfCore(value, " ", "-", leftDigits, rightDigits);
  };
  
  /**    
   * Utility function for formatting numbers into strings. Similar to nf() 
   * but puts a "+" in front of positive numbers and a "-" in front of 
   * negative numbers. There are two versions, one for formatting floats 
   * and one for formatting ints. The values for the digits, left, and right 
   * parameters should always be positive integers.      
   * 
   * @cat Data
   * @subcat String Functions
   * @method nfp
   * @param {Number} value The Number to convert
   * @param {Number} leftDigits
   * @param {Number} rightDigits   
   * @return {String} The formatted string
   */
   // From: http://processingjs.org/reference/nfp_/
  pub.nfp = function(value, leftDigits, rightDigits) {
    return nfCore(value, "+", "-", leftDigits, rightDigits);
  };

  /**    
   * Utility function for formatting numbers into strings and placing 
   * appropriate commas to mark units of 1000. There are two versions, one 
   * for formatting ints and one for formatting an array of ints. The value 
   * for the digits parameter should always be a positive integer.     
   * 
   * @cat Data
   * @subcat String Functions
   * @method nfc
   * @param {Number} value The Number to convert
   * @param {Number} leftDigits
   * @param {Number} rightDigits   
   * @return {String} The formatted string
   */
   // From: http://processingjs.org/reference/nfc_/
  pub.nfc = function(value, leftDigits, rightDigits) {
    return nfCore(value, "", "-", leftDigits, rightDigits, ",");
  };


  /**    
   * Removes whitespace characters from the beginning and end of a String. 
   * In addition to standard whitespace characters such as space, carriage 
   * return, and tab, this function also removes the Unicode "nbsp" character.    
   * 
   * @cat Data
   * @subcat String Functions
   * @method trim
   * @param {String|Array} str A string or an array of strings to be trimmed
   * @return {String|Array} Returns the input in a trimmed way
   */
   // From: http://processingjs.org/reference/trim_/
  pub.trim = function(str) {
    if (str instanceof Array) {
      var arr = [];
      for (var i = 0; i < str.length; i++) arr.push(str[i].replace(/^\s*/, "").replace(/\s*$/, "").replace(/\r*$/, ""));
      return arr;
    }
    return str.replace(/^\s*/, "").replace(/\s*$/, "").replace(/\r*$/, "");
  };

  // ----------------------------------------
  // Shape
  
  /**
   * Draws an ellipse (oval) in the display window. An ellipse with an equal <b>width</b> and <b>height</b> is a circle.
   * The first two parameters set the location, the third sets the width, and the fourth sets the height.
   *
   * @cat Document
   * @subcat Primitives
   * @method ellipse
   * @param  {Number} x Location X
   * @param  {Number} y Location Y
   * @param  {Number} w Width
   * @param  {Number} h Height
   * @return {Oval} New oval (n.b. in Adobe Scripting the corresponding type is Oval, not Ellipse)
   */
  pub.ellipse = function(x, y, w, h){
    if (arguments.length !== 4) error("Not enough parameters to draw a ellipse! Use: x, y, w, h");
    var ellipseBounds = [];
    if (currEllipseMode === pub.CORNER) {
      ellipseBounds[0] = y;
      ellipseBounds[1] = x;
      ellipseBounds[2] = (y+h);
      ellipseBounds[3] = (x+w);
    } else if (currEllipseMode === pub.CORNERS) {
      ellipseBounds[0] = y;
      ellipseBounds[1] = x;
      ellipseBounds[2] = h;
      ellipseBounds[3] = w;
    } else if (currEllipseMode === pub.CENTER) {
      ellipseBounds[0] = y-(h/2);
      ellipseBounds[1] = x-(w/2);
      ellipseBounds[2] = (y+h)-(h/2);
      ellipseBounds[3] = (x+w)-(w/2);
    } else if (currEllipseMode === pub.RADIUS) {
      ellipseBounds[0] = y-(h);
      ellipseBounds[1] = x-(w);
      ellipseBounds[2] = y+(h);
      ellipseBounds[3] = x+(w);
    }

	if(w === 0 || h === 0)
		return false;

    var ovals = currentPage().ovals;
    var newOval = ovals.add( currentLayer() );
    with (newOval) {
      strokeWeight = currStrokeWeight;
      strokeTint = currStrokeTint;
      fillColor = currFillColor;
      fillTint = currFillTint;
      strokeColor = currStrokeColor;
      geometricBounds = ellipseBounds;
    }

    if (currEllipseMode === pub.CENTER || currEllipseMode === pub.RADIUS) {
      newOval.transform(CoordinateSpaces.PASTEBOARD_COORDINATES,
                         AnchorPoint.CENTER_ANCHOR,
                         currMatrix.adobeMatrix() );
    } else {
      newOval.transform(CoordinateSpaces.PASTEBOARD_COORDINATES,
                     AnchorPoint.TOP_LEFT_ANCHOR,
                     currMatrix.adobeMatrix() );
    }
    return newOval;
  };

  /**
   * Draws a line (a direct path between two points) to the page.
   *
   * @cat Document
   * @subcat Primitives
   * @method line
   * @param  {Number} x1 Point A x-value
   * @param  {Number} y1 Point A y-value
   * @param  {Number} x2 Point B x-value
   * @param  {Number} y2 Point B y-value
   * @return {GraphicLine} New GraphicLine
   */
  pub.line = function(x1, y1, x2, y2) {
    if (arguments.length !== 4) error("Not enough parameters to draw a line! Use: x1, y1, x2, y2");
    var lines = currentPage().graphicLines;
    var newLine = lines.add( currentLayer() );
    with (newLine) {
      strokeWeight = currStrokeWeight;
      strokeTint = currStrokeTint;
      fillColor = currFillColor;
      fillTint = currFillTint;
      strokeColor = currStrokeColor;
    }
    newLine.paths.item(0).entirePath = [[x1, y1], [x2, y2]];
    newLine.transform(CoordinateSpaces.PASTEBOARD_COORDINATES,
                     AnchorPoint.TOP_LEFT_ANCHOR,
                     currMatrix.adobeMatrix() );
    return newLine;
  };

  /**
   * Draws a rectangle to the page.
   *
   * @cat Document
   * @subcat Primitives
   * @method rect
   * @param  {Number} x Position X
   * @param  {Number} y Position Y
   * @param  {Number} w Width
   * @param  {Number} h Height
   * @return {Rectangle} New rectangle
   */
  pub.rect = function(x, y, w, h){
    if (arguments.length !== 4) error("Not enough parameters to draw a rect! Use: x, y, w, h");
    var rectBounds = [];
    if (currRectMode === pub.CORNER) {
      rectBounds[0] = y;
      rectBounds[1] = x;
      rectBounds[2] = (y+h);
      rectBounds[3] = (x+w);
    } else if (currRectMode === pub.CORNERS) {
      rectBounds[0] = y;
      rectBounds[1] = x;
      rectBounds[2] = h;
      rectBounds[3] = w;
    } else if (currRectMode === pub.CENTER) {
      rectBounds[0] = y-(h/2);
      rectBounds[1] = x-(w/2);
      rectBounds[2] = (y+h)-(h/2);
      rectBounds[3] = (x+w)-(w/2);
    }

	if(w === 0 || h === 0)
		return false;
    
    var newRect = currentPage().rectangles.add( currentLayer() );
    with (newRect) {
      geometricBounds = rectBounds;
      strokeWeight = currStrokeWeight;
      strokeTint = currStrokeTint;
      fillColor = currFillColor;
      fillTint = currFillTint;
      strokeColor = currStrokeColor;
    }

    if (currRectMode === pub.CENTER) {
      newRect.transform(CoordinateSpaces.PASTEBOARD_COORDINATES,
                         AnchorPoint.CENTER_ANCHOR,
                         currMatrix.adobeMatrix() );
    } else {
      newRect.transform(CoordinateSpaces.PASTEBOARD_COORDINATES,
                     AnchorPoint.TOP_LEFT_ANCHOR,
                     currMatrix.adobeMatrix() );
    }
    return newRect;
  };


  // -- Attributes --

  /**
   * Modifies the location from which rectangles draw. The default mode is 
   * rectMode(CORNER), which specifies the location to be the upper left 
   * corner of the shape and uses the third and fourth parameters of rect() 
   * to specify the width and height. The syntax rectMode(CORNERS) uses the 
   * first and second parameters of rect() to set the location of one corner 
   * and uses the third and fourth parameters to set the opposite corner. 
   * The syntax rectMode(CENTER) draws the image from its center point and 
   * uses the third and forth parameters of rect() to specify the image's 
   * width and height. The syntax rectMode(RADIUS) draws the image from its 
   * center point and uses the third and forth parameters of rect() to specify 
   * half of the image's width and height. The parameter must be written in 
   * "ALL CAPS".
   *
   * @cat Document
   * @subcat Attributes
   * @method rectMode
   * @param {String} mode Either b.CORNER, b.CORNERS, b.CENTER, or b.RADIUS
   * 
   */
  pub.rectMode = function (mode) {
    if (arguments.length === 0) return currRectMode;
    if (mode === pub.CORNER || mode === pub.CORNERS || mode === pub.CENTER ) {
      currRectMode = mode;
      return currRectMode;
    } else {
      error("Unsupported rectMode. Use: CORNER, CORNERS, CENTER.");
    }
  };

  /**
   * The origin of the ellipse is modified by the ellipseMode() function. 
   * The default configuration is ellipseMode(CENTER), which specifies the 
   * location of the ellipse as the center of the shape. The RADIUS mode is 
   * the same, but the width and height parameters to ellipse() specify the 
   * radius of the ellipse, rather than the diameter. The CORNER mode draws 
   * the shape from the upper-left corner of its bounding box. The CORNERS 
   * mode uses the four parameters to ellipse() to set two opposing corners 
   * of the ellipse's bounding box. The parameter must be written in "ALL CAPS".
   *
   * @cat Document
   * @subcat Attributes
   * @method ellipseMode
   * @param {String} mode Either b.CENTER, b.RADIUS, b.CORNER, or b.CORNERS
   */ 
  pub.ellipseMode = function (mode) {
    if (arguments.length === 0) return currEllipseMode;
    if (mode === pub.CORNER || mode === pub.CORNERS || mode === pub.CENTER || mode === pub.RADIUS ) {
      currEllipseMode = mode;
      return currEllipseMode;
    } else {
      error("Unsupported ellipseMode. Use: CENTER, RADIUS, CORNER, CORNERS.");
    }
  };

  
  /**
   * Sets the width of the stroke used for lines and the border 
   * around shapes. 
   * 
   * @cat Document
   * @subcat Attributes
   * @method strokeWeight
   * @param {Number} weight The width of the stroke
   */
  pub.strokeWeight = function (weight) {
    if (typeof weight === 'string' || typeof weight === 'number') {
      currStrokeWeight = weight;
    } else {
      error("Not supported type. Please make sure the strokeweight is a number or string");
    }
  };

  /**
   * Returns the object style with the given name. If the style does not exist it gets created.
   *
   * @cat Typography
   * @method objectStyle
   * @param  {String} name  The name of the object style to return.
   * @return {ObjectStyle}  The object style instance.
   */
  pub.objectStyle = function(name) {
    var style = null;
    try {
      style = currentDoc().objectStyles.item(name);
      style.name;
    } catch (e) {
      style = currentDoc().objectStyles.add({name: name});
    }
    return style;
  };
  


  // ----------------------------------------
  // Color
  
  /**
   * Sets the color used to fill shapes.
   * @cat Color
   * @method fill
   * @param  {Color|Swatch|Numbers} fillColor  Accepts a Color/swatch or a string with the name of a color. Or values: C,M,Y,K / R,G,B / Grey
   */
  pub.fill = function (fillColor) {
    if (fillColor instanceof Color || fillColor instanceof Swatch) {
      currFillColor = fillColor;
    } else {
      if (arguments.length === 1) {
        currFillColor = pub.color(arguments[0]);
      } else if (arguments.length === 2) {
        currFillColor = pub.color(arguments[0],arguments[1]);
      } else if (arguments.length === 3) {
        currFillColor = pub.color(arguments[0],arguments[1],arguments[2]);
      } else if (arguments.length === 4) {
        currFillColor = pub.color(arguments[0],arguments[1],arguments[2],arguments[3]);
      } else if (arguments.length === 5) {
        currFillColor = pub.color(arguments[0],arguments[1],arguments[2],arguments[3],arguments[4]);
      } else {
        error("Wrong parameters. Use: "
          + "R,G,B,name or "
          + "C,M,Y,K,name. "
          + "Grey,name "
          + "Name is optional");
      }
    }
  };

  /**
   * Disables filling geometry. If both noStroke() and noFill() are called, 
   * newly drawn shapes will be invisible.
   *
   * @cat Color
   * @method noFill
   */
  pub.noFill = function () {
    currFillColor = noneSwatchColor;
  };

  /**
   * Sets the color used to draw lines and borders around shapes.
   * @cat Color
   * @method stroke
   * @param  {Color|Swatch|Numbers} strokeColor  Accepts a Color/swatch or a string with the name of a color. Or values: C,M,Y,K / R,G,B / Grey
   */
  pub.stroke = function (strokeColor) {
    if (strokeColor instanceof Color || strokeColor instanceof Swatch) {
      currStrokeColor = strokeColor;
    } else {
      if (arguments.length === 1) {
        currStrokeColor = pub.color(arguments[0]);
      } else if (arguments.length === 2) {
        currStrokeColor = pub.color(arguments[0],arguments[1]);
      } else if (arguments.length === 3) {
        currStrokeColor = pub.color(arguments[0],arguments[1],arguments[2]);
      } else if (arguments.length === 4) {
        currStrokeColor = pub.color(arguments[0],arguments[1],arguments[2],arguments[3]);
      } else if (arguments.length === 5) {
        currStrokeColor = pub.color(arguments[0],arguments[1],arguments[2],arguments[3],arguments[4]);
      } else {
        error("Wrong parameters. Use: "
          + "R,G,B,name or "
          + "C,M,Y,K,name. "
          + "Grey,name "
          + "Name is optional");
      }
    }
  };

  /**
   * Disables drawing the stroke (outline). If both noStroke() and noFill() 
   * are called, nothing will be drawn to the screen.
   * 
   * @cat Color
   * @method noStroke
   */
  pub.noStroke = function () {
    currStrokeColor = noneSwatchColor;
  };

  /**
   * Sets the tint of the color used to fill shapes.
   * 
   * @cat Color
   * @method fillTint
   * @param  {Number} tint Number from 0 to 100
   */
  pub.fillTint = function (tint) {
    if (typeof tint === 'string' || typeof tint === 'number') {
      currFillTint = tint;
    } else {
      error("Not supported type. Please make sure the strokeweight is a number or string");
    }
  };

  /**
   * Sets the tint of the color used to draw lines and borders around shapes.
   * 
   * @cat Color
   * @method strokeTint
   * @param  {Number} tint Number from 0 to 100
   */
  pub.strokeTint = function (tint) {
    if (typeof tint === 'string' || typeof tint === 'number') {
      currStrokeTint = tint;
    } else {
      error("Not supported type. Please make sure the strokeweight is a number or string");
    }
  };

  /**
   * Creates a new RGB or CMYK color and adds the new color to the document, or gets a color by name from the document
   *
   * @cat Color
   * @method color
   * @param  {String|Numbers} Get color: the color name. Create new color: R,G,B,name or C,M,Y,K,name or Grey,name. Name is always optional
   * @return {Color} found or new color
   */
  pub.color = function() {
    var newCol = null;
    var props = {};
    var a = arguments[0],
        b = arguments[1],
        c = arguments[2],
        d = arguments[3],
        e = arguments[4];
    if (arguments.length === 1) {
      if (typeof a === 'string') {
        try {
          newCol = currentDoc().swatches.item(a);
          newCol.name;
        } catch (e) {
          error("Color doesn't exist. "+e);
        }
        return newCol;
      } else if (typeof a === 'number') {
        props.model = ColorModel.PROCESS;
        props.space = ColorSpace.CMYK;
        props.colorValue = [0,0,0,a];
        props.name = "C="+0+" M="+0+" Y="+0+" K="+a;
      } else {
        error("Color doesn't exist.");
      }

    } else if (arguments.length === 2) {
      props.model = ColorModel.PROCESS;
      props.space = ColorSpace.CMYK;
      props.colorValue = [0,0,0,a];
      props.name = b;

    } else if (arguments.length === 3) {
      props.model = ColorModel.PROCESS;
      props.space = ColorSpace.RGB;
      props.colorValue = [a,b,c];
      props.name = "R="+a+" G="+b+" B="+c;

    } else if (arguments.length === 4) {
      if (typeof d === 'string') {
        props.model = ColorModel.PROCESS;
        props.space = ColorSpace.RGB;
        props.colorValue = [a,b,c];
        props.name = d;
      } else {
        props.model = ColorModel.PROCESS;
        props.space = ColorSpace.CMYK;
        props.colorValue = [a,b,c,d];
        props.name = "C="+a+" M="+b+" Y="+c+" K="+d;
      }

    } else if (arguments.length === 5) {
      props.model = ColorModel.PROCESS;
      props.space = ColorSpace.CMYK;
      props.colorValue = [a,b,c,d];
      props.name = e;

    } else {
      error("Wrong parameters. Use: "
        + "R,G,B,name or "
        + "C,M,Y,K,name. "
        + "Grey,name "
        + "Name is optional");
    }

    // check whether color was already created and added to swatches,
    // keeps the document clean ...
    try {
      var col = currentDoc().swatches.item(props.name);
      col.name;
      col.properties = props;
      return col;
    } catch (e) {
      newCol = currentDoc().colors.add();
      newCol.properties = props;
      return newCol;
    }
  };

  /**
   * Calculates a color or colors between two color at a specific increment. 
   * The amt parameter is the amount to interpolate between the two values where 0.0 equal to the first point, 0.1 is very near the first point, 0.5 is half-way in between, etc.
   * N.B.: Both color must be either CMYK or RGB.
   * 
   * @cat Color
   * @method lerpColor
   * @param  {Color} c1   Input color 1
   * @param  {Color} c2   Input color 2
   * @param  {Number} amt The Amount to interpolate between the two colors
   * @return {Color} Interpolated color
   */
  pub.lerpColor = function (c1, c2, amt) {
    if (c1 instanceof Color && c2 instanceof Color && typeof amt === 'number') {
      if (c1.space === ColorSpace.CMYK && c2.space === ColorSpace.CMYK) {
        var C1 = c1.colorValue[0];
        var M1 = c1.colorValue[1];
        var Y1 = c1.colorValue[2];
        var K1 = c1.colorValue[3];

        var C2 = c2.colorValue[0];
        var M2 = c2.colorValue[1];
        var Y2 = c2.colorValue[2];
        var K2 = c2.colorValue[3];

        var COut = Math.round( pub.lerp(C1,C2,amt) );
        var MOut = Math.round( pub.lerp(M1,M2,amt) );
        var YOut = Math.round( pub.lerp(Y1,Y2,amt) );
        var KOut = Math.round( pub.lerp(K1,K2,amt) );
        return pub.color(COut,MOut,YOut,KOut);

      } else if (c1.space === ColorSpace.RGB && c2.space === ColorSpace.RGB) {
        var R1 = c1.colorValue[0];
        var G1 = c1.colorValue[1];
        var B1 = c1.colorValue[2];

        var R2 = c2.colorValue[0];
        var G2 = c2.colorValue[1];
        var B2 = c2.colorValue[2];

        var ROut = Math.round( pub.lerp(R1,R2,amt) );
        var GOut = Math.round( pub.lerp(G1,G2,amt) );
        var BOut = Math.round( pub.lerp(B1,B2,amt) );
        warning([ROut,GOut,BOut]);
        return pub.color(ROut,GOut,BOut);

      } else {
        error("Both color must be either CMYK or RGB.");
      }
    } else {
      error("Wrong parameters. Use: two colors (of the same type) and a number.");
    }
  };

  
  // ----------------------------------------
  // Typography
  
  /**
   * Creates a text frame on the current layer on the current page in the current document. 
   * The text frame gets created in the position specified by the x and y parameters.
   * The default document font will be used unless a font is set with the textFont() function. 
   * The default document font size will be used unless a font size is set with the textSize() function. 
   * Change the color of the text with the fill() function.
   * The text displays in relation to the textAlign() and textYAlign() functions. 
   * The width and height parameters define a rectangular area.
   * 
   * @cat Typography
   * @method text
   * @param  {String} txt The text content to set in the text frame.
   * @param  {Number} x   x-coordinate of text frame
   * @param  {Number} y   y-coordinate of text frame
   * @param  {Number} w   width of text frame
   * @param  {Number} h   height of text frame
   * @return {TextFrame}  The created text frame instance
   */
  pub.text = function(txt, x, y, w, h) {
    if (arguments.length !== 5) error("Not enough parameters to draw a text! Use: txt, x, y, w, h");
    var textFrame = currentPage().textFrames.add( currentLayer() );
    with (textFrame) {
      contents = txt;
      geometricBounds = [y, x, (y+h), (x+w)];
      textFramePreferences.verticalJustification = currYAlign;
    }
    pub.typo(textFrame, {
      'appliedFont': currFont,
      'pointSize': currFontSize,
      'fillColor': currFillColor,
      'justification': currAlign,
      'leading': currLeading,
      'kerningValue': currKerning,
      'tracking': currTracking
    });

    
    if (currAlign === Justification.CENTER_ALIGN || currAlign === Justification.CENTER_JUSTIFIED) {
      textFrame.transform(CoordinateSpaces.PASTEBOARD_COORDINATES,
                         AnchorPoint.CENTER_ANCHOR,
                         currMatrix.adobeMatrix() );
    } else {
      textFrame.transform(CoordinateSpaces.PASTEBOARD_COORDINATES,
                     AnchorPoint.TOP_LEFT_ANCHOR,
                     currMatrix.adobeMatrix() );
    }

    return textFrame;
  };

  /**
   * Sets text properties to the given item. If the item is not an instance the text property can be set to,
   * the property gets set to the direct descendants of the given item, e.g. all stories of a given document.
   *
   * If no value is given and the given property is a string, the function acts as a getter and returns the
   * corresponding value(s) in an array. This can either be an array containing the value of the concrete item
   * (e.g. character) the values of the item's descendants (e.g. paragraphs of given text frame).
   *
   * @cat Typography
   * @method typo
   * @param  {Document|Spread|Page|Layer|Story|TextFrame|Text} item  The object to apply the property to.
   * @param  {String|Object} property  The text property name or an object of key/value property/value pairs.
   *                                   If property is a string and no value is given, the function acts as getter.
   * @param  {String|Number|Object} [value]  The value to apply to the property.
   * @return {String[]|Number[]|Object[]}  The property value(s) if the function acts as getter or the items the property
   *                                       was assigned to.
   */
  pub.typo = function(item, property, value) {
    var result = [],
      actsAsGetter = typeof property === 'string' && (value === undef || value === null),
      getOrSetProperties = function(textItem) {
        if (actsAsGetter) {
          result.push(textItem[property]);
        } else {
          setProperties(textItem);
        }
      },
      setProperties = function(textItem) {
        if (typeof property === 'string') {
          result.push(textItem);
          setProperty(textItem, property, value);
        } else if (typeof property === 'object') {
          result.push(textItem);
          for (var prop in property) {
            setProperty(textItem, prop, property[prop]);
          }
        }
      },
      setProperty = function(textItem, prop, val) {
        textItem[prop] = val;
      };

    if (item instanceof Document ||
        item instanceof Spread ||
        item instanceof Page ||
        item instanceof Layer) {
      forEach(item.textFrames, function(textFrame) {
        pub.typo(textFrame, property, value);
      });
    } else if (item instanceof Story ||
               item instanceof TextFrame) {
      var paras = item.paragraphs;
      // loop backwards to prevent invalid object reference error when
      // start of para is overflown in "invisible" textFrame area after
      // applying prop to previous para(s)
      for (var i = paras.length - 1; i >= 0; i--) {
        getOrSetProperties(paras[i]);
      }
    } else if (isText(item)) {
      getOrSetProperties(item);
    }
    return result;
  };

  /**
   * Returns the current font and sets it if argument fontName is given.
   *
   * @cat Typography
   * @method textFont
   * @param  {String} [fontName] The name of the font to set e.g. Helvetica
   * @param  {String} [fontStyle] The Font style e.g. Bold
   * @return {String}            The name of the current font
   */
  pub.textFont = function(fontName, fontStyle) {
    if (arguments.length === 1) {
      currFont = fontName;
    }
    if (arguments.length === 2) {
      currFont = fontName+"\t"+fontStyle;
    }
    return currFont;
  };

  /**
   * Returns the current font size in points and sets it if argument pointSize is given.
   *
   * @cat Typography
   * @method textSize
   * @param  {Number} [pointSize] The size in points to set.
   * @return {Number}             The current point size.
   */
  pub.textSize = function(pointSize) {
    if (arguments.length === 1) {
      currFontSize = pointSize;
    }
    return currFontSize;
  };

  /**
   * Sets the current horizontal and vertical text alignment.
   *
   * @cat Typography
   * @method textAlign
   * @param  {String} align    The horizontal text alignment to set. Must be one of the InDesign Justification enum values:
   *                           Justification.AWAY_FROM_BINDING_SIDE
   *                           Justification.CENTER_ALIGN
   *                           Justification.CENTER_JUSTIFIED
   *                           Justification.FULLY_JUSTIFIED
   *                           Justification.LEFT_ALIGN
   *                           Justification.RIGHT_ALIGN
   *                           Justification.RIGHT_JUSTIFIED
   *                           Justification.TO_BINDING_SIDE
   * @param  {String} [yAlign] The vertical text alignment to set. Must be one of the InDesign VerticalJustification enum values:
   *                           VerticalJustification.BOTTOM_ALIGN
   *                           VerticalJustification.CENTER_ALIGN
   *                           VerticalJustification.JUSTIFY_ALIGN
   *                           VerticalJustification.TOP_ALIGN
   */
  pub.textAlign = function(align, yAlign) {
    currAlign = align;
    if (arguments.length === 2) currYAlign = yAlign;
  };

  /**
   * Returns the spacing between lines of text in units of points and sets it if argument leading is given.
   *
   * @cat Typography
   * @method textLeading
   * @param  {Number|String} [leading] The spacing between lines of text in units of points or the default Indesign enum
   *                                   value Leading.AUTO.
   * @return {Number|String}           The current leading.
   */
  pub.textLeading = function(leading) {
    if (arguments.length === 1) {
      currLeading = leading;
    }
    return currLeading;
  };

  /**
   * Returns the current kerning and sets it if argument kerning is given.
   *
   * @cat Typography
   * @method textKerning
   * @param  {Number} [kerning] The value to set.
   * @return {Number}           The current kerning.
   */
  pub.textKerning = function(kerning) {
    if (arguments.length === 1) {
      currKerning = kerning;
    }
    return currKerning;
  };

  /**
   * Returns the current tracking and sets it if argument tracking is given.
   *
   * @cat Typography
   * @method textTracking
   * @param  {Number} [tracking] The value to set.
   * @return {Number}            The current tracking.
   */
  pub.textTracking = function(tracking) {
    if (arguments.length === 1) {
      currTracking = tracking;
    }
    return currTracking;
  };

  /**
   * Returns the character style with the given name. If the style does not exist it gets created.
   *
   * @cat Typography
   * @method characterStyle
   * @param  {String} name      The name of the character style to return.
   * @return {CharachterStyle}  The character style instance.
   */
  pub.characterStyle = function(name) {
    var style = null;
    try {
      style = currentDoc().characterStyles.item(name);
      style.name;
    } catch (e) {
      style = currentDoc().characterStyles.add({name: name});
    }
    return style;
  };

  /**
   * Returns the paragraph style with the given name. If the style does not exist it gets created.
   *
   * @cat Typography
   * @method paragraphStyle
   * @param  {String} name     The name of the paragraph style to return.
   * @return {ParagraphStyle}  The paragraph style instance.
   */
  pub.paragraphStyle = function(name) {
    var style = null;
    try {
      style = currentDoc().paragraphStyles.item(name);
      style.name;
    } catch (e) {
      style = currentDoc().paragraphStyles.add({name: name});
    }
    return style;
  };

  /**
   * Links the stories of two textframes to one story. Text of first textframe overflows to second one.
   *
   * @cat Typography
   * @method linkTextFrames
   * @param  {TextFrame} textFrameA
   * @param  {TextFrame} textFrameB
   */
  pub.linkTextFrames = function (textFrameA, textFrameB) {
    if (textFrameA instanceof TextFrame && textFrameB instanceof TextFrame) {
      textFrameA.nextTextFrame = textFrameB;
    } else {
      error("Wrong type! linkTextFrames() needs two textFrame objects to link the stories. Use: textFrameA, textFrameB");
    }
  };


  // ----------------------------------------
  // Image
  
  /**
   * Adds an image to the document. If the image argument is given as a string the image file  must be in the document's
   * data directory which is in the same directory where the document is saved in. The image argument can also be a File
   * instance which can be placed even before the document was saved.
   * The second argument can either be the x position of the frame to create or an instance of a rectangle,
   * oval or polygon to place the image in.
   * If x and y positions are given and width and height are not given, the frame's size gets set to the original image size.
   *
   * @cat Image
   * @method image
   * @param  {String|File} img The image file name in the document's data directory or a File instance
   * @param  {Number|Rectangle|Oval|Polygon} x The x position on the current page or the item instance to place the image in
   * @param  {Number} [y] The y position on the current page. Ignored if x is not a number.
   * @param  {Number} [w] The width of the rectangle to add the image to. Ignored if x is not a number.
   * @param  {Number} [h] The height of the rectangle to add the image to. Ignored if x is not a number.
   * @return {Rectangle|Oval|Polygon} The item instance the image was placed in.
   */
  pub.image = function(img, x, y, w, h) {
    var file = initDataFile(img, true),
      frame = null,
      fitOptions = null,
      width = null,
      height = null;
    if (x instanceof Rectangle ||
        x instanceof Oval ||
        x instanceof Polygon) {
      frame = x;
    } else {
      width = 1;
      height = 1;
      if (currImageMode === pub.CORNERS) {
        width = w - x;
        height = h - y;
        fitOptions = FitOptions.contentToFrame;
      } else {
        if (w && h) {
          width = w;
          height = h;
          fitOptions = FitOptions.contentToFrame;
        } else {
          fitOptions = FitOptions.frameToContent;
        }
      }
      
      frame = currentPage().rectangles.add({
        geometricBounds:[y, x, y + height, x + width]
      });
    }
    
    frame.place(file);

    if (fitOptions) {
      frame.fit(fitOptions);
    }

    if (currImageMode === pub.CENTER) {
      var bounds = frame.geometricBounds;
      width = bounds[3] - bounds[1];
      height = bounds[2] - bounds[0];
      frame.move(null, [-(width / 2), -(height / 2)]);
      frame.transform(CoordinateSpaces.PASTEBOARD_COORDINATES,
                         AnchorPoint.CENTER_ANCHOR,
                         currMatrix.adobeMatrix() );
    } else {
      frame.transform(CoordinateSpaces.PASTEBOARD_COORDINATES,
                     AnchorPoint.TOP_LEFT_ANCHOR,
                     currMatrix.adobeMatrix() );
    }
    return frame;
  };

  /**
   * Transforms position and size of an image.
   * The image fit options are always "contentToFrame".
   *
   * @cat Image
   * @method transformImage
   * @param  {Graphic} img The image to transform
   * @param  {Number} x       New x
   * @param  {Number} y       New y
   * @param  {Number} width   New width
   * @param  {Number} height  New height
   */
  pub.transformImage = function(img, x, y, width, height) {
    if (img.hasOwnProperty("geometricBounds") && img.hasOwnProperty("fit")) {
      //[y1, x1, y2, x2]
      img.geometricBounds = [y,x,y+height,x+width];
      if (currImageMode === pub.CENTER) {
        img.move(null, [-(width / 2), -(height / 2)]);
      }
      img.fit( FitOptions.CENTER_CONTENT );
      img.fit( FitOptions.contentToFrame );
    } else {
      error("transformImage(). Wrong type! Use: img, x, y, width, height");
    }
  };

  /**
   * Modifies the location from which images draw. The default mode is imageMode(CORNER), which specifies the location to be the upper left corner and uses the fourth and fifth parameters of image() to set the image's width and height. The syntax imageMode(CORNERS) uses the second and third parameters of image() to set the location of one corner of the image and uses the fourth and fifth parameters to set the opposite corner. Use imageMode(CENTER) to draw images centered at the given x and y position.
   * If no parameter is passed the currently set mode is returned as String.
   *
   * @cat Image
   * @method imageMode
   * @param {String} [mode] Either b.CORNER, b.CORNERS, or b.CENTER
   * @return {String} The current mode
   */
  pub.imageMode = function(mode) {
    if (arguments.length === 0) return currImageMode;

    if (mode === pub.CORNER || mode === pub.CORNERS || mode === pub.CENTER ) {
      currImageMode = mode;
    } else {
      error("Unsupported imageMode. Use: CORNER, CORNERS, CENTER.");
    }
    return currImageMode;
  };

  var initDataFile = function(file, mustExist) {
    var result = null;
    if (file instanceof File) {
      result = file;
    } else {
      var folder = new Folder(projectPath().absoluteURI + '/data');
      folder.create(); // creates data folder if not existing, otherwise it just skips
      result = new File(folder.absoluteURI + '/' + file);
    }
    if (mustExist && !result.exists) {
      error('The file "' + result + '" does not exist.');
    }
    return result;
  };
  
  var initExportFile = function(file, mustExist) {
    var result = null;
    if (file instanceof File) {
      result = file;
    } else {
      result = new File(projectPath().absoluteURI + '/' + file);
    }
    if (mustExist && !result.exists) {
      error('The file "' + result + '" does not exist.');
    }
    return result;
  };
  
  var projectPath = function() {
      var docPath = null;
      try {
        docPath = currentDoc().filePath;
      } catch (e) {
        error("The current document must be saved before its project directory can be accessed.");
      }
      return docPath;
  };
  

  // ----------------------------------------
  // Math
  
  var Vector = pub.Vector = function() {

    /**
     * A class to describe a two or three dimensional vector. This datatype stores two or three variables that are commonly used as a position, velocity, and/or acceleration. Technically, position is a point and velocity and acceleration are vectors, but this is often simplified to consider all three as vectors. For example, if you consider a rectangle moving across the screen, at any given instant it has a position (the object's location, expressed as a point.), a velocity (the rate at which the object's position changes per time unit, expressed as a vector), and acceleration (the rate at which the object's velocity changes per time unit, expressed as a vector). Since vectors represent groupings of values, we cannot simply use traditional addition/multiplication/etc. Instead, we'll need to do some "vector" math, which is made easy by the methods inside the PVector class.
     *
     * Constructor of Vector, can be two- or three-dimensional.
     * 
     * @constructor
     * @cat Vector
     * @method Vector
     * @param {Number} x
     * @param {Number} y
     * @param {Number} [z]
     */
    function Vector(x, y, z) {
      this.x = x || 0;
      this.y = y || 0;
      this.z = z || 0;
    }
    /**
     * Calculates the Euclidean distance between two points (considering a point as a vector object).
     * Is meant to be called "static" i.e. Vector.dist(v1, v2);
     * @cat Vector
     * @method Vector.dist
     * @static
     * @param {Vector} v1 The first vector
     * @param {Vector} v2 The second vector
     * @return {Number} The distance
     */
    Vector.dist = function(v1, v2) {
      return v1.dist(v2);
    };

    /**
     * Calculates the dot product of two vectors.
     * Is meant to be called "static" i.e. Vector.dot(v1, v2);
     * @method Vector.dot
     * @cat Vector
     * @static
     * @param {Vector} v1 The first vector
     * @param {Vector} v2 The second vector
     * @return {Number} The dot product
     */
    Vector.dot = function(v1, v2) {
      return v1.dot(v2);
    };

    /**
     * Calculates the cross product of two vectors.
     * Is meant to be called "static" i.e. Vector.cross(v1, v2);
     * @method Vector.cross
     * @cat Vector
     * @static
     * @param {Vector} v1 The first vector
     * @param {Vector} v2 The second vector
     * @return {Number} The cross product
     */
    Vector.cross = function(v1, v2) {
      return v1.cross(v2);
    };

    /**
     * Calculates the angle between two vectors.
     * Is meant to be called "static" i.e. Vector.angleBetween(v1, v2);
     * @method Vector.angleBetween
     * @cat Vector
     * @static
     * @param {Vector} v1 The first vector
     * @param {Vector} v2 The second vector
     * @return {Number} The angle
     */
    Vector.angleBetween = function(v1, v2) {
      return Math.acos(v1.dot(v2) / (v1.mag() * v2.mag()));
    };

    Vector.prototype = {

      /**
       * Sets the x, y, and z component of the vector using three separate variables, the data from a PVector, or the values from a float array.
       * @method Vector.set
       * @cat Vector
       * @param {Number|Array|Vector} v Either a vector, array or x component
       * @param {Number} [y] The y component
       * @param {Number} [z] The z component
       */
      set: function(v, y, z) {
        if (arguments.length === 1) this.set(v.x || v[0] || 0, v.y || v[1] || 0, v.z || v[2] || 0);
        else {
          this.x = v;
          this.y = y;
          this.z = z;
        }
      },
      /**
       * Gets a copy of the vector, returns a Vector object.
       * @method Vector.get
       * @cat Vector
       * @return {Vector} A copy of the vector
       */
      get: function() {
        return new Vector(this.x, this.y, this.z);
      },
      /**
       * Calculates the magnitude (length) of the vector and returns the result as a float
       * @method Vector.mag
       * @cat Vector
       * @return {Number} The length
       */
      mag: function() {
        var x = this.x,
          y = this.y,
          z = this.z;
        return Math.sqrt(x * x + y * y + z * z);
      },
      /**
       * Adds x, y, and z components to a vector, adds one vector to another.
       * @method Vector.add
       * @cat Vector
       * @param {Vector|Number} v Either a full vector or an x component
       * @param {Number} [y] The y component
       * @param {Number} [z] The z component
       */
      add: function(v, y, z) {
        if (arguments.length === 1) {
          this.x += v.x;
          this.y += v.y;
          this.z += v.z;
        } else {
          this.x += v;
          this.y += y;
          this.z += z;
        }
      },
      /**
       * Substract x, y, and z components or a full vector from this vector
       * @method Vector.sub
       * @cat Vector
       * @param {Vector|Number} v Either a full vector or an x component
       * @param {Number} [y] The y component
       * @param {Number} [z] The z component
       */
      sub: function(v, y, z) {
        if (arguments.length === 1) {
          this.x -= v.x;
          this.y -= v.y;
          this.z -= v.z;
        } else {
          this.x -= v;
          this.y -= y;
          this.z -= z;
        }
      },
      /**
       * Multiplies this vector with x, y, and z components or another vector.
       * @method Vector.mult
       * @cat Vector
       * @param {Vector|Number} v Either a full vector or an x component
       * @param {Number} [y] The y component
       * @param {Number} [z] The z component
       */
      mult: function(v) {
        if (typeof v === "number") {
          this.x *= v;
          this.y *= v;
          this.z *= v;
        } else {
          this.x *= v.x;
          this.y *= v.y;
          this.z *= v.z;
        }
      },
      /**
       * Divides this vector through x, y, and z components or another vector.
       * @method Vector.div
       * @cat Vector
       * @param {Vector|Number} v Either a full vector or an x component
       * @param {Number} [y] The y component
       * @param {Number} [z] The z component
       */
      div: function(v) {
        if (typeof v === "number") {
          this.x /= v;
          this.y /= v;
          this.z /= v;
        } else {
          this.x /= v.x;
          this.y /= v.y;
          this.z /= v.z;
        }
      },
      /**
       * Calculates the distance from this vector to another as x, y, and z components or full vector.
       * @method Vector.dist
       * @cat Vector
       * @param {Vector|Number} v Either a full vector or an x component
       * @param {Number} [y] The y component
       * @param {Number} [z] The z component
       * @return {Number} The distance
       */
      dist: function(v) {
        var dx = this.x - v.x,
          dy = this.y - v.y,
          dz = this.z - v.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
      },
      /**
       * Calculates the dot product from this vector to another as x, y, and z components or full vector.
       * @method Vector.dot
       * @cat Vector
       * @param {Vector|Number} v Either a full vector or an x component
       * @param {Number} [y] The y component
       * @param {Number} [z] The z component
       * @return {Number} The dot product
       */
      dot: function(v, y, z) {
        if (arguments.length === 1) return this.x * v.x + this.y * v.y + this.z * v.z;
        return this.x * v + this.y * y + this.z * z;
      },
      /**
       * Calculates the cross product from this vector to another as x, y, and z components or full vector.
       * @method Vector.cross
       * @cat Vector
       * @param {Vector|Number} v Either a full vector or an x component
       * @param {Number} [y] The y component
       * @param {Number} [z] The z component
       * @return {Number} The cross product
       */
      cross: function(v) {
        var x = this.x,
          y = this.y,
          z = this.z;
        return new Vector(y * v.z - v.y * z, z * v.x - v.z * x, x * v.y - v.x * y);
      },
      /**
       * Normalizes the length of this vector to 1.
       * @cat Vector
       * @method Vector.normalize
       */
      normalize: function() {
        var m = this.mag();
        if (m > 0) this.div(m);
      },
      /**
       * Normalizes the length of this vector to the given parameter.
       * @method Vector.limit
       * @cat Vector
       * @param {Number} high The value to scale to.
       */
      limit: function(high) {
        if (this.mag() > high) {
          this.normalize();
          this.mult(high);
        }
      },
      /**
       * The 2D orientation (heading) of this vector in radian.
       * @method Vector.heading2D
       * @cat Vector
       * @return {Number} A radian angle value
       */
      heading2D: function() {
        return -Math.atan2(-this.y, this.x);
      },
      /**
       * Returns data about this vector as a string.
       * @method Vector.toString
       * @cat Vector
       * @return {String} The x, y and z components as a string.
       */
      toString: function() {
        return "[" + this.x + ", " + this.y + ", " + this.z + "]";
      },
      /** 
       * Returns this vector as an array [x,y,z].
       * @method Vector.array
       * @cat Vector
       * @return {Array} [x,y,z]
       */
      array: function() {
        return [this.x, this.y, this.z];
      }
    };

    function createVectorMethod(method) {
      return function(v1, v2) {
        var v = v1.get();
        v[method](v2);
        return v;
      };
    }
    for (var method in Vector.prototype) if (Vector.prototype.hasOwnProperty(method) && !Vector.hasOwnProperty(method)) Vector[method] = createVectorMethod(method);
    return Vector;
  }();
  

  // -- Calculation --  
   
  /** 
   * Calculates the absolute value (magnitude) of a number. The absolute value of a number is always positive.
   *
   * @cat Math
   * @subcat Calculation
   * @method abs
   * @param {Number} val An arbitrary number
   * @return The absolute value of that number
   */
  pub.abs = Math.abs;

  /**
   * Calculates the closest int value that is greater than or equal to the value of the parameter. For example, ceil(9.03) returns the value 10.
   *
   * @cat Math
   * @subcat Calculation
   * @method ceil
   * @param {Number} val An arbitrary number
   * @return The next highest integer value
   */
  pub.ceil = Math.ceil;

  /**
   * Constrains a value to not exceed a maximum and minimum value.
   *
   * @cat Math
   * @subcat Calculation
   * @method constrain
   * @param {Number} aNumber the value to constrain
   * @param {Number} aMin minimum limit
   * @param {Number} aMax maximum limit
   * @return The constrained value
   */
  pub.constrain = function(aNumber, aMin, aMax) {
    if(arguments.length !== 3 ) error("Wrong argument count for b.constrain().");
    return aNumber > aMax ? aMax : aNumber < aMin ? aMin : aNumber;
  };

  /**
   * Calculates the distance between two points.
   *
   * @cat Math
   * @subcat Calculation
   * @method dist
   * @param {Number} x1 the x-coordinate of the first point
   * @param {Number} y1 the y-coordinate of the first point
   * @param {Number} x2 the x-coordinate of the second point
   * @param {Number} y2 the y-coordinate of the second point
   * @return {Number} The distance
   */
  pub.dist = function() {
    var dx, dy, dz;
    if (arguments.length === 4) {
      dx = arguments[0] - arguments[2];
      dy = arguments[1] - arguments[3];
      return Math.sqrt(dx * dx + dy * dy);
    } else {
      error("Wrong argument count for b.dist().");
    }
  };

  /**
   * Returns Euler's number e (2.71828...) raised to the power of the value parameter.
   * 
   * @cat Math
   * @subcat Calculation
   * @method exp
   * @param {Number} a value
   * @return {Number}
   */
  pub.exp = Math.exp;

  /**
   * Calculates the closest int value that is less than or equal to the value of the parameter.
   * 
   * @cat Math
   * @subcat Calculation
   * @method floor
   * @param {Number} a value
   * @return {Number}
   */
  pub.floor = Math.floor;

  /**
   * Calculates a number between two numbers at a specific increment. The amt parameter is the amount to interpolate between the two values where 0.0 equal to the first point, 0.1 is very near the first point, 0.5 is half-way in between, etc. The lerp function is convenient for creating motion along a straight path and for drawing dotted lines.
   *
   * @cat Math
   * @subcat Calculation
   * @method lerp
   * @param {Number} value1 first value
   * @param {Number} value2 second value
   * @param {Number} amt between 0.0 and 1.0
   * @return {Number} The mapped value
   */
  pub.lerp = function(value1, value2, amt) {
    if(arguments.length !== 3 ) error("Wrong argument count for b.lerp().");
    return (value2 - value1) * amt + value1;
  };

  /**
   * Calculates the natural logarithm (the base-e logarithm) of a number. This function expects the values greater than 0.0.
   * 
   * @cat Math
   * @subcat Calculation
   * @method log
   * @param {Number} number must be greater then 0.0
   * @return {Number}
   */
  pub.log = Math.log;

  /**
   * Calculates the magnitude (or length) of a vector. A vector is a direction in space commonly used in computer graphics and linear algebra. Because it has no "start" position, the magnitude of a vector can be thought of as the distance from coordinate (0,0) to its (x,y) value. Therefore, mag() is a shortcut for writing "dist(0, 0, x, y)".
   * 
   * @cat Math
   * @subcat Calculation
   * @method mag
   * @param {Number} a x-coordinate
   * @param {Number} b y-coordinate
   * @param {Number} [c] z-coordinate
   * @return {Number} the magnitude
   */
  pub.mag = function(a, b, c) {
    if( ! (arguments.length === 2 || arguments.length === 3 ) )  error("Wrong argument count for b.mag().");
    if (c) return Math.sqrt(a * a + b * b + c * c);
    return Math.sqrt(a * a + b * b);
  };

  /**
   * Re-maps a number from one range to another. In the example above, the number '25' is converted from a value in the range 0..100 into a value that ranges from the left edge (0) to the right edge (width) of the screen.
   * 
   * Numbers outside the range are not clamped to 0 and 1, because out-of-range values are often intentional and useful.
   * 
   * @cat Math
   * @subcat Calculation
   * @method map
   * @param {Number} value the value to be mapped
   * @param {Number} istart start of the input range
   * @param {Number} istop end of the input range
   * @param {Number} ostart start of the output range
   * @param {Number} ostop end of the output range
   * @return {Number} the mapped value
   */
  pub.map = function(value, istart, istop, ostart, ostop) {
    if(arguments.length !== 5 ) error("Wrong argument count for b.map().");
    return ostart + (ostop - ostart) * ((value - istart) / (istop - istart));
  };

  /**
   * Determines the largest value in a sequence of numbers.
   * 
   * @cat Math
   * @subcat Calculation
   * @method max
   * @param {Number|Array} param1 Either the first value or an array of Numbers 
   * @param {Number} param2 Another value to be compared
   * @param {Number} param3 Another value to be compared
   * @return {Number} The highest value
   */ 
  pub.max = function() {
    if (arguments.length === 2) return arguments[0] < arguments[1] ? arguments[1] : arguments[0];
    var numbers = arguments.length === 1 ? arguments[0] : arguments;
    if (! ("length" in numbers && numbers.length > 0)) error("Non-empty array is expected");
    var max = numbers[0],
      count = numbers.length;
    for (var i = 1; i < count; ++i) if (max < numbers[i]) max = numbers[i];
    return max;
  };

  /**
   * Determines the smallest value in a sequence of numbers.
   * 
   * @cat Math
   * @subcat Calculation
   * @method min
   * @param {Number|Array} param1 Either the first value or an array of Numbers 
   * @param {Number} param2 Another value to be compared
   * @param {Number} param3 Another value to be compared
   * @return {Number} The lowest value
   */ 
  pub.min = function() {
    if (arguments.length === 2) return arguments[0] < arguments[1] ? arguments[0] : arguments[1];
    var numbers = arguments.length === 1 ? arguments[0] : arguments;
    if (! ("length" in numbers && numbers.length > 0)) error("Non-empty array is expected");
    var min = numbers[0],
      count = numbers.length;
    for (var i = 1; i < count; ++i) if (min > numbers[i]) min = numbers[i];
    return min;
  };

  /**
   * Normalizes a number from another range into a value between 0 and 1. 
   *
   * Identical to map(value, low, high, 0, 1); 
   *
   * Numbers outside the range are not clamped to 0 and 1, because out-of-range values are often intentional and useful.
   *
   * @cat Math
   * @subcat Calculation
   * @method norm
   * @param {Number} aNumber The value to be normed
   * @param {Number} low The lowest value to be expected
   * @param {Number} low The highest value to be expected
   * @return {Number} The normalized value
   */
  pub.norm = function(aNumber, low, high) {
    if(arguments.length !== 3 ) error("Wrong argument count for b.norm().");
    return (aNumber - low) / (high - low);
  };

  /**
   * Facilitates exponential expressions. The pow() function is an efficient way of multiplying numbers by themselves (or their reciprocal) in large quantities. For example, pow(3, 5) is equivalent to the expression 3*3*3*3*3 and pow(3, -5) is equivalent to 1 / 3*3*3*3*3
   *
   * @cat Math
   * @subcat Calculation
   * @method pow
   * @param {Number} num base of the exponential expression
   * @param {Number} exponent power of which to raise the base
   * @return {Number} the result
   */
  pub.pow = Math.pow;

  /**
   * Calculates the integer closest to the value parameter. For example, round(9.2) returns the value 9.
   *
   * @cat Math
   * @subcat Calculation
   * @method round
   * @param {Number} value The value to be rounded
   * @return {Number} The rounded value
   */
  pub.round = Math.round;

  /**
   * Squares a number (multiplies a number by itself). The result is always a positive number, as multiplying two negative numbers always yields a positive result. For example, -1 * -1 = 1.
   *
   * @cat Math
   * @subcat Calculation
   * @method sq
   * @param {Number} aNumber The value to be squared
   * @return {Number} 
   */
  pub.sq = function(aNumber) {
    if(arguments.length !== 1 ) error("Wrong argument count for b.sq().");
    return aNumber * aNumber;
  };

  // -- Trigonometry --
  
  /**
   * Calculates the square root of a number. The square root of a number is always positive, even though there may be a valid negative root. The square root s of number a is such that s*s = a. It is the opposite of squaring.
   *
   * @cat Math
   * @subcat Trigonometry
   * @method sqrt
   * @param {Number} val The value to be calculated
   * @return {Number} 
   */
  pub.sqrt = Math.sqrt;

  /**
   * The inverse of cos(), returns the arc cosine of a value. This function expects the values in the range of -1 to 1 and values are returned in the range 0 to PI (3.1415927).
   * 
   * @cat Math
   * @subcat Trigonometry
   * @method acos
   * @param {Number} value the value whose arc cosine is to be returned
   * @return {Number} 
   */
  pub.acos = Math.acos;
  
  /**
   * The inverse of sin(), returns the arc sine of a value. This function expects the values in the range of -1 to 1 and values are returned in the range 0 to PI (3.1415927).
   * 
   * @cat Math
   * @subcat Trigonometry
   * @method asin
   * @param {Number} value the value whose arc sine is to be returned
   * @return {Number} 
   */  
  pub.asin = Math.asin;

  /**
   * The inverse of tan(), returns the arc tangent of a value. This function expects the values in the range of -1 to 1 and values are returned in the range 0 to PI (3.1415927).
   * 
   * @cat Math
   * @subcat Trigonometry
   * @method atan
   * @param {Number} value the value whose arc tangent is to be returned
   * @return {Number} 
   */
  pub.atan = Math.atan;

  /**
   * Calculates the angle (in radians) from a specified point to the coordinate origin as measured from the positive x-axis. Values are returned as a float in the range from PI to -PI. The atan2() function is most often used for orienting geometry to the position of the cursor. Note: The y-coordinate of the point is the first parameter and the x-coordinate is the second due the the structure of calculating the tangent.
   * 
   * @cat Math
   * @subcat Trigonometry
   * @method atan2
   * @param {Number} y the y coordinate
   * @param {Number} x the x coordinate
   * @return {Number} 
   */
  pub.atan2 = Math.atan2;

  /**
   * Calculates the cosine of an angle. This function expects the values of the angle parameter to be provided in radians (values from 0 to PI*2). Values are returned in the range -1 to 1.
   * 
   * @cat Math
   * @subcat Trigonometry
   * @method cos
   * @param {Number} rad a value in radians
   * @return {Number} 
   */
  pub.cos = Math.cos;
  
  /**
   * Converts a radian measurement to its corresponding value in degrees. Radians and degrees are two ways of measuring the same thing. There are 360 degrees in a circle and 2*PI radians in a circle. For example, 90° = PI/2 = 1.5707964. All trigonometric methods in Processing require their parameters to be specified in radians.
   * 
   * @cat Math
   * @subcat Trigonometry
   * @method degrees
   * @param {Number} aAngle an angle in radians
   * @return {Number} The given angle in degree
   */
  pub.degrees = function(aAngle) {
    return aAngle * 180 / Math.PI;
  };

  /**
   * Converts a degree measurement to its corresponding value in radians. Radians and degrees are two ways of measuring the same thing. There are 360 degrees in a circle and 2*PI radians in a circle. For example, 90° = PI/2 = 1.5707964. All trigonometric methods in Processing require their parameters to be specified in radians.
   * 
   * @cat Math
   * @subcat Trigonometry
   * @method radians
   * @param {Number} aAngle an angle in degree
   * @return {Number} The given angle in radians
   */
  pub.radians = function(aAngle) {
    return aAngle / 180 * Math.PI;
  };

  /**
   * Calculates the sine of an angle. This function expects the values of the angle parameter to be provided in radians (values from 0 to 6.28). Values are returned in the range -1 to 1.
   * 
   * @cat Math
   * @subcat Trigonometry
   * @method sin
   * @param {Number} rad a value in radians
   * @return {Number} 
   */
  pub.sin = Math.sin;

  /**
   * Calculates the ratio of the sine and cosine of an angle. This function expects the values of the angle parameter to be provided in radians (values from 0 to PI*2). Values are returned in the range infinity to -infinity.
   * 
   * @cat Math
   * @subcat Trigonometry
   * @method tan
   * @param {Number} rad a value in radians
   * @return {Number} 
   */
  pub.tan = Math.tan;

  // -- Random --
  
  var currentRandom = Math.random;
  
  /**
   * Generates random numbers. Each time the random() function is called, it returns an unexpected value within the specified range. If one parameter is passed to the function it will return a float between zero and the value of the high parameter. The function call random(5) returns values between 0 and 5. If two parameters are passed, it will return a float with a value between the the parameters. The function call random(-5, 10.2) returns values between -5 and 10.2.
   * 
   * One parameter sets the range from 0 to the given parameter, while with two parameters present you set the range from val1 - val2.
   *
   * @cat Math
   * @subcat Random
   * @method random
   * @param {Number} [low] The low border of the range
   * @param {Number} [high] The high border of the range
   * @return {Number} A random number
   */
  pub.random = function() {
    if (arguments.length === 0) return currentRandom();
    if (arguments.length === 1) return currentRandom() * arguments[0];
    var aMin = arguments[0],
      aMax = arguments[1];
    return currentRandom() * (aMax - aMin) + aMin;
  };

  function Marsaglia(i1, i2) {
    var z = i1 || 362436069,
      w = i2 || 521288629;
    var nextInt = function() {
      z = 36969 * (z & 65535) + (z >>> 16) & 4294967295;
      w = 18E3 * (w & 65535) + (w >>> 16) & 4294967295;
      return ((z & 65535) << 16 | w & 65535) & 4294967295;
    };
    this.nextDouble = function() {
      var i = nextInt() / 4294967296;
      return i < 0 ? 1 + i : i;
    };
    this.nextInt = nextInt;
  }
  Marsaglia.createRandomized = function() {
    var now = new Date();
    return new Marsaglia(now / 6E4 & 4294967295, now & 4294967295);
  };
  /* todo */
  pub.randomSeed = function(seed) {
    currentRandom = (new Marsaglia(seed)).nextDouble;
  };
  /* todo */
  pub.Random = function(seed) {
    var haveNextNextGaussian = false,
      nextNextGaussian, random;
    this.nextGaussian = function() {
      if (haveNextNextGaussian) {
        haveNextNextGaussian = false;
        return nextNextGaussian;
      }
      var v1, v2, s;
      do {
        v1 = 2 * random() - 1;
        v2 = 2 * random() - 1;
        s = v1 * v1 + v2 * v2;
      } while (s >= 1 || s === 0);
      var multiplier = Math.sqrt(-2 * Math.log(s) / s);
      nextNextGaussian = v2 * multiplier;
      haveNextNextGaussian = true;
      return v1 * multiplier;
    };
    random = seed === undef ? Math.random : (new Marsaglia(seed)).nextDouble;
  };

  /* todo */
  function PerlinNoise(seed) {
    var rnd = seed !== undef ? new Marsaglia(seed) : Marsaglia.createRandomized();
    var i, j;
    var perm = new Uint8Array(512);
    for (i = 0; i < 256; ++i) perm[i] = i;
    for (i = 0; i < 256; ++i) {
      var t = perm[j = rnd.nextInt() & 255];
      perm[j] = perm[i];
      perm[i] = t;
    }
    for (i = 0; i < 256; ++i) perm[i + 256] = perm[i];
    
    function grad3d(i, x, y, z) {
      var h = i & 15;
      var u = h < 8 ? x : y,
      v = h < 4 ? y : h === 12 || h === 14 ? x : z;
      return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }
    
    function grad2d(i, x, y) {
      var v = (i & 1) === 0 ? x : y;
      return (i & 2) === 0 ? -v : v;
    }
    
    function grad1d(i, x) {
      return (i & 1) === 0 ? -x : x;
    }
    function lerp(t, a, b) {
      return a + t * (b - a);
    }
    
    this.noise3d = function(x, y, z) {
      var X = Math.floor(x) & 255,
        Y = Math.floor(y) & 255,
        Z = Math.floor(z) & 255;
      x -= Math.floor(x);
      y -= Math.floor(y);
      z -= Math.floor(z);
      var fx = (3 - 2 * x) * x * x,
        fy = (3 - 2 * y) * y * y,
        fz = (3 - 2 * z) * z * z;
      var p0 = perm[X] + Y,
        p00 = perm[p0] + Z,
        p01 = perm[p0 + 1] + Z,
        p1 = perm[X + 1] + Y,
        p10 = perm[p1] + Z,
        p11 = perm[p1 + 1] + Z;
      return lerp(fz, lerp(fy, lerp(fx, grad3d(perm[p00], x, y, z), grad3d(perm[p10], x - 1, y, z)), lerp(fx, grad3d(perm[p01], x, y - 1, z), grad3d(perm[p11], x - 1, y - 1, z))), lerp(fy, lerp(fx, grad3d(perm[p00 + 1], x, y, z - 1), grad3d(perm[p10 + 1], x - 1, y, z - 1)), lerp(fx, grad3d(perm[p01 + 1], x, y - 1, z - 1), grad3d(perm[p11 + 1], x - 1, y - 1, z - 1))));
    };
    
    this.noise2d = function(x, y) {
      var X = Math.floor(x) & 255,
        Y = Math.floor(y) & 255;
      x -= Math.floor(x);
      y -= Math.floor(y);
      var fx = (3 - 2 * x) * x * x,
        fy = (3 - 2 * y) * y * y;
      var p0 = perm[X] + Y,
        p1 = perm[X + 1] + Y;
      return lerp(fy, lerp(fx, grad2d(perm[p0], x, y), grad2d(perm[p1], x - 1, y)), lerp(fx, grad2d(perm[p0 + 1], x, y - 1), grad2d(perm[p1 + 1], x - 1, y - 1)));
    };
    
    this.noise1d = function(x) {
      var X = Math.floor(x) & 255;
      x -= Math.floor(x);
      var fx = (3 - 2 * x) * x * x;
      return lerp(fx, grad1d(perm[X], x), grad1d(perm[X + 1], x - 1));
    };
  }
  var noiseProfile = {
    generator: undef,
    octaves: 4,
    fallout: 0.5,
    seed: undef
  };

  /**
   * Returns the Perlin noise value at specified coordinates. Perlin noise is a random sequence generator producing a more natural ordered, harmonic succession of numbers compared to the standard random() function. It was invented by Ken Perlin in the 1980s and been used since in graphical applications to produce procedural textures, natural motion, shapes, terrains etc.
   *
   * The main difference to the random() function is that Perlin noise is defined in an infinite n-dimensional space where each pair of coordinates corresponds to a fixed semi-random value (fixed only for the lifespan of the program). The resulting value will always be between 0.0 and 1.0. basil.js can compute 1D, 2D and 3D noise, depending on the number of coordinates given. The noise value can be animated by moving through the noise space. The 2nd and 3rd dimension can also be interpreted as time.
   *
   * The actual noise is structured similar to an audio signal, in respect to the function's use of frequencies. Similar to the concept of harmonics in physics, perlin noise is computed over several octaves which are added together for the final result. 
   *
   * Another way to adjust the character of the resulting sequence is the scale of the input coordinates. As the function works within an infinite space the value of the coordinates doesn't matter as such, only the distance between successive coordinates does (eg. when using noise() within a loop). As a general rule the smaller the difference between coordinates, the smoother the resulting noise sequence will be. Steps of 0.005-0.03 work best for most applications, but this will differ depending on use.
   *
   * @cat Math
   * @subcat Random
   * @method noise
   * @param {Number} x Coordinate in x space
   * @param {Number} [y] Coordinate in y space
   * @param {Number} [z] Coordinate in z space
   * @return {Number} the noise value
   */
  pub.noise = function(x, y, z) {
    if (noiseProfile.generator === undef) noiseProfile.generator = new PerlinNoise(noiseProfile.seed);
    var generator = noiseProfile.generator;
    var effect = 1,
      k = 1,
      sum = 0;
    for (var i = 0; i < noiseProfile.octaves; ++i) {
      effect *= noiseProfile.fallout;
      switch (arguments.length) {
      case 1:
        sum += effect * (1 + generator.noise1d(k * x)) / 2;
        break;
      case 2:
        sum += effect * (1 + generator.noise2d(k * x, k * y)) / 2;
        break;
      case 3:
        sum += effect * (1 + generator.noise3d(k * x, k * y, k * z)) / 2;
        break;
      }
      k *= 2;
    }
    return sum;
  };
  
  /**
   * Adjusts the character and level of detail produced by the Perlin noise function. Similar to harmonics in physics, noise is computed over several octaves. Lower octaves contribute more to the output signal and as such define the overal intensity of the noise, whereas higher octaves create finer grained details in the noise sequence. By default, noise is computed over 4 octaves with each octave contributing exactly half than its predecessor, starting at 50% strength for the 1st octave. This falloff amount can be changed by adding an additional function parameter. Eg. a falloff factor of 0.75 means each octave will now have 75% impact (25% less) of the previous lower octave. Any value between 0.0 and 1.0 is valid, however note that values greater than 0.5 might result in greater than 1.0 values returned by noise().
   *
   * By changing these parameters, the signal created by the noise() function can be adapted to fit very specific needs and characteristics.
   * 
   * @cat Math
   * @subcat Random
   * @method noiseDetail
   * @param {Number} octaves number of octaves to be used by the noise() function
   * @param {Number} fallout falloff factor for each octave
   */
  pub.noiseDetail = function(octaves, fallout) {
    noiseProfile.octaves = octaves;
    if (fallout !== undef) noiseProfile.fallout = fallout;
  };
  
  /** 
   * Sets the seed value for noise(). By default, noise() produces different results each time the program is run. Set the value parameter to a constant to return the same pseudo-random numbers each time the software is run.
   * 
   * @cat Math
   * @subcat Random
   * @method noiseSeed
   * @param {Number} seed 
   */
  pub.noiseSeed = function(seed) {
    noiseProfile.seed = seed;
    noiseProfile.generator = undef;
  };


  // ----------------------------------------
  // Date
  
  /**
   * The year() function returns the current year as an integer (2012, 2013 etc).
   * 
   * @cat Environment
   * @subcat Date
   * @method year
   * @return {Number}
   */
  pub.year = function() {
    return (new Date()).getFullYear()();
  };

  /**
   * The month() function returns the current month as a value from 1 - 12.
   * 
   * @cat Environment
   * @subcat Date
   * @method month
   * @return {Number}
   */
  pub.month = function() {
    return (new Date()).getMonth() + 1;
  };

  /**
   * The day() function returns the current day as a value from 1 - 31.
   * 
   * @cat Environment
   * @subcat Date
   * @method day
   * @return {Number}
   */
  pub.day = function() {
    return (new Date()).getDate();
  };
  
  /**
   * The hour() function returns the current hour as a value from 0 - 23.
   * 
   * @cat Environment
   * @subcat Date
   * @method hour
   * @return {Number}
   */
  pub.hour = function() {
    return (new Date()).getHours();
  };

  /**
   * The minute() function returns the current minute as a value from 0 - 59.
   * 
   * @cat Environment
   * @subcat Date
   * @method minute
   * @return {Number}
   */
  pub.minute = function() {
    return (new Date()).getMinutes();
  };
  
  /**
   * The second() function returns the current second as a value from 0 - 59.
   * 
   * @cat Environment
   * @subcat Date
   * @method second
   * @return {Number}
   */
  pub.second = function() {
    return (new Date()).getSeconds();
  };
  
  /**
   * Returns the number of milliseconds (thousandths of a second) since starting an applet. This information is often used for timing animation sequences.
   * 
   * @cat Environment
   * @subcat Date
   * @method millis
   * @return {Number}
   */
  pub.millis = function() {
    return Date.now() - start;
  };

  /**
   * Returns items tagged with the given label in the InDesign Script Label pane (Window -> Utilities -> Script Label).
   *
   * @cat Document
   * @subcat InDesign Model
   * @method labels
   * @param  {String} label The label identifier
   * @param  {Function} cb Optional: The callback function to call with each item in the search result. When this function returns false the loop stops. Passed arguments: item, loopCount
   * @return {PageItem[]} Array of concrete PageItem instances, e.g. TextFrame or SplineItem.
   */
  pub.labels = function(label, cb) {
    var result = [];
    var doc = currentDoc();
    for (var i = 0, len = doc.pageItems.length; i < len; i++) {
      var pageItem = doc.pageItems[i];
      if (pageItem.label === label) {
        // push pageItem's 1st element to get the concrete PageItem instance, e.g. a TextFrame
        result.push(pageItem.getElements()[0]);
      }
    }
    if (arguments.length === 2 && cb instanceof Function) {
      return forEach(result, cb);
    }
    return result;
  };

  /**
   * Returns the currently selected object(s)
   *
   * @cat Document
   * @subcat InDesign Model
   * @method selections
   * @param  {Function} cb Optional: The callback function to call with each item in the selection. When this function returns false the loop stops. Passed arguments: item, loopCount
   * @return {Object[]} Array of selected object(s).
   */
  pub.selections = function(cb) {
    if(app.selection.length === 0) error("Selection is empty. Please select something :)");
    if (arguments.length === 1 && cb instanceof Function) {
      return forEach(app.selection, cb);
    } 
    return app.selection;
  };

  /**
   * Reads the contents of a file into a String.
   * If the file is specified by name as String, it must be located in the document's data directory.
   *
   * @cat Data
   * @subcat Input
   * @method loadString
   * @param  {String|File} file The text file name in the document's data directory or a File instance
   * @return {String}  String file content.
   */
  pub.loadString = function(file) {
    var inputFile = initDataFile(file, true),
      data = null;

    inputFile.open('r');
    data = inputFile.read();
    inputFile.close();
    return data;
  };

  /**
   * Reads the contents of a file and creates a String array of its individual lines.
   * If the file is specified by name as String, it must be located in the document's data directory.
   *
   * @cat Data
   * @subcat Input
   * @method loadStrings
   * @param  {String|File} file The text file name in the document's data directory or a File instance
   * @return {String[]}  Array of the individual lines in the given file.
   */
  pub.loadStrings = function(file) {
    var inputFile = initDataFile(file, true),
      result = [];

    inputFile.open('r');
    while (!inputFile.eof) {
      result.push(inputFile.readln());
    }
    inputFile.close();

    return result;
  };


  // ----------------------------------------
  // Output
  
  /**
   * Prints a message line to the console output in the ExtendScript editor. 
   * 
   * @cat Output
   * @method println
   * @param {String} The message to print
   */
  var println = pub.println = function(msg) {
    $.writeln(msg);
  };

  /**
   * Prints a message to the console output in the ExtendScript editor, but unlike b.println() it doesn't return the carriage to a new line at the end.
   * 
   * @cat Output
   * @method print
   * @param {String} The message to print
   */
  pub.print = function(msg) {
    $.write(msg);
  };

  /**
   * Print numerous information about the current environment to the console
   * 
   * @cat Output
   * @method printInfo
   */
  pub.printInfo = function() {

    pub.println("###");
    pub.println("OS: " + $.os);
    pub.println("ExtendScript Build: " + $.build);
    pub.println("ExtendScript Version:" + $.version);                    
    pub.println("Engine: " + $.engineName);         
    pub.println("memCache: " + $.memCache + " bytes");            
    pub.println("###");

  };

  /**
   * Writes an array of strings to a file, one line per string. This file is saved to the document's data directory.
   * If the given file exists it gets overridden.
   *
   * @cat Output
   * @method saveStrings
   * @param  {String|File} file The file name or a File instance
   * @param  {String[]} strings The string array to be written
   */
  pub.saveStrings = function(file, strings) {
    var outputFile = initExportFile(file);
    outputFile.open('w');
    forEach(strings, function(s) {
      outputFile.writeln(s);
    });
    outputFile.close();
  };

  /**
   * Exports the current document as PDF to the documents data folder. Please note, that export options default to the last used export settings.
   *
   * @todo data folder is not created automatically,
   * @cat Output
   * @method savePDF
   * @param {String|File} file The file name or a File instance
   * @param {Boolean} showOptions Whether to show the export dialog
   */
  pub.savePDF = function(file, showOptions){
    var outputFile = initExportFile(file);
    if (typeof showOptions !== "boolean") showOptions = false;
    b.doc().exportFile(ExportFormat.PDF_TYPE, outputFile, showOptions);
  };
  

  // ----------------------------------------
  // Transform
  // geometricBounds hint: [y1, x1, y2, x2]

  var precision = function(num, dec) {
      return Math.round(num * Math.pow(10, dec)) / Math.pow(10, dec);
  }  

/**
   * The function calculates the geometric bounds of any given object. Use b.itemX(), b.itemY(), b.itemPosition(), b.itemWidth(), b.itemHeight() and b.itemSize() to modify PageItems.
   * In case the object is any kind of text, then additional typographic information baseline and xHeight are calculated
   *
   * @cat Document
   * @subcat Transformation
   * @method bounds
   * @param  {Text|Object} obj The object to calculate the geometric bounds
   * @return {Object} Geometric bounds object with these properties: width, height, left, right, top, bottom and for text: baseline, xHeight
   */
  pub.bounds = function (obj) {
    var x1,y1,x2,y2,w,h;

    if (isText(obj)) {
      var baseline = obj.baseline;
      var ascent = obj.ascent;
      var descent = obj.descent;

      x1 = obj.horizontalOffset;
      y1 = baseline - ascent;
      x2 = obj.endHorizontalOffset;
      y2 = baseline + descent;
      w = x2-x1;
      h = y2-y1;

      if (w < 0 || h <0) {
        warning("bounds(textObj), not possible to get correct bounds, possible linebreak within textObj");
      }

      // TODO: not sure if this 100% correct, check
      // http://en.wikipedia.org/wiki/File:Typography_Line_Terms.svg
      var xHeight = y1+descent;

      return {'width':w,
              'height':h,
              'left':x1,
              'right':x2,
              'top':y1,
              'bottom':y2,
              'baseline':baseline,
              'xHeight':xHeight };
    } else {
      // is it a pageItem?
      if (obj.hasOwnProperty("geometricBounds")) {
        var geometricBounds = obj.geometricBounds; //[y1, x1, y2, x2]
        x1 = geometricBounds[1];
        y1 = geometricBounds[0];
        x2 = geometricBounds[3];
        y2 = geometricBounds[2];
        w = x2-x1;
        h = y2-y1;
        return {'width':w, 'height':h, 'left':x1, 'right':x2, 'top':y1, 'bottom':y2};
      }
      // everything else e.g. page, spread
      else if (obj.hasOwnProperty("bounds")) {
        var bounds = obj.bounds; //[y1, x1, y2, x2]
        x1 = bounds[1];
        y1 = bounds[0];
        x2 = bounds[3];
        y2 = bounds[2];
        w = x2-x1;
        h = y2-y1;
        return {'width':w, 'height':h, 'left':x1, 'right':x2, 'top':y1, 'bottom':y2};
      }
      // no idea what that might be, give up
      else {
        error("bounds(obj), invalide type! Can't get bounds for this object.");
      }
    }
  };  

  /**
   * Positions a PageItem at the designated spot on the x axis. If no x argument is given the current x position is returned.
   * 
   * @cat Document
   * @subcat Transformation
   * @method itemX
   * @param {PageItem} pItem The PageItem to alter
   * @param {Number} [x] The new x position
   * @returns {Number} The current x position
   */
  pub.itemX = function(pItem, x) {
    if( typeof pItem !== 'undef' && pItem.hasOwnProperty("geometricBounds")) {
      if( typeof x === 'number' ){
        b.itemPosition(pItem, x, pItem.geometricBounds[0]);
      } else {
        return precision(pItem.geometricBounds[1], 5); // CS6 sets geometricBounds to initially slightly off values... terrible workaround
      }
    } else {
      error("pItem has to be a valid PageItem");
    }
  };

  /**
   * Positions a PageItem at the designated spot on the y axis. If no y argument is given the current y position is returned.
   *
   * @cat Document
   * @subcat Transformation
   * @method itemY
   * @param {PageItem} pItem The PageItem to alter
   * @param {Number} [y] The new y position
   * @returns {Number} The current y position
   */
  pub.itemY = function(pItem, y) {
    if( typeof pItem !== 'undef' && pItem.hasOwnProperty("geometricBounds")) {
      if( typeof y === 'number' ) {
        b.itemPosition(pItem, pItem.geometricBounds[1], y);
      } else {
        return precision(pItem.geometricBounds[0], 5);
      }
    } else {
      error("pItem has to be a valid PageItem");
    }
  };
  
  /**
   * Scales the given PageItem to the given width. If width is not given as argument the current width is returned.
   *
   * @cat Document
   * @subcat Transformation
   * @method itemWidth
   * @param {PageItem} pItem The PageItem to alter
   * @param {Number} [width] The new width
   * @returns {Number} The current width
   */
  pub.itemWidth = function(pItem, width) {
    if( typeof pItem !== 'undef' && pItem.hasOwnProperty("geometricBounds")) {
      if( typeof width === 'number' ){
        b.itemSize( pItem, width, Math.abs(pItem.geometricBounds[2] - pItem.geometricBounds[0]) );
      } else {
        return Math.abs(pItem.geometricBounds[3] - pItem.geometricBounds[1]);
      }
    } else {
      error("pItem has to be a valid PageItem");
    }
  };

  /**
   * Scales the given PageItem to the given height. If height is not given as argument the current height is returned.
   *
   * @cat Document
   * @subcat Transformation
   * @method itemHeight
   * @param {PageItem} pItem The PageItem to alter
   * @param {Number} [height] The new height
   * @returns {Number} The current height
   */
  pub.itemHeight = function(pItem, height) {
    if( typeof pItem !== 'undef' && pItem.hasOwnProperty("geometricBounds")) {
      if( typeof height === 'number' ){
        b.itemSize( pItem, Math.abs(pItem.geometricBounds[3] - pItem.geometricBounds[1]), height );
      } else {
        return Math.abs(pItem.geometricBounds[2] - pItem.geometricBounds[0]);
      }
    } else {
      error("pItem has to be a valid PageItem");
    }
  };

  /**
   * Moves the given PageItem to the given position. If x or y is not given as argument the current position is returned.
   *
   * @cat Document
   * @subcat Transformation
   * @method itemPosition
   * @param {PageItem} pItem The PageItem to alter
   * @param {Number} [x] The new x coordinate
   * @param {Number} [y] The new y coordinate
   * @returns {Object} Returns an object with the fields x and y
   */
  pub.itemPosition = function(pItem, x, y) {
    if ( typeof pItem !== 'undef' && pItem.hasOwnProperty("geometricBounds")) {
    
      if( typeof x === 'number' && typeof y === 'number') {
        var width = pItem.geometricBounds[3] - pItem.geometricBounds[1];
        var height = pItem.geometricBounds[2] - pItem.geometricBounds[0];
        pItem.geometricBounds = [ y, x, y + height, x + width ];
      } else {
        return { x: precision(pItem.geometricBounds[1], 5), y: precision(pItem.geometricBounds[0], 5) };
      }
      
    } else {
      error("itemPosition() only works with child classes of PageItem.");
    }
  };

  /**
   * Scales the given PageItem to the given size. If width or height is not given as argument the current size is returned.
   *
   * @cat Document
   * @subcat Transformation
   * @method itemSize
   * @param {PageItem} pItem The PageItem to alter
   * @param {Number} [width] The new width
   * @param {Number} [height] The new height
   * @returns {Object} Returns an object with the fields width and height
   */
  pub.itemSize = function(pItem, width, height) {
    if (pItem !== null && pItem.hasOwnProperty("geometricBounds")) {
    
      if( typeof width === 'number'  && typeof height === 'number' ) {
        var x = pItem.geometricBounds[1];
        var y = pItem.geometricBounds[0];
        pItem.geometricBounds = [ y, x, y + height, x + width ];
      } else {
        return { width: pItem.geometricBounds[3] - pItem.geometricBounds[1] , height: pItem.geometricBounds[2] - pItem.geometricBounds[0] };
      }
      
    } else {
      error("itemSize() only works with child classes of PageItem.");
    }
  };
  
  
  var printMatrixHelper = function(elements) {
    var big = 0;
    for (var i = 0; i < elements.length; i++) if (i !== 0) big = Math.max(big, Math.abs(elements[i]));
    else big = Math.abs(elements[i]);
    var digits = (big + "").indexOf(".");
    if (digits === 0) digits = 1;
    else if (digits === -1) digits = (big + "").length;
    return digits;
  };
  
  /* todo */
  var Matrix2D = pub.Matrix2D = function() {
    if (arguments.length === 0) this.reset();
    else if (arguments.length === 1 && arguments[0] instanceof Matrix2D) this.set(arguments[0].array());
    else if (arguments.length === 6) this.set(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4], arguments[5]);
  };
  /* todo */
  Matrix2D.prototype = {
    set: function() {
      if (arguments.length === 6) {
        var a = arguments;
        this.set([a[0], a[1], a[2], a[3], a[4], a[5]]);
      } else if (arguments.length === 1 && arguments[0] instanceof Matrix2D) this.elements = arguments[0].array();
      else if (arguments.length === 1 && arguments[0] instanceof Array) this.elements = arguments[0].slice();
    },
    get: function() {
      var outgoing = new Matrix2D();
      outgoing.set(this.elements);
      return outgoing;
    },
    reset: function() {
      this.set([1, 0, 0, 0, 1, 0]);
    },
    array: function array() {
      return this.elements.slice();
    },
    adobeMatrix: function array() {
      return [this.elements[0],
              this.elements[3],
              this.elements[1],
              this.elements[4],
              this.elements[2],
              this.elements[5]];
    },
    translate: function(tx, ty) {
      this.elements[2] = tx * this.elements[0] + ty * this.elements[1] + this.elements[2];
      this.elements[5] = tx * this.elements[3] + ty * this.elements[4] + this.elements[5];
    },
    invTranslate: function(tx, ty) {
      this.translate(-tx, -ty);
    },
    transpose: function() {},
    mult: function(source, target) {
      var x, y;
      if (source instanceof Vector) {
        x = source.x;
        y = source.y;
        if (!target) target = new Vector();
      } else if (source instanceof Array) {
        x = source[0];
        y = source[1];
        if (!target) target = [];
      }
      if (target instanceof Array) {
        target[0] = this.elements[0] * x + this.elements[1] * y + this.elements[2];
        target[1] = this.elements[3] * x + this.elements[4] * y + this.elements[5];
      } else if (target instanceof Vector) {
        target.x = this.elements[0] * x + this.elements[1] * y + this.elements[2];
        target.y = this.elements[3] * x + this.elements[4] * y + this.elements[5];
        target.z = 0;
      }
      return target;
    },
    multX: function(x, y) {
      return x * this.elements[0] + y * this.elements[1] + this.elements[2];
    },
    multY: function(x, y) {
      return x * this.elements[3] + y * this.elements[4] + this.elements[5];
    },
    /*
    // BUG, seems to be buggy in processing.js, and i am not clever enough to figure it out
    shearX: function(angle) {
      this.apply(1, 0, 1, Math.tan(angle), 0, 0)
    },
    shearY: function(angle) {
      this.apply(1, 0, 1, 0, Math.tan(angle), 0)
    },*/
    determinant: function() {
      return this.elements[0] * this.elements[4] - this.elements[1] * this.elements[3];
    },
    invert: function() {
      var d = this.determinant();
      if (Math.abs(d) > -2147483648) {
        var old00 = this.elements[0];
        var old01 = this.elements[1];
        var old02 = this.elements[2];
        var old10 = this.elements[3];
        var old11 = this.elements[4];
        var old12 = this.elements[5];
        this.elements[0] = old11 / d;
        this.elements[3] = -old10 / d;
        this.elements[1] = -old01 / d;
        this.elements[4] = old00 / d;
        this.elements[2] = (old01 * old12 - old11 * old02) / d;
        this.elements[5] = (old10 * old02 - old00 * old12) / d;
        return true;
      }
      return false;
    },
    scale: function(sx, sy) {
      if (sx && !sy) sy = sx;
      if (sx && sy) {
        this.elements[0] *= sx;
        this.elements[1] *= sy;
        this.elements[3] *= sx;
        this.elements[4] *= sy;
      }
    },
    invScale: function(sx, sy) {
      if (sx && !sy) sy = sx;
      this.scale(1 / sx, 1 / sy);
    },
    apply: function() {
      var source;
      if (arguments.length === 1 && arguments[0] instanceof Matrix2D) source = arguments[0].array();
      else if (arguments.length === 6) source = Array.prototype.slice.call(arguments);
      else if (arguments.length === 1 && arguments[0] instanceof Array) source = arguments[0];
      var result = [0, 0, this.elements[2], 0, 0, this.elements[5]];
      var e = 0;
      for (var row = 0; row < 2; row++) for (var col = 0; col < 3; col++, e++) result[e] += this.elements[row * 3 + 0] * source[col + 0] + this.elements[row * 3 + 1] * source[col + 3];
      this.elements = result.slice();
    },
    preApply: function() {
      var source;
      if (arguments.length === 1 && arguments[0] instanceof Matrix2D) source = arguments[0].array();
      else if (arguments.length === 6) source = Array.prototype.slice.call(arguments);
      else if (arguments.length === 1 && arguments[0] instanceof Array) source = arguments[0];
      var result = [0, 0, source[2], 0, 0, source[5]];
      result[2] = source[2] + this.elements[2] * source[0] + this.elements[5] * source[1];
      result[5] = source[5] + this.elements[2] * source[3] + this.elements[5] * source[4];
      result[0] = this.elements[0] * source[0] + this.elements[3] * source[1];
      result[3] = this.elements[0] * source[3] + this.elements[3] * source[4];
      result[1] = this.elements[1] * source[0] + this.elements[4] * source[1];
      result[4] = this.elements[1] * source[3] + this.elements[4] * source[4];
      this.elements = result.slice();
    },
    rotate: function(angle) {
      var c = Math.cos(angle);
      var s = Math.sin(angle);
      var temp1 = this.elements[0];
      var temp2 = this.elements[1];
      this.elements[0] = c * temp1 + s * temp2;
      this.elements[1] = -s * temp1 + c * temp2;
      temp1 = this.elements[3];
      temp2 = this.elements[4];
      this.elements[3] = c * temp1 + s * temp2;
      this.elements[4] = -s * temp1 + c * temp2;
    },
    rotateZ: function(angle) {
      this.rotate(angle);
    },
    invRotateZ: function(angle) {
      this.rotateZ(angle - Math.PI);
    },
    print: function() {
      var digits = printMatrixHelper(this.elements);
      var output = "" + pub.nfs(this.elements[0], digits, 4) + " " + pub.nfs(this.elements[1], digits, 4) + " " + pub.nfs(this.elements[2], digits, 4) + "\n" + pub.nfs(this.elements[3], digits, 4) + " " + pub.nfs(this.elements[4], digits, 4) + " " + pub.nfs(this.elements[5], digits, 4) + "\n\n";
      pub.println(output);
    }
  };
  
  /* todo */
  pub.applyMatrix = function (matrix) {
    currMatrix.apply(matrix);
  };

  /* todo */
  pub.popMatrix = function (argument) {
    if (matrixStack.length > 0) {
      currMatrix.set( matrixStack.pop() );
    } else {
      error("Missing a pushMatrix() to go with that popMatrix()");
    }
  };

  /* todo */
  pub.printMatrix = function (argument) {
    currMatrix.print();
  };
  /* todo */
  pub.pushMatrix = function (argument) {
    matrixStack.push( currMatrix.array() );
  };
/* todo */
  pub.resetMatrix = function (argument) {
    matrixStack = [];
    currMatrix = new Matrix2D();
  };
/* todo */
  pub.rotate = function (angle) {
    currMatrix.rotate(angle);
  };
/* todo */
  pub.scale = function (scaleX,scaleY) {
    currMatrix.scale(scaleX,scaleY);
  };
/* todo */
  pub.translate = function (tx,ty) {
    currMatrix.translate(tx,ty);
  };


  // ----------------------------------------
  // execution
  
  /**
   * Run the sketch! Has to be called in every sketch a the very end of the code.
   *
   * @cat Environment
   * @method go
   */
    pub.go = function() {
    currentDoc();
    try{
      runSetup();
      runDrawOnce();
      b.println("Finished.");
      exit();
    } catch (e) { // exception not caught individually
//      b.println(dump(e));
      alert(e); // make verbose
      exit(); // quit program execution
    }
  };

  /**
   * EXPERIMENTAL!
   *
   * Causes basil to continuously execute the code within draw() when InDesign is idle.
   * #targetengine "loop"; must be at the very top in the script file.
   * If noLoop() is called, the code in draw() stops executing.
   * It is essential to call noLoop() or execute the script lib/stop.jsx when the script is finished!
   * The framerate property determines how often draw() is called per second, e.g. a framerate of 20 will 20times call draw() per second.
   *
   * @cat Environment
   * @method loop
   * @param  {Number} framerate   The framerate per second, determines how often draw() is called per second.
   */
  pub.loop = function(framerate) {
    var sleep = null;
    if (arguments.length === 0) sleep = Math.round(1000/25);
    else sleep = Math.round(1000/framerate);

    if ($.engineName !== 'loop') {
      error('Add #targetengine "loop"; at the very top of your script.');
      error('Add #targetengine "loop"; at the very top of your script.');
    }

    currentDoc();
    runSetup();

    var idleTask = app.idleTasks.add({name: "basil_idle_task", sleep: sleep});
    idleTask.addEventListener(IdleEvent.ON_IDLE, function() {
      runDrawLoop();
    }, false);
    println("Run the script lib/stop.jsx to end the draw loop and clean up!");
//    println("loop()");
  };

  /**
   * EXPERIMENTAL!
   *
   * Stops basil from continuously executing the code within draw().
   *
   * @cat Environment
   * @method noLoop
   */
  pub.noLoop = function() {
    var allIdleTasks = app.idleTasks;
    for (var i = app.idleTasks.length - 1; i >= 0; i--) {
      allIdleTasks[i].remove();
    }
    println("noLoop()");
  };


  // ----------------------------------------
  // all private from here

  var init = function() {
    glob.b = pub;

    welcome();

    // -- init internal state vars --
    currStrokeWeight = 1;
    currStrokeTint = 100;
    currFillTint = 100;
  };

  var runSetup = function() {
    app.doScript(function() {
      if (typeof glob.setup === 'function') {
        glob.setup();
      }
    }, ScriptLanguage.javascript, undef, UndoModes.entireScript);
  };

  var runDrawOnce = function() {
    app.doScript(function() {
      if (typeof glob.draw === 'function') {
        glob.draw();
      }
    }, ScriptLanguage.javascript, undef, UndoModes.entireScript);
  };

  var runDrawLoop = function() {
    app.doScript(function() {
      if (typeof glob.draw === 'function') {
        glob.draw();
      }
    }, ScriptLanguage.javascript, undef, UndoModes.fastEntireScript);
  };

  var welcome = function() {
    clearConsole();
    $.writeln("Using basil.js "
        + pub.VERSION
        + " ...");
  };
  
  var currentDoc = function() {
    if (!currDoc) {
      var doc = null;
      try {
        doc = app.activeDocument;
        //if( doc.documentPreferences.facingPages ) warning("Your document is set up to use facing pages. You can still use basil.js, but please be aware that his mode causes some problems in the methods that deal with pages e.g. addPage() and removePage(). Turn it off for full compatibility.");
      } catch(e) {
        doc = app.documents.add();
        //doc.documentPreferences.facingPages = true; // turn facing pages off on new documents
      }
      setCurrDoc(doc);
    }
    return currDoc;
  };

  var setCurrDoc = function(doc) {
    resetCurrDoc();
    currDoc = doc;
    // -- setup document --
    
    currDoc.viewPreferences.rulerOrigin = RulerOrigin.PAGE_ORIGIN;
    currFont = currDoc.textDefaults.appliedFont.name;
    currFontSize = currDoc.textDefaults.pointSize;
    currAlign = currDoc.textDefaults.justification;
    currLeading = currDoc.textDefaults.leading;
    currKerning = 0;
    currTracking = currDoc.textDefaults.tracking;
    pub.units(pub.PT);
    updatePublicPageSizeVars();
  };

  var resetCurrDoc = function() {
    // resets doc and doc specific vars
    currDoc = null;
    currPage = null;
    currLayer = null;
    currFillColor = "Black";
    noneSwatchColor = "None";
    currStrokeColor = "Black";
    currRectMode = pub.CORNER;
    currEllipseMode = pub.CENTER;
    currYAlign = VerticalJustification.TOP_ALIGN;
    start = Date.now();
    currFont = null;
    currImageMode = pub.CORNER;
    pub.resetMatrix();
  };

  var currentLayer = function() {
    if (!currLayer) {
      currentDoc();
      currLayer = app.activeDocument.activeLayer;
    }
    return currLayer;
  };
  
  var currentPage = function() {
    if (!currPage) {
      currentDoc();
      currPage = app.activeWindow.activePage;
    }
    return currPage;
  };

  var updatePublicPageSizeVars = function () {
    var pageBounds = currentPage().bounds; // [y1, x1, y2, x2]

    var widthOffset = heightOffset = 0;

    switch(pub.canvasMode()) {

      case pub.PAPER:
        widthOffset = 0;
        heightOffset = 0;
        b.resetMatrix();
        break;

      case pub.MARGIN:
        widthOffset = - currentPage().marginPreferences.left - currentPage().marginPreferences.right;
        heightOffset = - currentPage().marginPreferences.top - currentPage().marginPreferences.bottom;
        b.resetMatrix();
        b.translate(currentPage().marginPreferences.left, currentPage().marginPreferences.top);
        break;

      case pub.BLEED:
        widthOffset = b.doc().documentPreferences.documentBleedInsideOrLeftOffset + b.doc().documentPreferences.documentBleedOutsideOrRightOffset;
        heightOffset = b.doc().documentPreferences.documentBleedBottomOffset + b.doc().documentPreferences.documentBleedTopOffset;
        b.resetMatrix();
        b.translate( -b.doc().documentPreferences.documentBleedInsideOrLeftOffset, -b.doc().documentPreferences.documentBleedTopOffset );
        break;

      case pub.FACING_PAGES:
        widthOffset = 0;
        heightOffset = 0;
        b.resetMatrix();
        
        var w = pageBounds[3] - pageBounds[1] + widthOffset;
        var h = pageBounds[2] - pageBounds[0] + heightOffset;    

        pub.width = w * 2;

        if(currentPage().name === '1') {
          pub.width = w;
        } else if (currentPage().side === PageSideOptions.RIGHT_HAND){
          pub.translate(-w,0);
        }
         
        
        pub.height = h;
        return; // early exit

      // case pub.FACING_BLEED:
      //   widthOffset = b.doc().documentPreferences.documentBleedInsideOrLeftOffset + b.doc().documentPreferences.documentBleedOutsideOrRightOffset;
      //   heightOffset = b.doc().documentPreferences.documentBleedBottomOffset + b.doc().documentPreferences.documentBleedTopOffset;
      //   b.resetMatrix();
      //   b.translate( -b.doc().documentPreferences.documentBleedInsideOrLeftOffset, -b.doc().documentPreferences.documentBleedTopOffset );
        
      //   var w = pageBounds[3] - pageBounds[1] + widthOffset / 2;
      //   var h = pageBounds[2] - pageBounds[0] + heightOffset;    

      //   pub.width = w * 2;
      //   pub.height = h;
      //   return; // early exit        

      default:
        b.error("basil.js canvasMode seems to be messed up, please use one of the following modes: b.PAPER, b.MARGIN, b.BLEED");
        break;
    }

    var w = pageBounds[3] - pageBounds[1] + widthOffset;
    var h = pageBounds[2] - pageBounds[0] + heightOffset;    

    pub.width = w;
    pub.height = h;
  };

  var error = function(msg) {
    $.writeln(ERROR_PREFIX + msg);
    throw new Error( msg );
  };

  var warning = function(msg) {
    $.writeln(WARNING_PREFIX + msg);
  };

  var clearConsole = function() {
    var bt = new BridgeTalk();
    bt.target = "estoolkit";
    bt.body = "app.clc()"; // works just with cs6
    bt.onError = function(errObj) {}
    bt.onResult = function(resObj) {}
    bt.send();
  };

  
  init();
  
})(this, app);