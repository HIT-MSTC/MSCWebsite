/**
 * Created by Robert Xie
 * © 2015 HIT Microsoft Club
 * All Rights Reserved
 */

var types, dynamics;

function load() {
    reading = false;
    processCSRFToken();
    $.get(DynamicsAPI.Get)
        .done(function (data) {
            types = data.Types;
            dynamics = data.Dynamics;
            WinJS.Namespace.define("MSTCWebsite", {
                "Dynamics": new WinJS.Binding.List(dynamics)
            });
            WinJS.Utilities.markSupportedForProcessing(selectDynamics);
            WinJS.UI.processAll().done(function () {
                var splitView = document.querySelector(".splitView").winControl;
                new WinJS.UI._WinKeyboard(splitView.paneElement);
                initializeJquery();
                resizeDynamics();
                loadTypes();
                getEnroll();
                window.onresize = resizeDynamics;
                var blankDivContent = document.createElement("div");
                blankDivContent.className = "blank-div";
                editorDiv[0].insertBefore(blankDivContent, editorDiv[0].firstChild);
                blankDiv = $(blankDivContent);
                showBody();
            });
        })
        .fail(showErrorDialog);
}

function initializeJquery() {
    header = $("#header")[0];
    dynamicsListView = $("#dynamics-list");
    designer = $("#designer");
    designerContainer = $("#designer-container");
    title = $("#title")[0];
    author = $("#author")[0];
    typeSelect = $("#type-select");
    abstract = $("#abstract")[0];
    editor = UE.getEditor('id_Content');
    editorDiv = $("#id_Content");
    editorUI = $("#edui1");
    editorIframe = $("#edui1_iframeholder");
    editorToolbar = $("#edui1_toolbarbox");
    cmdPaper = $("#cmdPaper")[0];
    paperFlyout = $("#paperFlyout")[0].winControl;
    cmdSave = $("#cmdSave")[0];
    saveFlyout = $("#saveFlyout")[0].winControl;
    enrollImg = $("#enroll-img");
    paperStateRow = $("#paper-state-row");
    paperState = $("#paper-state")[0].winControl;
    viewedTimes = $("#viewed-times")[0];
    dynamicsURLDialog = $("#url-dialog")[0].winControl;
    dynamicsURL = $("#dynamics-url")[0];
    copiedDialog = $("#copied-dialog")[0].winControl;
    notSelectedDialog = $("#notselected-dialog")[0].winControl;
}

function resizeDynamics() {
    var windowsHeight = window.innerHeight;
    var headerHeight = header.clientHeight;
    var dynamicsListHeight = windowsHeight - headerHeight - 150;
    var designerWidth = designer[0].clientWidth;
    dynamicsListView.css("height", dynamicsListHeight);
    dynamicsListView[0].winControl.forceLayout();
    designer.css("height", dynamicsListHeight);
    editorDiv.css("width", designerWidth - 60);
    editorUI.css("width", designerWidth - 60);
    editorIframe.css("width", designerWidth - 60);
    editorToolbar.css("width", designerWidth - 62.666);
}

function loadTypes() {
    typeSelect.html("");
    var typeNames = Object.keys(types);
    for (var typeIndex = 0; typeIndex < typeNames.length; typeIndex++) {
        var currentTypeName = typeNames[typeIndex];
        var option = document.createElement("option");
        option.id = currentTypeName;
        option.value = currentTypeName;
        option.innerHTML = types[currentTypeName];
        typeSelect[0].appendChild(option);
    }
}

function getEnroll() {
    $.get(PaperAPI.GetEnroll)
        .done(function (data) {
            enrollDynamic = data.Dynamic;
        })
        .fail(showErrorDialog);
}

function selectDynamics(e) {
    var selectedIndex = e.detail.itemIndex;
    if (lastSelectedIndex == selectedIndex) {
        return;
    }
    var selectedID = MSTCWebsite.Dynamics.getAt(selectedIndex).ID;
    if (reading) {
        designerContainer.animate({"opacity": 0}, "fast", function () {
            if (selectedID == enrollDynamic) {
                enrollImg.css("display", "block");
            }
            else {
                enrollImg.css("display", "none");
            }
            modifyDynamics(lastSelectedIndex);
            loadDynamics(selectedIndex);
            lastSelectedID = selectedID;
            lastSelectedIndex = selectedIndex;
        });
    }
    else {
        if (selectedID == enrollDynamic) {
            enrollImg.css("display", "block");
        }
        else {
            enrollImg.css("display", "none");
        }
        loadDynamics(selectedIndex);
        lastSelectedID = selectedID;
        lastSelectedIndex = selectedIndex;
    }
    reading = true;
}

function addDynamics() {
    $.post(DynamicsAPI.Add, {"csrfmiddlewaretoken": csrfToken})
        .done(function (newDynamics) {
            MSTCWebsite.Dynamics.push(newDynamics);
        })
        .fail(showErrorDialog);
}

function deleteDynamics() {
    if (lastSelectedIndex == undefined) {
        notSelectedDialog.addEventListener("beforehide", hideDialog, false);
        notSelectedDialog.show();
        return;
    }
    $.post(DynamicsAPI.Delete, {"ID": lastSelectedID, "csrfmiddlewaretoken": csrfToken})
        .done(function (data) {
            if (data.Status != "success") {
                showErrorDialog();
                return;
            }
            designerContainer.animate({"opacity": 0}, "fast");
            MSTCWebsite.Dynamics.splice(lastSelectedIndex, 1);
            lastSelectedIndex = undefined;
            lastSelectedID = undefined;
            reading = false;
        })
        .fail(showErrorDialog);
}
function isSameDynamics(dynamics1, dynamics2) {
    return (dynamics1.Title == dynamics2.Title) &&
        (dynamics1.Type == dynamics2.Type) &&
        (dynamics1.Author == dynamics2.Author) &&
        (dynamics1.Abstract == dynamics2.Abstract) &&
        (dynamics1.PaperEnabled == dynamics2.PaperEnabled) &&
        (dynamics1.Content == dynamics2.Content) &&
        (dynamics1.ViewedTimes == dynamics2.ViewedTimes);
}
function modifyDynamics(index) {
    updateDynamics(index);
}

function saveDynamics() {
    if (lastSelectedIndex == undefined) {
        notSelectedDialog.addEventListener("beforehide", hideDialog, false);
        notSelectedDialog.show();
        return;
    }
    updateDynamics(lastSelectedIndex);
}

function updateDynamics(index) {
    var oldDynamics = MSTCWebsite.Dynamics.getAt(index);
    var newDynamics = {};
    newDynamics.csrfmiddlewaretoken = csrfToken;
    newDynamics.ID = lastSelectedID;
    newDynamics.PaperID = oldDynamics.PaperID;
    newDynamics.Title = title.value;
    newDynamics.Type = typeSelect[0].value;
    newDynamics.Author = author.value;
    newDynamics.Abstract = abstract.value;
    if (newDynamics.PaperID == "null") {
        newDynamics.PaperEnabled = false;
    }
    else {
        newDynamics.PaperEnabled = paperState.checked;
    }
    newDynamics.Content = editor.getContent();
    newDynamics.ViewedTimes = viewedTimes.value;
    if (isSameDynamics(oldDynamics, newDynamics)) {
        return;
    }
    $.post(DynamicsAPI.Modify, newDynamics)
        .done(function (data) {
            if (data.Status != "success") {
                showErrorDialog();
                return;
            }
            saveSuccess();
            MSTCWebsite.Dynamics.setAt(index, newDynamics);
        })
        .fail(showErrorDialog);
}

function generateURL(){
    if(lastSelectedIndex != undefined){
        var selectedDynamics = MSTCWebsite.Dynamics.getAt(lastSelectedIndex);
        dynamicsURL.innerHTML = "http://" + window.location.host + "/dynamics/?ID=" + selectedDynamics.ID;
        var client = new ZeroClipboard(dynamicsURL);
        client.on("copy", function (event) {
            var clipboard = event.clipboardData;
            clipboard.setData("text/plain", dynamicsURL.innerHTML);
        });
        client.on("aftercopy", showCopiedDialog);
        dynamicsURLDialog.addEventListener("beforehide", hideDialog, false);
        dynamicsURLDialog.show();
    }
    else{
        notSelectedDialog.addEventListener("beforehide", hideDialog, false);
        notSelectedDialog.show();
    }
}

function showCopiedDialog(){
    dynamicsURLDialog.hide();
    copiedDialog.addEventListener("beforehide", hideDialog, false);
    copiedDialog.show();
}

function hideDialog(e){
    if (e.detail.result == WinJS.UI.ContentDialog.DismissalResult.none) {
        e.preventDefault();
    }
}

function saveSuccess() {
    saveFlyout.show(cmdSave);
    setTimeout(function () {
        saveFlyout.hide()
    }, 3000);
}

function loadDynamics(index) {
    var selectedDynamics = MSTCWebsite.Dynamics.getAt(index);
    title.value = selectedDynamics.Title;
    author.value = selectedDynamics.Author;
    typeSelect[0].value = selectedDynamics.Type;
    abstract.value = selectedDynamics.Abstract;
    viewedTimes.value = selectedDynamics.ViewedTimes;
    if (selectedDynamics.PaperID == "null") {
        paperStateRow.css("display", "none");
        paperState.checked = false;
    }
    else {
        paperStateRow.css("display", "block");
        paperState.checked = selectedDynamics.PaperEnabled;
    }
    editor.setContent(selectedDynamics.Content);
    designerContainer.animate({"opacity": 1.0}, "fast");
}
function editPaper() {
    if (lastSelectedIndex == undefined) {
        notSelectedDialog.addEventListener("beforehide", hideDialog, false);
        notSelectedDialog.show();
        return;
    }
    var selected = MSTCWebsite.Dynamics.getAt(lastSelectedIndex);
    if (selected.PaperID == "null") {
        dynamicsID = selected.ID;
        paperFlyout.show(cmdPaper);
    }
    else {
        Cookies.set("paper-id", selected.PaperID, {path: '/'});
        window.location.href = "/admin/form-designer";
    }
}

function confirmAddPaper() {
    paperFlyout.hide();
    $.post(PaperAPI.Add, {"DynamicsID": dynamicsID, "csrfmiddlewaretoken": csrfToken})
        .done(function (data) {
            Cookies.set("paper-id", data.ID, {path: '/'});
            window.location.href = "/admin/form-designer";
        })
        .fail(showErrorDialog);
}

function designerScroll() {
    var editorTop = editorDiv.offset().top;
    if (editorTop < header.clientHeight + 60) {
        blankDiv.css("height", editorToolbar[0].clientHeight);
        editorToolbar.css({"top": header.clientHeight + 60, "position": "fixed"});
    }
    else {
        blankDiv.css("height", 0);
        editorToolbar.css({"top": "", "position": "relative"});
    }
}
