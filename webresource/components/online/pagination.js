define([], function() {
    /**
     * This $ plugin displays pagination links inside the selected elements.
     *
     * @author Gabriel Birke (birke *at* d-scribe *dot* de)
     * @version 1.1
     * @param {int} maxentries Number of entries to paginate
     * @param {Object} opts Several options (see README for documentation)
     * @return {Object} $ Object
     */
    $.fn.pagination = function (maxentries, opts) {
        opts = $.extend({
            items_per_page: 10,
            num_display_entries: 10,
            current_page: 0,
            num_edge_entries: 0,
            link_to: "",
            prev_text: "Prev",
            next_text: "Next",
            ellipse_text: "...",
            prev_show_always: true,
            next_show_always: true,
            callback: function () {
                return false;
            }
        }, opts || {});

        return this.each(function () {
            /**
             * Calculate the maximum number of pages
             */
            function numPages() {
                return Math.ceil(maxentries / opts.items_per_page);
            }

            /**
             * Calculate start and end point of pagination links depending on
             * current_page and num_display_entries.
             * @return {Array}
             */
            function getInterval() {
                var ne_half = Math.ceil(opts.num_display_entries / 2);
                var np = numPages();
                var upper_limit = np - opts.num_display_entries;
                var start = current_page > ne_half ? Math.max(Math.min(current_page - ne_half, upper_limit), 0) : 0;
                var end = current_page > ne_half ? Math.min(current_page + ne_half, np) : Math.min(opts.num_display_entries, np);
                return [start, end];
            }

            /**
             * This is the event handling function for the pagination links.
             * @param {int} page_id The new page number
             */
            function pageSelected(page_id, evt) {
                current_page = page_id;
                drawLinks();
                opts.callback(page_id, panel);
                window.scrollTo(0, 0);
                if (evt) {
                    if (evt.stopPropagation) {
                        evt.stopPropagation();
                    } else {
                        evt.cancelBubble = true;
                    }
                    if (evt.preventDefault) {
                        evt.preventDefault();
                    } else {
                        return false;
                    }
                }
            }

            /**
             * This function inserts the pagination links into the container element
             */
            function drawLinks() {
                var listHtml = $('<div class="number_box"></div>');
                panel.empty();
                var interval = getInterval();
                var np = numPages();
                // This helper function returns a handler function that calls pageSelected with the right page_id
                var getClickHandler = function (page_id) {
                    return function (evt) {
                        return pageSelected(page_id, evt);
                    }
                }
                // Helper function for generating a single link (or a span tag if it'S the current page)
                var appendItem = function (page_id, appendopts) {
                    page_id = page_id < 0 ? 0 : (page_id < np ? page_id : np - 1); // Normalize page id to sane value

                    appendopts = $.extend({
                        text: page_id + 1
                    }, appendopts || {});

                    if (page_id == current_page) {
                        var lnk = $("<a href='javascript:void(0)' class='current'>" + (appendopts.text) + "</a>");
                    } else {
                        var lnk = $("<a>" + (appendopts.text) + "</a>")
                            .bind("click", getClickHandler(page_id))
                            .attr('href', opts.link_to.replace(/__id__/, page_id));
                    }
                    if (appendopts.classes) {
                        lnk.removeAttr('class');
                        lnk.addClass(appendopts.classes);

                        if (appendopts.classes == "disabled" || appendopts.classes == "") {
                            var iHtml = $('<i class="prev"></i>');
                            lnk.append(iHtml);
                        }
                        else if (appendopts.classes == "next" || appendopts.classes == "next disabled") {
                            var iHtml = $("<i></i>");
                            lnk.append(iHtml);
                        }
                    }
                    listHtml.append(lnk);
                }

                // Generate "Previous"-Link  opts.prev_text && 
                if (current_page == 0 || opts.prev_show_always) {
                    var prevClass = "";
                    if (current_page == 0) {
                        prevClass = "disabled";
                    } else {
                        prevClass = "";
                    }

                    appendItem(current_page - 1, {
                        text: opts.prev_text,
                        classes: prevClass
                    });
                }

                // Generate starting points
                if (interval[0] > 0 && opts.num_edge_entries > 0) {
                    var end = Math.min(opts.num_edge_entries, interval[0]);
                    for (var i = 0; i < end; i++) {
                        appendItem(i);
                    }
                    if (opts.num_edge_entries < interval[0] && opts.ellipse_text) {
                        listHtml.append($("<span>" + opts.ellipse_text + "</span>"));
                    }
                }

                // Generate interval links
                for (var i = interval[0]; i < interval[1]; i++) {
                    appendItem(i);
                }

                // Generate ending points
                if (interval[1] < np && opts.num_edge_entries > 0) {
                    if (np - opts.num_edge_entries > interval[1] && opts.ellipse_text) {
                        listHtml.append($("<span>" + opts.ellipse_text + "</span>"));
                    }
                    var begin = Math.max(np - opts.num_edge_entries, interval[1]);
                    for (var i = begin; i < np; i++) {
                        appendItem(i);
                    }

                }

                // Generate "Next"-Link
                if (opts.next_text && (current_page < np - 1 || opts.next_show_always)) {

                    var nextClass = "";
                    if (current_page >= np - 1) {
                        nextClass = "next disabled";
                    } else {
                        nextClass = "next";
                    }

                    appendItem(current_page + 1, {
                        text: opts.next_text,
                        classes: nextClass
                    });
                }

                var numHtml = $('<div class="sel_box">到 <input type="text" value="' + (current_page + 1) + '"> 页 <button type="button">确定</button></div>');
                $('<div class="paging"></div>').append(listHtml).append(numHtml).appendTo(panel);

                var btn = opts.view ? opts.view.$el.find('.sel_box button') : $('.sel_box button');
                btn.on("click", function () {
                    var page_id = $(this).parent().find('input').val();
                    var matchRule = /\D/g;

                    if (matchRule.test(page_id)) {
                        alert("输入页码有误，请重新输入。");
                        return;
                    } else {
                        if (page_id > 0 && page_id <= numPages()) {
                            pageSelected(Number(page_id) - 1, null);
                        } else {
                            alert("输入页码有误，请重新输入。");
                            return;
                        }
                    }
                });

                panel.find('a').eq(0).html('<i></i>');
            }

            // Extract current_page from options
            var current_page = opts.current_page;
            // Create a sane value for maxentries and items_per_page
            maxentries = (!maxentries || maxentries < 0) ? 1 : maxentries;
            opts.items_per_page = (!opts.items_per_page || opts.items_per_page < 0) ? 1 : opts.items_per_page;
            // Store DOM element for easy access from all inner functions
            var panel = $(this);
            // Attach control functions to the DOM element 
            this.selectPage = function (page_id) {
                pageSelected(page_id);
            }
            this.prevPage = function () {
                if (current_page > 0) {
                    pageSelected(current_page - 1);
                    return true;
                } else {
                    return false;
                }
            }
            this.nextPage = function () {
                if (current_page < numPages() - 1) {
                    pageSelected(current_page + 1);
                    return true;
                } else {
                    return false;
                }
            }
            panel.empty();
            // When all initialisation is done, draw the links
            drawLinks();
        });
    }

    return $;
});