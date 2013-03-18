/* Don't judge me! This code is everything from badly written to extremely dangerous. */

$(function() {

    /* Check version */
    var VERSION = "P";
    if(window.localStorage.ss_version != VERSION) {
        delete window.localStorage.answers;
        delete window.localStorage.ss_page;
        window.localStorage.ss_version = VERSION;
    }

    function parseArray(array) { // TODO: move this to _?
        if(!array) return [];
        return JSON.parse(array);
    }

    if(!String.prototype.trim) {
        String.prototype.trim = function () {
            return this.replace(/^\s+|\s+$/g,'');
        };
    }

    /* Set up controller */
    var _ = {
        page: window.localStorage.ss_page || 1,
        item: 0,
        answers:  parseArray(window.localStorage.answers),
        api: 'http://api.stackexchange.com/2.1/',
        reset: function() {
            _.item = 0;
            $('#output').val('');
            $('#logger').empty().append($('<div>', {class: 'oc', text: 'output console'}));
            $('#sort').attr('disabled', false).text('Sort');
            $('#no').hide();
        },
        logger: function(text, class_suffix, to_append) {
            var $div = $('<div>', {
                'html': text, 
                'class': 'log-' + class_suffix
            });

            $('#logger').append($div);

            if(to_append) {
                $div.append(to_append);
            }

            $('#logger')[0].scrollTop = $('#logger')[0].scrollHeight;
        },
        was_error: function(reason) {
            if(reason) {
                _.logger(reason, "error");
            }
            _.item++;
            _.run_snippet();
        },
        get_next_page: function() {
            _.logger("Fetching page " + _.page + "...", "trying");

            var common_url = '&pagesize=100&order=desc&site=stackoverflow&todate=1363473554';
            var question_url = _.api + 'questions?sort=votes&tagged=sort;javascript&page=' + _.page + common_url;

            // Tried using Search; more results could be run but fewer good results were returned
            //var question_url = _.api + 'search/advanced?sort=votes&accepted=True&notice=False&tagged=javascript&title=sort&page=' + _.page + common_url;

            $.get(question_url, function(data_questions) {
                var answer_ids = [];
                $.each(data_questions.items, function(k, v) {
                    if(v.accepted_answer_id) {
                        answer_ids.push(v.accepted_answer_id);
                    }
                });

                var answer_url = _.api + 'answers/' + answer_ids.join(';') + '?sort=activity&filter=!9hnGsyXaB' + common_url

                $.get(answer_url, function(data_answers) {
                    _.logger("Answers downloading, ready to run.", "success");
                    $.each(data_answers.items, function(k, v){
                        _.answers.push({
                            'answer_id': v.answer_id,
                            'question_id': v.question_id,
                            'link': 'http://stackoverflow.com/questions/'+v.question_id+'/#' + v.answer_id,
                            'body': v.body
                        });
                    });

                    // Save the new answers
                    window.localStorage.answers = JSON.stringify(_.answers);

                    _.page = parseInt(_.page) + 1;
                    window.localStorage.ss_page = _.page;

                    _.run_snippet();
                });
            });
        },
        run_snippet: function() {
            if(_.item >= _.answers.length) {
                _.get_next_page();
                return false;
            }

            var answer_id = _.answers[_.item].answer_id;
            $('#no').hide();

            // Output!
            setTimeout(function() {
                var answer_id = _.answers[_.item].answer_id;
                var link = _.answers[_.item].link;

                _.logger("Trying StackOverflow answer #", "trying", $('<a>', {'text': answer_id, 'href': link, 'target': '_blank'}));
                _.run_snippet_go();

            }, 105); // Don't freeze up the browser
        },
        run_snippet_go: function() {
            var answer = _.answers[_.item].body;
            var answer_id = _.answers[_.item].answer_id;
            var question_id = _.answers[_.item].question_id;
            var link = _.answers[_.item].link;
            var codes = answer.match(/<code>(.|[\n\r])*?<\/code>/g);

            if(!codes) {
                _.was_error("Could not find a code snippet");
                return false;
            }

            var code_sample = codes[codes.length - 1];

            // "Clean" up the code
            code_sample = code_sample.replace("<code>", "").replace("</code>", "");
            code_sample = code_sample.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
            code_sample = code_sample.replace(/(console.log|alert)\(/g, "log("); // 'log' does nothing

            // Check for some basic issues
            if(
                code_sample.indexOf("cookie") >= 0 ||
                code_sample.indexOf("getElement") >= 0 ||
                code_sample.indexOf("$(") >= 0 ||
                code_sample.indexOf("_.") >= 0 ||
                code_sample.indexOf("Backbone") >= 0 ||
                code_sample.indexOf("new Date") >= 0
            ) {
                _.was_error("Contained potentially bad code");
                return false;
            }

            // Get the function name
            var fname_raw = code_sample.match(/(?:function (\w*)|var (\w*) = function)/),
                fname = null;

            if(fname_raw) {
                fname = fname_raw[1] || fname_raw[2];
                if(!fname) {
                    _.was_error("Could not extract a function to run");
                    return false;
                }
            } else {
                _.was_error("Could not extract a function to run");
                return false;
            }


            // Construct the code to eval()
            var code_after = ";test_results(" + fname + "(" + $('#input').val() + "));";
            var code = "(function(log, test_results) { " + code_sample + code_after + "})(function(){}, _.test_results)";

            try {     
                eval(code); 
            } catch (e) {
                _.was_error("Could not compile sample");
            }
        },
        test_results: function(value) {
            try {
                var output = JSON.stringify(value);
                if(value && typeof value == 'object' && Object.keys(value).length > 0) {
                    $('#output').val(output);
                    _.logger("Your array was sorted!", "success");
                    $('#sort').attr('disabled', false).text('Sort Again');
                    _.item++;
                    setTimeout(function() {
                        $('#no').fadeIn();
                    }, 400);
                } else {
                    _.was_error("Didn't return a value.");
                }
            } catch (e) {
                _.was_error("Didn't return a valid list.");
            }
        },
    };


    /* Dom stuff */
    $('#sort-again').click(function() {
        $('#output').val("");
        _.run_snippet();
        return false;
    });

    $('#sort').click(function() {
        // Disclaimer
        // TODO: Use better modal?
        if(!confirm("Before you run: This fetches arbitary JavaScript from StackOverflow and eval()s it.\n\nThis is probably the worst thing ever; so be warned!")) {
            return false;
        }

        _.reset();

        $('#sort').attr('disabled', true).text('Sorting...');
        $('#logger .oc').remove();

        _.run_snippet();
    });

    $('#desc a').click(function() {
        if($(this).data('type') === 'list') {
            $('#input').val('[0,9,3,2,7]');
        } else if($(this).data('type') === 'words') {
            $('#input').val('["World","Hello"]');
        } else {
            $('#input').val('{3:"Hello",9:"World",1:"Oh,"}');
        }
        _.reset();
        return false;
    }).eq(0).trigger('click');

});
