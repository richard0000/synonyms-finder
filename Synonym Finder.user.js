// ==UserScript==
// @name         Synonym Finder
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Let the user to select a word (without spaces) anywhere in the DOM, and gives an option in the contextual menu to go for synonyms over the web
// @author       Ricardo Gamarra <r.richard0000@gmail.com>
// @match        http*://*/*
// @icon         https://cdn1.iconfinder.com/data/icons/web-tech-misc/80/duplicates-emulate-emulation-synonym-512.png
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @run-at          context-menu
// ==/UserScript==

(function () {
  "use strict";

  /**
   * Finds a synonym for a given word
   */
  class SynonymsFinder {
    constructor(word) {
      this.word = word;
    }

    find() {
      return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: "GET",
          url: `https://www.thesaurus.com/browse/${this.word}`,
          onload: function (response) {
            let parser = new DOMParser();
            let doc = parser.parseFromString(
              response.responseText,
              "text/html"
            );
            let synonymContainers = doc.getElementsByClassName(
              "css-1kg1yv8 eh475bn0"
            );
            let synonyms = [...synonymContainers].map((elem) => elem.innerText);
            resolve(synonyms);
          },
          onerror: function (error) {
            reject(error);
          },
        });
      });
    }
  }

  class SynonymsRenderer {
    constructor(synonyms, mainWord) {
      this.synonyms = synonyms;
      this.mainWord = mainWord;
    }

    capitalizeFirstLetter(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    }

    titleDiv(popup) {
      let titleDiv = popup.document.createElement("div");
      titleDiv.style =
        "text-align:center;font-family:Courier, monospace;color:#3e3e3e;font-weight:bold;text-shadow: 3px 3px 10px #5D4037";
      let title = popup.document.createElement("h1");
      title.innerHTML = `${this.synonyms.length} synonyms found for "${this.mainWord}"`;
      titleDiv.appendChild(title);

      return titleDiv;
    }

    listDiv(popup) {
      let listDiv = popup.document.createElement("div");
      listDiv.style =
        "border-radius:5px;background-color:#455A64;color:#fff;padding:20px;font-family:Courier, monospace;font-size:16px";
      let list = popup.document.createElement("ul");
      this.synonyms.forEach((synonym) => {
        let item = popup.document.createElement("li");
        item.innerHTML = this.capitalizeFirstLetter(synonym);
        list.appendChild(item);
      });
      listDiv.appendChild(list);

      return listDiv;
    }

    render() {
      let popup = open(
        "",
        "Popup",
        "toolbar=yes,scrollbars=yes,resizable=yes,top=500,left=500,width=400,height=400;"
      );

      popup.document.body.innerHTML = "";
      popup.document.body.appendChild(this.titleDiv(popup));
      popup.document.body.appendChild(this.listDiv(popup));
    }
  }

  /**
   * Catches a word when a user selects text from the DOM. Validates the selection being a text and only 1 word.
   * If it detects a space, the user will get an alert with a message like: "Please, select only one word to let me find synonyms"
   */
  class SynonymAugmenter {
    constructor() {
      this.userSelection = this.getUserSelection();
    }

    getUserSelection() {
      return window.getSelection().toString();
    }

    augment() {
      if (this.userSelection == "") {
        alert("Please, select only one word to let me find synonyms");
        return;
      }

      let finder = new SynonymsFinder(this.userSelection);
      finder.find().then((results) => {
        let renderer = new SynonymsRenderer(results, this.userSelection);
        renderer.render();
      });
    }
  }

  GM_registerMenuCommand("Search Synonyms", triggerAugmenter(), "S");

  function triggerAugmenter() {
    console.log("triggering augmenter");
    let augmenter = new SynonymAugmenter();
    return augmenter.augment();
  }
})();
