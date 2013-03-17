/* Don't judge me! This code is everything from badly written to extremely dangerous. */

$(function() {
    $('#desc a').click(function() {
        if($(this).data('type') == 'list') {
            $('#input').val('[0, 9, 3, 2, 7]');
        } else {
            $('#input').val('{9: "World", 3: "Hello", 1: "Oh,"}');
        }
        reset();

        return false;
    }).eq(0).trigger('click');

    function reset() {
        item = 0;
        $('#output').val('');
        $('#logger').empty();
        $('#logger').append($('<div>', {class: 'oc', text: 'output console'}));
        $('#no').hide();
    }

    function logger(text, class_suffix, to_append) {
        var $div = $('<div>', {'html': text, 'class': 'log-' + class_suffix})
        $('#logger').append($div);

        if(to_append) {
            $div.append(to_append);
        }

        $('#logger')[0].scrollTop = $('#logger')[0].scrollHeight;
    }
    function run_next(reason) {
        item++;
        if(reason) logger(reason, "error");

        $(window).trigger('run_snippet');
    }

    var answers = window.localStorage['answers'];
    if(!answers) {
        answers = [];
    } else {
        answers = JSON.parse(answers);
    }

    var item = 0;
    $(window).bind('run_snippet', function() {
        if(item >= answers.length) {
            logger("Out of snippets to try", "error");
            return false;
        }

        var answer_id = answers[item].answer_id;

        $('#no').hide();
        
        // Output!
        setTimeout(function() {
            var answer_id = answers[item].answer_id;
            var link = answers[item].link;

            logger("Trying StackOverflow answer #", "trying", $('<a>', {'text': answer_id, 'href': link, 'target': '_blank'}));

            setTimeout(function() {
                $(window).trigger('run_snippet_go');
            }, 50); // Don't freeze up the browser
        }, 50); // Don't freeze up the browser

    });
    $(window).bind('run_snippet_go', function() {
        var answer = answers[item].body;
        var answer_id = answers[item].answer_id;
        var question_id = answers[item].question_id;
        var link = answers[item].link;
        var codes = answer.match(/<code>(.|[\n\r])*?<\/code>/g);

        if(!codes) {
            run_next("Could not find a code snippet");
            return false;
        }

        var code_sample = codes[codes.length - 1];

        // "Clean" up the code
        code_sample = code_sample.replace("<code>", "").replace("</code>", "");
        code_sample = code_sample.replace("&lt;", "<").replace("&gt;", ">");
        code_sample = code_sample.replace("alert(", "console.log(");
        
        // Check for some basic issues
        if(code_sample.indexOf("cookie") >= 0) {
            run_next("Contained potentially bad code");
            return false;
        }

        // Get the function name
        var fname_raw = code_sample.match(/(?:function (\w*)|var (\w*) = function)/);
        if(fname_raw) {
            var fname = fname_raw[1] || fname_raw[2];
            if(!fname) {
                run_next("Could not extract a function to run");
                return false;
            }
        } else {
            run_next("Could not extract a function to run");
            return false;
        }


        // Construct the code to eval()
        var code_after = ";test_results(" + fname + "(" + $('#input').val() + "));";

        var code = code_sample + code_after;

        try {     
            eval(code); 
        } catch (e) {
            run_next("Could not compile sample");
        }
    });

    if(!String.prototype.trim) {
        String.prototype.trim = function () {
            return this.replace(/^\s+|\s+$/g,'');
        };
    }

    function test_results(value) {
        try { 
            var output = JSON.stringify(value);
            if(value && (value.length > 0 || Object.keys(value).length > 0)) {
                $('#output').val(output); 
                logger("Your array was sorted!", "success");
                setTimeout(function() {
                    $('#no').fadeIn();
                }, 700);
            } else {
                run_next("Didn't return a value.");
            }
        } catch (e) {
            run_next("Didn't return a valid list.");
        }
    }

    var api = 'http://api.stackexchange.com/2.1/';

    $('#sort-again').click(function() {
        item++;
        $('#output').val("");
        $(window).trigger('run_snippet');
        return false;
    });

    $('#sort').click(function() {
        // Disclaimer
        if(!confirm("Before you run: This fetches arbitary JavaScript from StackOverflow and eval()s it.\n\nThis is probably the worst thing ever; so be warned!")) {
            return false;
        }

        reset();
        $('#logger .oc').remove();

        if(!answers.length) {
            $.get(api + 'questions?pagesize=100&order=desc&sort=votes&tagged=sort;javascript&site=stackoverflow&todate=1363473554', function(d) {
                var answer_ids = [];
                $.each(d.items, function(k, v) {
                    if(v.accepted_answer_id) {
                        answer_ids.push(v.accepted_answer_id);
                    }
                });

                $.get(api + 'answers/' + answer_ids.join(';') + '?pagesize=100&order=desc&sort=activity&site=stackoverflow&todate=1363473554&filter=!9hnGsyXaB', function(d2) {
                    answers = [];

                    $.each(d2.items, function(k, v){
                        answers.push({
                            'answer_id': v.answer_id, 
                            'question_id': v.question_id, 
                            'link': 'http://stackoverflow.com/questions/'+v.question_id+'/#' + v.answer_id,
                            'body': v.body
                        });
                    });

                    window.localStorage['answers'] = JSON.stringify(answers);
                    $(window).trigger('run_snippet');
                });
            });
        } else {
            $(window).trigger('run_snippet');
        }
    });
});
