/* 
/ Select menu - 2013 Brett Richards
/

REQUIREMENTS:

    jQuery
    jQueryUI for additional easing (if necessary)
    CSS select-menu.css required.
    Font awesome library required


Simply call: 

    $("select").selectMenu();

Or with options:

    $("select").selectMenu({
        width: value,
        menuWidth: value,
        direction: "up",
        position: {
            left: 5,
            top: 10
        }
        onSelect: function(option) {
            // do something with the value selected
            console.log(option);
        }
    });

options: 
    width: the width of the select box

    menuWidth: the width of the menu with select options
    
    direction: "up" or "down", whichever way the dropdown should open
    
    position: the left and top offsets (if any) to use for the dropdown.  Object {left: int, top: int}
    
    icon: the class of the icon to use for the "dropdown" opener

    onSelect: a function to call when an option has been selected.  Returns the selected option

NOTE: 
    To have an icon show up next to each option, place a font-awesome icon class in the <option>'s class attribute
    To have an icon show up next to an optgroup, place a font-awesome icon class in the <optgroup>'s class attribute


To destroy the plugin call $("select").selectMenu("destroy");


*/
; (function ($, window, document, undefined) {

    var pluginName = "selectMenu";
    var seed = 1;
    var activeDivClass = "select-menu-active";
    var itemDivClass = "select-menu-items";
    

    var SelectMenu = function (element, options) {

        this.element = element;
        this.$element = $(element);
        this.options = $.extend({}, $.fn.selectMenu.defaults, options);

        this._init();
    };

    SelectMenu.prototype = {

        _init: function () {

            this.seed = seed;
            this._createElements();
            this._bindEvents();

            seed++;
        },

        _createElements: function () {

            // get our REM base
            var remBase = parseInt(window.getComputedStyle(document.getElementsByTagName("html")[0]).fontSize, 10);

            // hide the select
            this.element.style.visibility = "hidden";
            this.element.style.display = "none";
            this.element.style.opacity = 0;

            // active div 
            var active = document.createElement("div");
            active.setAttribute("class", activeDivClass + " ui-corner-all");
            active.setAttribute("data-selectmenu", seed);
            active.style.width = this.options.width + "px";
            active.style.width = parseFloat(this.options.width / remBase) + "rem";
            active.style.top = this.options.position.top + "px";
            active.style.left = this.options.position.left + "px"

            // active "selected item"
            var activeSelection = document.createElement("div");
            activeSelection.setAttribute("class", "select-list-active-item ui-corner-left");
            activeSelection.style.width = this.options.width + "px";
            activeSelection.style.width = (parseFloat(this.options.width / remBase) - 2.5) + "rem";

            // icon
            var activeIcon = document.createElement("div");
            var icon = document.createElement("i");

            icon.setAttribute("class", this.options.icon);
            
            // append
            active.appendChild(activeSelection);
            activeIcon.appendChild(icon);
            active.appendChild(activeIcon);
            
            // items div 
            var items = document.createElement("div");
            items.setAttribute("class", itemDivClass);
            items.style.width = (this.options.menuWidth > this.options.width) ? this.options.menuWidth + "px" : this.options.width + "px";
            items.style.width = (this.options.menuWidth > this.options.width) ? parseFloat(this.options.menuWidth / remBase) + "rem" : parseFloat(this.options.width / remBase) + "rem";

            // items list
            var itemsList = document.createElement("ul");
            itemsList.setAttribute("class",itemDivClass);
            
            var totalNodes = 0;

            for (var i = 0; i < this.element.childNodes.length; i++)
            {
                var node = this.element.childNodes[i];
                var nodeName = node.nodeName.toLowerCase();
                
                // Option Group
                if (nodeName == "optgroup" && node.hasChildNodes()) {
                    
                    // create new ul
                    var group = document.createElement("ul");
                    group.setAttribute("class", "select-menu-items-group");
                    group.setAttribute("optgroup", node.getAttribute("label"));

                    // check for icon
                    var icon = node.getAttribute("class");

                    // create span
                    var groupLabelElement = document.createElement("span");
                    var groupLabel = document.createTextNode(node.getAttribute("label"));
                    groupLabelElement.setAttribute("class", "select-menu-items-group");
                    groupLabelElement.appendChild(groupLabel);
                    totalNodes++;

                    // create icon
                    var itemIcon;

                    if (icon != null) {
                        itemIcon = document.createElement("i");
                        itemIcon.setAttribute("class", icon + " icon-fixed-width");
                        groupLabelElement.insertBefore(itemIcon, groupLabel);
                    }

                    for (var o = 0; o < node.childNodes.length; o++) {
                        createItem(group, node.childNodes[o]);

                        if (node.childNodes[o].value != "" && node.childNodes[o].value != null && node.childNodes[o].value != undefined) {
                            totalNodes++;
                        }
                    }

                    // append option group to main list
                    itemsList.appendChild(groupLabelElement);
                    itemsList.appendChild(group);
                }
                else if (nodeName == "option") {
                    createItem(itemsList, node);

                    if (node.value != "" && node.value != null && node.value != undefined) {
                        totalNodes++;
                    }
                }
                
                // add first option value to the active select area
                if (i == 0) {
                    activeSelection.appendChild(document.createTextNode(this.element.options[0].text.length == 0 ? String.fromCharCode(160) : this.element.options[0].text));
                }
            }

            // append
            items.appendChild(itemsList);
            
            // insert to DOM after active
            this.$element.after(items);
            this.$element.after(active);

            this.active = active;
            this.activeSelection = activeSelection;
            this.activeIcon = activeIcon;
            this.items = items;

            // account for scrollbar width
            var lineHeight = parseInt(window.getComputedStyle(this.active).lineHeight, 10);
            var maxHeight = parseInt(window.getComputedStyle(this.items).maxHeight, 10);
            
            if ((totalNodes * lineHeight) > maxHeight) {
                var scrollRem = 1.214;
                this.items.style.width = parseFloat(this.items.style.width, 10) + 1.214 + "rem";
            }
        },

        _bindEvents: function () {

            var target = this;

            // click on active area
            $(target.active).bind("click", function () {
                openSelectMenu(target);
            });

            var menuItems = $(target.items).find("ul.select-menu-items > li,ul.select-menu-items-group > li");

            // click on each item in the items list
            $(menuItems).bind("click", function () {

                var group = $(this).parents("ul").attr("optgroup");
                var hasGroup = group == undefined ? false : group;
                
                if (hasGroup) {
                    target.$element.find("optgroup[label='" + group + "'] option:eq(" + $(this).index() + ")").prop("selected","selected");
                }
                else {

                    var index = $(this).index();
                    var optGroups = $(this).parents("ul:first").children("ul");
                    var options = $(this).parents("ul:first").children("li");

                    if (optGroups.length != 0) {

                        var previous = 0;

                        // each option group we find
                        optGroups.each(function (i) {
                            
                            // if its position is before the current element
                            if ($(this).index() < index) {

                                $(this).children("li").each(function () {
                                    // add one to the count for each option
                                    previous++;
                                });
                            }
                        });

                        // each option
                        options.each(function (i) {
                            
                            if ($(this).index() < index) {
                                previous++;
                            }
                        });

                        if (previous != 0) {
                            index = previous;
                        }
                    }
                    
                    // select the option in the selectlist
                    target.$element.prop("selectedIndex",index);
                }

                $(target.activeSelection).text($(this).text());

                // call option
                target.options.onSelect.call(this,target.element.options[target.element.options.selectedIndex]);

            });

            // mouseenter for li + icon
            $(menuItems).bind("mouseenter", function () {

                $(menuItems).each(function () {
                    $(this).removeClass("select-menu-item-hover");
                    $(this).children("i").removeClass("select-menu-icon-hover");
                });

                $(this).addClass("select-menu-item-hover");
                $(this).children("i").addClass("select-menu-icon-hover");
            });

            // mouseleave for li + icon
            $(menuItems).bind("mouseleave", function () {
                $(this).removeClass("select-menu-item-hover");
                $(this).children("i").removeClass("select-menu-icon-hover");
            });

            // icon click close menu if open
            $(target.activeIcon).bind("click", function (e) {
                if ($(target.items).is(":visible")) {
                    closeSelectMenu(target);
                    e.stopImmediatePropagation();
                }
                
            });

            // close select menu on click outside
            $(document).bind("click", function (e) {

                var parent = $(e.target).parents("div." + activeDivClass).length;

                if (parent == 0 && e.target.className.indexOf("select-menu-active") == -1) {
                    closeSelectMenu(target);
                }

            });
        },

        _unbindEvents: function () {

            var target = this;

            $(target.active).unbind("click");

            var menuItems = $(target.items).find("ul.select-menu-items > li,ul.select-menu-items-group > li");

            $(menuItems).unbind("click");
            $(menuItems).unbind("mouseenter");
            $(menuItems).unbind("mouseleave");
            $(target.activeIcon).unbind("click");

            $(document).unbind("click", function (e) {
                var parent = $(e.target).parents("div." + activeDivClass).length;

                if (parent == 0 && e.target.className.indexOf("select-menu-active") == -1) {
                    closeSelectMenu(target);
                }

            });
        },

        destroy: function () {
            this._unbindEvents();
        }
    };

    // opens the select menu
    function openSelectMenu(target) {
        
        if (target.options.direction == "down") {

            $(target.active)
                .removeClass("ui-corner-all")
                .addClass("ui-corner-top");

            $(target.activeSelection)
                .removeClass("ui-corner-left")
                .addClass("ui-corner-tl");

            $(target.items)
                .addClass("ui-corner-bottom")
                .css({
                    "top": parseInt(Math.ceil($(target.active).position().top), 10) + parseInt($(target.active).css("line-height"), 10) + 1,
                    "left": parseInt(Math.ceil($(target.active).position().left), 10)
                });
            
            if ($(target.items).width() > $(target.active).width()) {
                $(target.items).addClass("ui-corner-tr");
            }
        }
        else {

            $(target.active)
                .removeClass("ui-corner-all")
                .addClass("ui-corner-bottom");

            $(target.activeSelection)
                .removeClass("ui-corner-left")
                .addClass("ui-corner-bl");

            $(target.items)
                .addClass("ui-corner-top")
                .css({
                    "top": parseInt(Math.ceil($(target.active).position().top)) - $(target.items).height() - 1,
                    "left": parseInt(Math.ceil($(target.active).position().left), 10)
                });


            if ($(target.items).width() > $(target.active).width()) {
                $(target.items).addClass("ui-corner-br");
            }
        }

        // force hover on selected item
        var selected = $(target.items)
            .find("li:eq(" + target.element.options.selectedIndex + ")");

        $(selected).addClass("select-menu-item-hover");
        $(selected).children("i").addClass("select-menu-icon-hover");

        // scroll to item
        $(target.items)
            .css("overflow-y", "auto")
            .show("slide", { direction: target.options.direction == "down" ? "up" : "down" }, 200, function () {
                var pos = $(selected).position().top;
            
                if (parseInt(pos) > 260 && (target.element.options.selectedIndex != 0)) {
                    $(target.items).scrollTop($(selected).position().top - 60);
                }
            });

    }

    // closes the select menu
    function closeSelectMenu(target) {

        if (target.options.direction == "down") {

            $(target.items)
                .css("overflow-y", "hidden")
                .hide("slide", { direction: "up" }, 200, function () {
                    $(this).removeClass("ui-corner-tr");
                });

            $(target.activeSelection)
                .removeClass("ui-corner-tl")
                .addClass("ui-corner-left");

            $(target.active)
                .removeClass("ui-corner-top")
                .addClass("ui-corner-all")
        }
        else {

            $(target.items)
               .css("overflow-y", "hidden")
               .hide("slide", { direction: "down" }, 200, function () {
                   $(this).removeClass("ui-corner-br");
               });

            $(target.activeSelection)
                .removeClass("ui-corner-bl")
                .addClass("ui-corner-left");

            $(target.active)
                .removeClass("ui-corner-bottom")
                .addClass("ui-corner-all")
        }
    }

    // creates a selectlist item "li"
    function createItem(list, option) {

        if (option.nodeName.toLowerCase() != "#text") {
            var icon = option.getAttribute("class");

            // append select list item to menu
            var item = document.createElement("li");
            item.setAttribute("data-value", option.value)

            var itemText = document.createTextNode(option.text);
            item.appendChild(itemText);

            var itemIcon;

            if (icon != null) {
                itemIcon = document.createElement("i");
                itemIcon.setAttribute("class", icon + " icon-fixed-width");
                item.insertBefore(itemIcon, itemText);
            }

            list.appendChild(item);
        }
    }

    // launch plugin
    $.fn.selectMenu = function (options) {

        return this.each(function () {
            if (!$.data(this, pluginName)) {
                $.data(this, pluginName, new SelectMenu(this, options));
            }
            else if ($.isFunction(SelectMenu.prototype[options])) {

                $.data(this, pluginName)[options]();

                if (options == "destroy") {
                    $.removeData(this, pluginName);
                    seed = 1;
                }
            }
        });
    }

    // defaults
    $.fn.selectMenu.defaults = {

        width: 220,
        menuWidth: 220,
        direction: "down",
        icon: "icon-chevron-down",
        position:
            {
                left: 0,
                top: 0
            },
        onSelect: function () { }
    }

}(jQuery, window, document));