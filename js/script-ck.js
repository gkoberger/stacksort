/* Don't judge me! This code is everything from badly written to extremely dangerous. */$(function(){function parseArray(e){return e?JSON.parse(e):[]}var VERSION="5";if(window.localStorage.ss_version!==VERSION){delete window.localStorage.answers;delete window.localStorage.ss_page;window.localStorage.ss_version=VERSION}String.prototype.trim||(String.prototype.trim=function(){return this.replace(/^\s+|\s+$/g,"")});var _={page:window.localStorage.ss_page||1,item:0,answers:parseArray(window.localStorage.answers),api:"http://api.stackexchange.com/2.1/",reset:function(){_.item=0;$("#output").val("");$("#logger").empty().append($("<div>",{"class":"oc",text:"output console"}));$("#sort").attr("disabled",!1).text("Sort");$("#no").hide()},logger:function(e,t,n){var r=$("<div>",{html:e,"class":"log-"+t});$("#logger").append(r);n&&r.append(n);$("#logger")[0].scrollTop=$("#logger")[0].scrollHeight},was_error:function(e){e&&_.logger(e,"error");_.item++;_.run_snippet()},get_next_page:function(){if(parseInt(_.page)>=7){_.logger("All out of answers!","error");_.wait(!1);return!1}_.logger("Fetching page "+_.page+"...","trying");var e="&pagesize=100&order=desc&site=stackoverflow&todate=1363473554",t=_.api+"questions?sort=activity&tagged=sort;javascript&page="+_.page+e;$.get(t,function(t){var n=[];$.each(t.items,function(e,t){t.accepted_answer_id&&n.push(t.accepted_answer_id)});var r=_.api+"answers/"+n.join(";")+"?sort=activity&filter=!9hnGsyXaB"+e;$.get(r,function(e){_.logger("Answers downloading, ready to run.","success");$.each(e.items,function(e,t){_.answers.push({answer_id:t.answer_id,question_id:t.question_id,link:"http://stackoverflow.com/questions/"+t.question_id+"/#"+t.answer_id,body:t.body})});window.localStorage.answers=JSON.stringify(_.answers);_.page=parseInt(_.page,10)+1;window.localStorage.ss_page=_.page;_.run_snippet()})})},run_snippet:function(){if(_.item>=_.answers.length){_.get_next_page();return!1}var e=_.answers[_.item].answer_id;$("#no").hide();_.wait(!0);setTimeout(function(){var e=_.answers[_.item].answer_id,t=_.answers[_.item].link;_.logger("Trying StackOverflow answer #","trying",$("<a>",{text:e,href:t,target:"_blank"}));_.run_snippet_go()},230)},run_snippet_go:function(){var answer=_.answers[_.item].body,answer_id=_.answers[_.item].answer_id,question_id=_.answers[_.item].question_id,link=_.answers[_.item].link,codes=answer.match(/<code>(.|[\n\r])*?<\/code>/g);if(!codes){_.was_error("Could not find a code snippet");return!1}var code_sample=codes[codes.length-1];code_sample=code_sample.replace("<code>","").replace("</code>","");code_sample=code_sample.replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&");code_sample=code_sample.replace(/(console.log|alert)\(/g,"log(");if(code_sample.indexOf("cookie")>=0||code_sample.indexOf("getElement")>=0||code_sample.indexOf("$(")>=0||code_sample.indexOf("_.")>=0||code_sample.indexOf("Backbone")>=0||code_sample.indexOf("new Date")>=0){_.was_error("Contained potentially bad code");return!1}var fname_raw=code_sample.match(/(?:function (\w*)|var (\w*) = function)/),fname=null;if(!fname_raw){_.was_error("Could not extract a function to run");return!1}fname=fname_raw[1]||fname_raw[2];if(!fname){_.was_error("Could not extract a function to run");return!1}var code_after=";test_results("+fname+"("+$("#input").val()+"));",code="(function(log, test_results) { "+code_sample+code_after+"})(function(){}, _.test_results)";try{eval(code)}catch(e){_.was_error("Could not compile sample")}},test_results:function(e){try{var t=JSON.stringify(e);if(e&&typeof e=="object"&&Object.keys(e).length>0){$("#output").val(t);_.logger("Your array was sorted!","success");$("#sort").attr("disabled",!1).text("Sort Again");_.wait(!1);_.item++;setTimeout(function(){$("#no").fadeIn()},400)}else _.was_error("Didn't return a value.")}catch(n){_.was_error("Didn't return a valid list.")}},wait:function(e){$(".sad-waiter").css({height:e?137:0}).find(".hour, .minute").css({display:e?"block":"none"})}};$("#sort-again").click(function(){$("#output").val("");$("#sort").attr("disabled",!0).text("Sorting...");_.run_snippet();return!1});$("#sort").click(function(){if(!confirm("Before you run: This fetches arbitary JavaScript from StackOverflow and eval()s it.\n\nThis is probably the worst thing ever; so be warned!"))return!1;_.reset();$("#sort").attr("disabled",!0).text("Sorting...");$("#logger .oc").remove();_.run_snippet()});$("#desc a").click(function(){$(this).data("type")==="list"?$("#input").val("[9,0,3,2,7]"):$(this).data("type")==="words"?$("#input").val('["World","Hello"]'):$("#input").val('{3:"Hello",9:"World",1:"Oh,"}');_.reset();return!1}).eq(0).trigger("click")});