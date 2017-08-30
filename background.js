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
    let urlParts = url.replace('http://','').replace('https://','').split(/[/?#]/);
    let domain = urlParts[0];
	let head, faviconUrl = "";
	const req = new XMLHttpRequest();
    req.responseType = "document";
	req.open('GET', domain, true); 
	req.send(null);
	req.onreadystatechange = function() {
  	if (req.readyState === XMLHttpRequest.DONE && req.status === 200) {
      head = req.response.head;
      console.log(head);
      faviconUrl = getIconUrl(head);
      if (faviconUrl.indexOf("/") === 0) {
      	faviconUrl = url + faviconUrl;
      }
      console.log(faviconUrl);
      return faviconUrl;
	  }
	}
}

// Create the context menu using the search engines listed above
function updateContextMenu(changes, area) {
    browser.contextMenus.removeAll();
    browser.storage.sync.get(null).then(
        (data) => {
            searchEngines = sortAlphabetically(data);
            searchEnginesArray = [];
            var index = 0;
            var strId, strTitle, url, faviconUrl = "";
            for (var se in searchEngines) {
                strId = index.toString();
                strTitle = searchEngines[se].name;
                url = searchEngines[se].url;
                faviconUrl = getFaviconUrl(url); // I think I need to add 'then' here?    
                if (typeof faviconUrl === "undefined") {
                    faviconUrl = "https://s2.googleusercontent.com/s2/favicons?domain_url=" + url;
                }
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
