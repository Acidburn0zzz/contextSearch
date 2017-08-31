var searchEngines = {};
var searchEnginesArray = [];
var selection = "";

function onError(error) {
    console.log(`Error: ${error}`)
}

function getIconUrl(head) {
  var links = head.getElementsByTagName("link");
  console.log(links);
  for (let link of links) {
  	let rel = link.getAttribute("rel");
  	if (rel === "icon" || rel === "shortcut icon") {
    	return link.getAttribute("href");
    }
  }
  return "";
}

function getFaviconUrl(url){
    return new Promise(function(resolve, reject) {
        var urlParts = url.replace('http://','').replace('https://','').split(/[/?#]/);
        var domain = urlParts[0];
        var head, faviconUrl = "";
        const req = new XMLHttpRequest();
        req.responseType = "document";
        req.overrideMimeType('text/html');
        req.setRequestHeader("Content-Type", "text/html");
        req.open('GET', domain, true); 
        req.send(null);
        req.onerror = reject(faviconUrl);
        req.onreadystatechange = function() {
            if (req.readyState === XMLHttpRequest.DONE && req.status === 200) {
                head = req.response.head;
                console.log(head);
                faviconUrl = getIconUrl(head);
                if (faviconUrl.indexOf("/") === 0) {
                    faviconUrl = url + faviconUrl;
                }
                console.log(faviconUrl);
                resolve(faviconUrl);
            }
        }
    });
}

// Create the context menu using the search engines listed above
function updateContextMenu(changes, area) {
    browser.contextMenus.removeAll();
    browser.storage.sync.get(null).then(
        (data) => {
            searchEngines = sortAlphabetically(data);
            searchEnginesArray = [];
            var index = 0;
            var strId, strTitle, url = "";
            for (var se in searchEngines) {
                strId = index.toString();
                strTitle = searchEngines[se].name;
                url = searchEngines[se].url;
//                faviconUrl = "https://s2.googleusercontent.com/s2/favicons?domain_url=" + url;
                getFaviconUrl(url).then(
                    function(faviconUrl){
                        if (typeof faviconUrl === "undefined") {
                            faviconUrl = "https://s2.googleusercontent.com/s2/favicons?domain_url=" + url;
                        } //*/
                        searchEnginesArray.push(se);
                        if (searchEngines[se].show) {
                            browser.contextMenus.create({
                                id: strId,
                                title: strTitle,
                                contexts: ["selection"],
                                icons: {
                                    18: faviconUrl
                                }
                            });
                        }    
                    },
                    function(faviconUrl){
                        console.log('Error loading favicon from ' + faviconUrl)
                    }
                );
                index += 1;
            }
        }
    );
}

// Perform search based on selected search engine, i.e. selected context menu item
browser.contextMenus.onClicked.addListener(function(info, tab) {
    var searchString = "";
    var targetUrl = "";
    var id = parseInt(info.menuItemId);
    
    // Prefer info.selectionText over selection received by content script for these lengths (more reliable)
    if (info.selectionText.length < 150 || info.selectionText.length > 150) {
	    selection = info.selectionText.trim();
    }
    if (searchEnginesArray[id] != "linkedin") {
        searchString = (selection.trim()).replace(/ /g, "+");
    } else {
        searchString = (selection).trim();
    }
    targetUrl = searchEngines[searchEnginesArray[id]].url + searchString;
    browser.tabs.create({
        url: targetUrl
    });
});

function getSelectedText(selectedText) {
    selection = selectedText;
}

updateContextMenu();
browser.storage.onChanged.addListener(updateContextMenu);
browser.runtime.onMessage.addListener(getSelectedText);
