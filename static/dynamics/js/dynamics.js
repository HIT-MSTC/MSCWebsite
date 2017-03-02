/**
 * Created by Robert Xie
 * © 2015 HIT Microsoft Club
 * All Rights Reserved
 */

var types, dynamics;
var codeIndex;

function classify(odyns) {
    var classifiedArray = [];
    var currentType;
    var currentTypeArray;
    classifiedArray.push({"Type": "All", "Dynamics": odyns});
    var dyns = odyns.concat();
    dyns.sort(function (dyn1, dyn2) {
        if (dyn1.Type < dyn2.Type) {
            return -1;
        }
        else if (dyn1.Type == dyn2.Type) {
            return 0;
        }
        else {
            return 1;
        }
    });
    for (var index = 0; index < dyns.length; index++) {
        var dynamic = dyns[index];
        if (dynamic.Type != currentType) {
            if (currentType != undefined) {
                classifiedArray.push({"Type": currentType, "Dynamics": currentTypeArray});
            }
            currentType = dynamic.Type;
            currentTypeArray = [dynamic];
        }
        else {
            currentTypeArray.push(dynamic);
        }
    }
    classifiedArray.push({"Type": currentType, "Dynamics": currentTypeArray});
    return classifiedArray;
}

function load() {
    reading = false;
    processCSRFToken();
    $.get(DynamicsAPI.Get)
        .done(function (data) {
            types = data.Types;
            types["All"] = "全部";
            dynamics = data.Dynamics;
            dynamicsList = $("#dynamics-list");
            var classifiedArray = classify(dynamics);
            var namespace = {};
            for (var index = 0; index < classifiedArray.length; index++) {
                var typeArray = classifiedArray[index];
                namespace[typeArray.Type] = new WinJS.Binding.List(typeArray.Dynamics);
                dynamicsList[0].innerHTML +=
                    "<div class=\"pivotItem\" data-win-control=\"WinJS.UI.PivotItem\" data-win-options=\"{'header':'" + types[typeArray.Type] + "' }\">" +
                    "<div data-win-control=\"WinJS.UI.Repeater\" data-win-options=\"{ data: Dynamics." + typeArray.Type + ", template: select('#dynamics-template') }\"></div>" +
                    "</div>";
            }
            WinJS.Namespace.define("Dynamics", namespace);
            WinJS.UI.processAll().done(function () {
                if (!isMobile()) {
                    var splitView = document.querySelector(".splitView").winControl;
                    new WinJS.UI._WinKeyboard(splitView.paneElement);
                }
                initializeJquery();
                window.onresize = resizeDynamics;
                resizeDynamics();
                var selectedID = Cookies.get("selected-id");
                var selectedIDGet = getQueryString("ID");
                if (selectedIDGet != undefined) {
                    setTimeout(function () {
                        var dynamicsDiv = $(".win-repeater .dynamics-content");
                        var selectedDynamicsDiv = $.grep(dynamicsDiv, function (dynDiv, index) {
                            var dynIDDiv = $(dynDiv).children(".dynamics-id")[0];
                            return dynIDDiv.innerHTML == selectedIDGet;
                        });
                        $(selectedDynamicsDiv).addClass("selected");
                        loadDynamics(selectedIDGet);
                    }, 100);
                    reading = true;
                }
                else if (selectedID != undefined) {
                    setTimeout(function () {
                        var dynamicsDiv = $(".win-repeater .dynamics-content");
                        var selectedDynamicsDiv = $.grep(dynamicsDiv, function (dynDiv, index) {
                            var dynIDDiv = $(dynDiv).children(".dynamics-id")[0];
                            return dynIDDiv.innerHTML == selectedID;
                        });
                        $(selectedDynamicsDiv).addClass("selected");
                        loadDynamics(selectedID);
                    }, 100);
                    reading = true;
                }
                showBody();
            });
        })
        .fail(showErrorDialog);
}

function initializeJquery() {
    header = $("#header")[0];
    dynamicsContent = $(".dynamics-content");
    pivotItem = $(".pivotItem");
    text = $("#text");
    textContent = $("#text-content");
    title = $("#title");
    author = $("#author");
    publishDate = $("#publish-date");
    main = $("#main");
    form = $("#form");
    formDialog = $("#form-dialog")[0].winControl;
}

function resizeDynamics() {
    var windowHeight = window.innerHeight;
    var headerHeight = header.clientHeight;
    var dynamicsHeight = windowHeight - headerHeight - 100;
    if (isMobile()) {
        dynamicsList.css("height", dynamicsHeight);
        // WinJS BugFix: Pivot Unable to Scroll on non-IE Browsers
        pivotItem.css("height", dynamicsHeight - 50);
        text.css("display", "none");
    }
    else {
        dynamicsList.css("height", dynamicsHeight);
        // WinJS BugFix: Pivot Unable to Scroll on non-IE Browsers
        pivotItem.css("height", dynamicsHeight - 50);
        text.css({"display": "block", "height": dynamicsHeight});
    }
    dynamicsList[0].winControl.forceLayout();
}

function selectDynamics(selectedDiv) {
    if (selected) {
        selected.removeClass("selected");
    }
    selected = $(selectedDiv);
    var selectedID = selected.children(".dynamics-id")[0].innerHTML;
    selected.addClass("selected");
    if (isMobile()) {
        window.location.href = "/dynamics-mobile/?ID=" + selectedID;
    }
    else {
        if (lastSelectedID == selectedID) {
            return;
        }
        if (reading) {
            textContent.animate({"opacity": 0}, "fast", function () {
                loadDynamics(selectedID);
            });
        }
        else {
            loadDynamics(selectedID);
        }
        lastSelectedID = selectedID;
        reading = true;
    }
}

function loadDynamics(id) {
    var firefox = isFirefox();
    codeIndex = 0;
    var selectedDynamics = $.grep(dynamics, function (dyn, index) {
        return dyn.ID == id;
    }, false)[0];
    title.html(selectedDynamics.Title);
    author.html(selectedDynamics.Author);
    publishDate.html(selectedDynamics.PublishDate);
    main.html(selectedDynamics.Content);
    main.find("code, pre").each(function () {
        // highlight.js BugFix: Unable to Replace "\n" with "<br>"
        var codeContainer = $(this);
        if (codeContainer.find("code, pre").size() != 0) {
            return;
        }
        var code = firefox ? this.textContent : this.innerText;
        var brush = codeContainer.attr('class').match(/brush:(.+);/i)[1];
        var highlightMiddle;
        if (brush) {
            if (brush == "c#") {
                brush = "cs";
            }
            highlightMiddle = hljs.highlight(brush, code);
        }
        else {
            highlightMiddle = hljs.highlightAuto(code);
        }
        var codeToolBar = document.createElement("div");
        codeToolBar.className = "code-toolbar";
        codeToolBar.style.opacity = 0;
        var codeLanguage = document.createElement("div");
        codeLanguage.className = "code-language";
        codeLanguage.innerHTML = "代码语言：" + highlightMiddle.language.toUpperCase();
        var codeCopy = document.createElement("a");
        codeCopy.className = "code-copy";
        codeCopy.innerHTML = "复制";
        codeToolBar.appendChild(codeLanguage);
        codeToolBar.appendChild(codeCopy);
        var codeContent = document.createElement("div");
        codeContent.id = "code" + codeIndex;
        codeContent.className = "code";
        codeContent.innerHTML = highlightMiddle.value;
        codeContainer.addClass("hljs " + highlightMiddle.language);
        codeContainer.html("");
        codeContainer[0].appendChild(codeToolBar);
        codeContainer[0].appendChild(codeContent);
        codeContainer[0].onmouseover = showCodeToolbar;
        codeContainer[0].onmouseout = hideCodeToolbar;
        var copyLink = codeContainer.find(".code-copy");
        var client = new ZeroClipboard(copyLink);
        client.on("copy", function (event) {
            var clipboard = event.clipboardData;
            clipboard.setData("text/plain", code);
        });
        client.on("aftercopy", showCodeDialog);
        codeIndex++;
    });
    if (selectedDynamics.PaperID != "null" && selectedDynamics.PaperEnabled) {
        form.html('<button class="win-button" onclick="showFormDialog(' + selectedDynamics.PaperID + ')">参加活动</button>');
    }
    else {
        form.html('');
    }
    sendTelemetry(id);
    textContent.animate({"opacity": 1.0}, "fast");
}

function testOut(e, object) {
    if (e.relatedTarget) {
        return e.relatedTarget != object &&
            e.relatedTarget.parentNode != object &&
            e.relatedTarget.id != "global-zeroclipboard-html-bridge" &&
            e.relatedTarget.id != "global-zeroclipboard-flash-bridge";
    }
    else if (e.toElement) {
        return e.toElement != object &&
            e.toElement.parentNode != object &&
            e.toElement.id != "global-zeroclipboard-html-bridge" &&
            e.toElement.id != "global-zeroclipboard-flash-bridge";
    }
    else {
        return false;
    }
}
function showCodeToolbar() {
    var toolbar = $(this).find(".code-toolbar");
    toolbar.stop(true, false);
    toolbar.animate({"opacity": 1.0}, "fast");
}
function hideCodeToolbar(e) {
    if (testOut(e, this)) {
        var toolbar = $(this).find(".code-toolbar");
        toolbar.stop(true, false);
        toolbar.animate({"opacity": 0}, "fast");
    }
}

function showCodeDialog() {
    var codeDialog = $("#code-dialog")[0].winControl;
    codeDialog.show();
    codeDialog.addEventListener("beforehide", hideCodeDialog, false);
}

function hideCodeDialog(e) {
    if (e.detail.result == WinJS.UI.ContentDialog.DismissalResult.none) {
        e.preventDefault();
    }
}
function showFormDialog(paperID) {
    $.get(PaperAPI.Get, {"ID": paperID})
        .done(function (data) {
            currentPaperID = paperID;
            questions = $.evalJSON(data.Questions);
            formDialog.show();
            formDialog.addEventListener("beforehide", hideForm, false);
            $("#form-dialog").find(".win-contentdialog-content")[0].innerHTML = data.HTML;
        })
        .fail(showErrorDialog);
}

function hideForm(e) {
    switch (e.detail.result) {
        case WinJS.UI.ContentDialog.DismissalResult.none:
            e.preventDefault();
            break;
        case WinJS.UI.ContentDialog.DismissalResult.primary:
            var answer = {};
            answer.csrfmiddlewaretoken = csrfToken;
            answer.PaperID = currentPaperID;
            var answerDict = {};
            for (var questionIndex = 0; questionIndex < questions.length; questionIndex++) {
                var currentQuestion = questions[questionIndex];
                var answerContainer = $("#answer" + currentQuestion.ID);
                switch (currentQuestion.Type) {
                    case "Single":
                        answerDict[currentQuestion.ID] = answerContainer[0].value;
                        break;
                    case "Multiple":
                        var checked = answerContainer.find(":checkbox:checked");
                        var answerArray = [];
                        for (var checkedIndex = 0; checkedIndex < checked.length; checkedIndex++) {
                            answerArray.push($(checked[checkedIndex]).next()[0].innerHTML);
                        }
                        answerDict[currentQuestion.ID] = answerArray.join("#");
                        break;
                    case "Blank":
                        answerDict[currentQuestion.ID] = answerContainer[0].value;
                        break;
                    case "LongBlank":
                        answerDict[currentQuestion.ID] = answerContainer[0].value;
                        break;
                }
            }
            answer.Answer = $.toJSON(answerDict);
            $.post(PaperAPI.Answer, answer)
                .done(function (data) {
                    if (data.Status != "success") {
                        showErrorDialog();
                        return;
                    }
                    showSuccessDialog();
                })
                .fail(showErrorDialog);
            break;
        case WinJS.UI.ContentDialog.DismissalResult.secondary:
            break;
    }
}