/* Don't judge me! This code is everything from badly written to extremely dangerous. */$(function(){function reset(){item=0;$("#output").val("");$("#logger").empty();$("#logger").append($("<div>",{"class":"oc",text:"output console"}));$("#no").hide()}function logger(e,t){$("#logger").append($("<div>",{html:e,"class":"log-"+t}));$("#logger")[0].scrollTop=$("#logger")[0].scrollHeight}function run_next(e){item++;e&&logger(e,"error");$(window).trigger("run_snippet")}function test_results(e){try{var t=JSON.stringify(e);if(e&&(e.length>0||Object.keys(e).length>0)){$("#output").val(t);logger("Your array was sorted!","success");$("#no").show()}else run_next("Didn't return a value.")}catch(n){run_next("Didn't return a valid list.")}}$("#desc a").click(function(){$(this).data("type")=="list"?$("#input").val("[0, 9, 3, 2, 7]"):$("#input").val('{9: "World", 3: "Hello", 1: "Oh,"}');reset();return!1}).eq(0).trigger("click");var answers=window.localStorage.answers;answers?answers=JSON.parse(answers):answers=[];var item=0;$(window).bind("run_snippet",function(){if(item>=answers.length){logger("Out of snippets to try","error");return!1}var e=answers[item].answer_id;$("#no").hide();setTimeout(function(){var e=answers[item].answer_id;logger("Trying StackOverflow Answer "+e,"trying");setTimeout(function(){$(window).trigger("run_snippet_go")},50)},50)});$(window).bind("run_snippet_go",function(){var answer=answers[item].body,answer_id=answers[item].answer_id,question_id=answers[item].question_id,codes=answer.match(/<code>(.|[\n\r])*?<\/code>/g);if(!codes){run_next("Could not find a code snippet");return!1}var code_sample=codes[codes.length-1];code_sample=code_sample.replace("<code>","").replace("</code>","");code_sample=code_sample.replace("&lt;","<").replace("&gt;",">");code_sample=code_sample.replace("alert(","console.log(");if(code_sample.indexOf("cookie")>=0){run_next("Contained potentially bad code");return!1}var fname_raw=code_sample.match(/(?:function (\w*)|var (\w*) = function)/);if(!fname_raw){run_next("Could not extract a function to run");return!1}var fname=fname_raw[1]||fname_raw[2];if(!fname){run_next("Could not extract a function to run");return!1}var code_after=";test_results("+fname+"("+$("#input").val()+"));",code=code_sample+code_after;try{eval(code)}catch(e){run_next("Could not compile sample")}});String.prototype.trim||(String.prototype.trim=function(){return this.replace(/^\s+|\s+$/g,"")});var api="http://api.stackexchange.com/2.1/";$("#sort-again").click(function(){item++;$(window).trigger("run_snippet");return!1});$("#sort").click(function(){if(!confirm("Before you run: This fetches arbitary JavaScript from StackOverflow and eval()s it.\n\nThis is probably the worst thing ever; so proceed with extreme caution."))return!1;reset();$("#logger .oc").remove();answers.length?$(window).trigger("run_snippet"):$.get(api+"questions?pagesize=100&order=desc&sort=votes&tagged=sort;javascript&site=stackoverflow&todate=1363473554",function(e){var t=[];$.each(e.items,function(e,n){n.accepted_answer_id&&t.push(n.accepted_answer_id)});$.get(api+"answers/"+t.join(";")+"?pagesize=100&order=desc&sort=activity&site=stackoverflow&todate=1363473554&filter=!9hnGsyXaB",function(e){answers=[];$.each(e.items,function(e,t){answers.push({answer_id:t.answer_id,question_id:t.question_id,body:t.body})});window.localStorage.answers=JSON.stringify(answers);$(window).trigger("run_snippet")})})})});