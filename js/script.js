$(function() {
    function logger(text, class_suffix) {
        $('#logger').append($('<div>', {'html': text, 'class': 'log-' + class_suffix}));
    }
    function run_next(reason) {
        item++;
        logger(reason);
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
            logger("Out of snippets to try", 1);
            return false;
        }
        var answer = answers[item].body;
        var answer_id = answers[item].answer_id;
        var question_id = answers[item].question_id;
        var codes = answer.match(/<code>(.|[\n\r])*?<\/code>/g);

        if(!codes) {
            run_next("Could not find a code snippet");
            return false;
        }

        var code_sample = codes[codes.length - 1];

        // Output!
        logger("Trying StackOverflow Answer " + answer_id, 2);

        // "Clean" up the code
        code_sample = code_sample.replace("<code>", "").replace("</code>", "");
        code_sample = code_sample.replace("&lt;", "<").replace("&gt;", ">");
        code_sample = code_sample.replace("alert(", "console.log(");

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

    function test_results(value) {
        try { 
            var output = JSON.stringify(value);
            if(output) {
                $('#output').val(output); 
                logger("Your array was sorted!", 3);
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
        $('#sort').trigger('click');
    });

    $('#sort').click(function() {
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
