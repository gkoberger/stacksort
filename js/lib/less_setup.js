var links = document.getElementsByTagName('link');
for (var i = 0; i < links.length; i++) {
    if (links[i].href.match(/\.less$/)) {
        links[i].type = "text/x-less";
    }
}
