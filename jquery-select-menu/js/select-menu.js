/* 
/ Select menu - 2013 Brett Richards Sanametrix, Inc
/

REQUIREMENTS:

    CSS select-menu.css required.
    Font awesome library required


Simply call $("select.class").selectMenu({
    option: values
    option2: value
});

options: 
    width: the width of the select box
    menuWidth: the width of the menu with select options
    icon: the class of the icon to use for the "dropdown" opener

NOTE: 
    To have an icon show up next to each option, place a font-awesome icon class in the <option>'s class attribute
    To have an icon show up next to an optgroup, place a font-awesome icon class in the <optgroup>'s class attribute


To destroy the plugin call $("select.class").selectMenu("destroy");


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

            // hide the select
            //this.element.style.visibility = "hidden";

            // active div 
            var active = document.createElement("div");
            active.setAttribute("class", activeDivClass + " ui-corner-all");
            active.setAttribute("data-selectmenu", seed);
            active.style.width = this.options.width + "px";

            // active "selected item"
            var activeSelection = document.createElement("div");
            activeSelection.setAttribute("class", "select-list-active-item ui-corner-left");
            activeSelection.style.width = (this.options.width - 36) + "px";

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
            items.setAttribute("class", itemDivClass + " ui-corner-bottom");
            items.style.width = this.options.menuWidth == null ? this.options.width : this.options.menuWidth + "px";

            // items list
            var itemsList = document.createElement("ul");
            itemsList.setAttribute("class",itemDivClass);
            
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

                    // create icon
                    var itemIcon;

                    if (icon != null) {
                        itemIcon = document.createElement("i");
                        itemIcon.setAttribute("class", icon + " icon-fixed-width");
                        groupLabelElement.insertBefore(itemIcon, groupLabel);
                    }

                    for (var o = 0; o < node.childNodes.length; o++) {
                        createItem(group, node.childNodes[o]);
                    }

                    // append option group to main list
                    itemsList.appendChild(groupLabelElement);
                    itemsList.appendChild(group);
                }
                else if (nodeName == "option") {
                    createItem(itemsList, node);
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

        },

        _bindEvents: function () {

            var target = this;

            // click on active area
            $(target.active).bind("click", function () {
                openSelectMenu(target);
            });

            var menuItems = $("ul.select-menu-items > li,ul.select-menu-items-group > li");

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
                    $(target.items).hide("slide", { direction: "up" }, 200);
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

            $(this.active).unbind("click");
            $(this.active).unbind("mouseenter");
            $(this.active).unbind("mouseleave");
            $(this.items).children("li").unbind("click");

            $(document).unbind("click", function (e) {
                var parent = $(e.target).parents("div." + activeDivClass).length;

                if (parent == 0) {
                    closeSelectMenu();
                }

            });
        },

        destroy: function () {
            this._unbindEvents();
        }
    };

    // opens the select menu
    function openSelectMenu(target) {

        $(target.active)
            .removeClass("ui-corner-all")
            .addClass("ui-corner-top");

        $(target.activeSelection)
            .removeClass("ui-corner-left")
            .addClass("ui-corner-tl");

        if ($(target.items).width() > $(target.active).width()) {
            $(target.items).addClass("ui-corner-tr");
        }

        // force hover on selected item
        var selected = $(target.items)
            .find("li:eq(" + target.element.options.selectedIndex + ")");

        $(selected).addClass("select-menu-item-hover");
        $(selected).children("i").addClass("select-menu-icon-hover");

        // scroll to item
        $(target.items)
            .show("slide", { direction: "up" }, 200, function () {
                var pos = $(selected).position().top;

                if (parseInt(pos) > 260) {
                    $(target.items).scrollTop($(selected).position().top - 60);
                }
            });
    }

    // closes the select menu
    function closeSelectMenu(target) {

        $(target.items).hide("slide", { direction: "up" }, 200, function () {
            $(this).removeClass("ui-corner-tr");
        });

        $(target.activeSelection)
            .removeClass("ui-corner-tl")
            .addClass("ui-corner-left");

        $(target.active)
            .removeClass("ui-corner-top")
            .addClass("ui-corner-all")
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
        icon: "icon-chevron-down"
    }

}(jQuery, window, document));