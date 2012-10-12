(function($){
    if(!$.Indextank){
        $.Indextank = new Object();
    };

    // this is a hacky way of getting querybuilder dependencies
    // XXX remove this once there's a minified / bundled version of indextank-jquery
    try {
        new Query();
    } catch(e) {
        // ok, I need to include querybuilder
        var qscr = $("<script/>").attr("src", "https://raw.github.com/flaptor/indextank-jquery/master/querybuilder.js");
        $("head").append(qscr);
    };

    $.Indextank.AutoSearch = function(el, options){
        // To avoid scope issues, use 'base' instead of 'this'
        // to reference this class from internal events and functions.
        var base = this;

        // Access to jQuery and DOM versions of element
        base.$el = $(el);
        base.el = el;

        // Add a reverse reference to the DOM object
        base.$el.data("Indextank.AutoSearch", base);

        base.init = function(){
            base.options = $.extend({},$.Indextank.AutoSearch.defaultOptions, options);

            // Put your initialization code here
            base.ize = $(base.el.form).data("Indextank.Ize");

            base.defaultQuery = new Query("")
                                    .withStart(base.options.start)
                                    .withLength(base.options.rsLength)
                                    .withFetchFields(base.options.fields)
                                    .withSnippetFields(base.options.snippets)
                                    .withScoringFunction(base.options.scoringFunction)
                                    .withFetchVariables(base.options.fetchVariables)
                                    .withFetchCategories(base.options.fetchCategories)
                                    .withQueryReWriter(base.options.rewriteQuery);

            base.$el.autocomplete({
                select: base.options.select,
                source: base.options.source,
                minLength: base.options.minLength,
                delay: base.options.delay,
                open: base.options.open,
                close: base.options.close
            });

            // make sure autocomplete closes when IndextankIzed form submits
            base.ize.$el.submit(function(e){
                base.$el.data("autocomplete").close();
            });

            // and also disable it when Indextank.AutoSearch is searching ..
            base.$el.bind("Indextank.AutoSearch.searching", function(e) {
                // hacky way to abort a request on jquery.ui.autocomplete.
                //base.$el.data("autocomplete").disable();
                //window.setTimeout(function(){base.$el.data("autocomplete").enable();}, 1000);
            });
        };

        base.getDefaultQuery = function() {
            return base.defaultQuery.clone();
        };

        // Sample Function, Uncomment to use
        // base.functionName = function(paramaters){
        //
        // };

        // Run initializer
        base.init();
    };

    $.Indextank.AutoSearch.defaultOptions = {
        // first result to fetch .. it can be overrided at query-time,
        // but we need a default. 99.95% of the times you'll want to keep the default
        start: 0,
        // how many results to fetch on every query?
        // it can be overriden at query-time.
        rsLength: 10,
        // default fields to fetch ..
        fields: "*",
        // fields to make snippets for
        snippets: "text",
        // scoring function to use
        scoringFunction: 0,
        // fetch all variables,
        fetchVariables: 'true',
        // fetch all categories,
        fetchCategories: 'true',
        // the default query re-writer is identity
        rewriteQuery: function(q) {return q},
        select: function(event, ui){
                    event.target.value = ui.item.value;
                    // wrap form into a jQuery object, so submit honors onsubmit.
                    //$(event.target.form).submit();
                },
        source: function (request, responseCallback){
                    var base = $(this.element).data("Indextank.AutoSearch");
                    var query = base.getDefaultQuery().withQueryString(request.term);
                    $.ajax({
                        url: base.ize.apiurl + "/v1/indexes/" + base.ize.indexName + "/search",
                        dataType: "jsonp",
                        data: query.asParameterMap(),
                        success: function( data ) {
                            var suggestions = $.map(data.results, function(item){
                                return{
                                    label: item.name,
                                    value: item.name
                                }
                            });
                            base.$el.trigger("Indextank.AutoSearch.success",[suggestions]);
                            responseCallback(suggestions);
                        }
                    });
                },
        minLength: 2,
        delay: 100,
        open: null,
        close: null
    };

    $.fn.indextank_AutoSearch = function(options){
        return this.each(function(){
            (new $.Indextank.AutoSearch(this, options));
        });
    };

    // This function breaks the chain, but returns
    // the Indextank.autosearch if it has been attached to the object.
    $.fn.getIndextank_AutoSearch = function(){
        this.data("Indextank.AutoSearch");
    };

})(jQuery);