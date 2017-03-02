/**
 * Created by Robert Xie
 * © 2015 HIT Microsoft Club
 * All Rights Reserved
 */

var dynamics;
var photos1 = [
    {"photo": "/static/images/03.jpg"}
];
var photos2 = [
    {"photo": "/static/images/04.jpg"}
];
var ios;

function load() {
    processCSRFToken();
    $.get(SettingsAPI.Get).done(function (settingsData) {
            $.get(DynamicsAPI.Get10)
                .done(function (dynamicsData) {
                    ios = isIOS();
                    dynamics = dynamicsData.Dynamics;
                    // WinJS BugFix: Flip Continuously
                    if (photos1.length > 1) {
                        photos1.push(photos1[photos1.length - 1]);
                    }
                    if (photos2.length > 1) {
                        photos2.push(photos2[photos2.length - 1]);
                    }
                    WinJS.Namespace.define("MSTCWebsite", {
                        "Photos1": new WinJS.Binding.List(photos1),
                        "Photos2": new WinJS.Binding.List(photos2),
                        "Dynamics": new WinJS.Binding.List(dynamics)
                    });
                    WinJS.Utilities.markSupportedForProcessing(selectDynamics);
                    WinJS.UI.processAll().done(function () {
                        initializeJquery();
                        if (!isMobile()) {
                            var splitView = document.querySelector(".splitView").winControl;
                            new WinJS.UI._WinKeyboard(splitView.paneElement);
                        }
                        loadBanner(settingsData.BannerEnabled);
                        loadLinks(settingsData.LinksEnabled);
                        Cookies.remove("selected-id", {path: '/'});
                        window.onresize = resizeAll;
                        video.onloadeddata = resizeFlipView;
                        resizeDynJoin();
                        setInterval("autoFlipView1()", 3000);
                        setInterval("autoFlipView2()", 4000);
                        if (ios) {
                            joinusSlogan.css("visibility", "hidden");
                        }
                        else {
                            joinusSlogan.css("clip", "rect(auto, 0px, auto, auto)");
                        }
                        checkDepartment();
                        showBody();
                    });
                })
                .fail(showErrorDialog);
        })
        .fail(showErrorDialog);
}

function initializeJquery() {
    video = $("#video")[0];
    firstImage = $(".flipview-image")[0];
    bannerArea = $("#banner-area")[0];
    noBanner = $("#no-banner");
    noLinks = $("#no-links");
    linksArea = $("#links-area");
    linksList = $("#links-list")[0];
    linksBorder = $("#links-border");
    linksHead = $("#links-head")[0];
    linksBox = $("#links-box");
    flipView1 = $("#flipview1");
    flipView1Control = flipView1[0].winControl;
    flipView2 = $("#flipview2");
    flipView2Control = flipView2[0].winControl;
    firstDepartment = $(".department")[0];
    dynamicsListView = $("#dynamics-listview");
    dynamicsMore = $("#dynamics-more");
    dynamicsBorder = $("#dynamics-border")[0];
    abstract = $("#abstract");
    title = $("#title");
    main = $("#main");
    form = $("#form");
    formDialog = $("#form-dialog")[0].winControl;
    joinus = $("#joinus");
    joinusSlogan = $("#joinus-text");
    joinusDisabled = $("#disabled-text");
    joinusYellow = $("#joinus-yellow");
    joinusOthers = $("#joinus-others");
    joinusAll = $("#joinus-all");
    enrollDialog = $("#enroll-dialog")[0].winControl;
}

function resizeAll() {
    resizeFlipView();
    resizeDynJoin();
}

function resizeFlipView() {
    if (isMobile()) {
        var imageHeight = firstImage.height;
        flipView1.css("height", imageHeight);
        flipView2.css("height", imageHeight);
        flipView1[0].winControl.forceLayout();
        flipView2[0].winControl.forceLayout();
    }
    else {
        var flipViewHeight = (video.clientHeight - 90) / 2;
        flipView1.css("height", flipViewHeight);
        flipView2.css("height", flipViewHeight);
        flipView1[0].winControl.forceLayout();
        flipView2[0].winControl.forceLayout();
    }
}

function resizeDynJoin() {
    if (animationState == 3) {
        return;
    }
    if (isMobile()) {
        dynamicsHeight = 300;
        dynamicsListView.css("height", dynamicsHeight);
        dynamicsListView[0].winControl.forceLayout();
        joinusHeight = joinus[0].clientWidth / 6;
        joinusPadding = joinusHeight * 0.3;
        dynamicsMore.css({"height": dynamicsHeight, "padding-top": (dynamicsHeight - 90) / 2});
    }
    else {
        dynamicsHeight = document.body.clientWidth / 6;
        dynamicsListView.css("height", dynamicsHeight);
        dynamicsListView[0].winControl.forceLayout();
        joinusHeight = dynamicsHeight - firstDepartment.clientHeight;
        joinusPadding = joinusHeight * 0.3;
        dynamicsMore.css({"height": dynamicsHeight, "padding-top": (dynamicsHeight - 30) / 2});
        linksBorder.css("height", dynamicsBorder.clientHeight);
        linksBox.css("height", linksBorder[0].clientHeight - linksHead.clientHeight - 15);
    }
    joinus.css({
        "height": joinusHeight, "font-size": joinusHeight * 0.3,
        "padding-top": joinusPadding, "padding-bottom": joinusPadding
    });
    joinusRight = joinus[0].clientWidth - joinusSlogan[0].clientHeight * 2 - 30;
    joinusMiddle = joinus[0].clientWidth / 2 - joinusSlogan[0].clientHeight * 0.707;
    joinusYellow.css({
        "height": joinusSlogan[0].clientHeight * 2,
        "top": (joinusHeight - joinusSlogan[0].clientHeight * 2) / 2,
        "left": 30
    });
    joinusOthers.css({
        "height": joinusSlogan[0].clientHeight * 2,
        "top": (joinusHeight - joinusSlogan[0].clientHeight * 2) / 2,
        "left": joinusRight
    });
    if (animationState == 4) {
        joinusTextWidth = joinusSlogan[0].clientWidth;
        logoLeft = joinusMiddle - (joinusTextWidth / 2 + 15);
        textLeft = logoLeft + joinusSlogan[0].clientHeight * 1.414 + 30;
        textClip = joinus[0].clientWidth - logoLeft * 2 - joinusSlogan[0].clientHeight * 1.414 - 30;
        joinusAll.css({
            "height": joinusSlogan[0].clientHeight * 2,
            "top": (joinusHeight - joinusSlogan[0].clientHeight * 2) / 2,
            "left": logoLeft
        });
        if (ios) {
            joinusSlogan.css({
                "left": textLeft
            });
        }
        else {
            joinusSlogan.css({
                "left": textLeft,
                "clip": "rect(auto, " + textClip + "px, auto, auto"
            });
        }
    }
    else {
        joinusAll.css({
            "height": joinusSlogan[0].clientHeight * 2,
            "top": (joinusHeight - joinusSlogan[0].clientHeight * 2) / 2,
            "left": joinusRight
        });
    }
}

function autoFlipView1() {
    var flipView1Success = flipView1Control.next();
    if (!flipView1Success) {
        // WinJS BugFix: Flip Continuously
        flipView1Control.currentPage = 0;
    }
}
function autoFlipView2() {
    var flipView2Success = flipView2Control.next();
    if (!flipView2Success) {
        // WinJS BugFix: Flip Continuously
        flipView2Control.currentPage = 0;
    }
}

function joinusAnimation() {
    animationState = 3;
    joinus.css({"background-color": "#209b15", "cursor": "pointer"});
    joinusDisabled.css("display", "none");
    joinusYellow.css("display", "block");
    joinusOthers.css("display", "block");
    joinusAll.css("display", "none");
    joinusRight = joinus[0].clientWidth - joinusSlogan[0].clientHeight * 2 - 30;
    joinusMiddle = joinus[0].clientWidth / 2 - joinusSlogan[0].clientHeight * 0.707;
    joinusYellow.css("left", 30);
    joinusOthers.css("left", joinusRight);
    joinusAll.css("left", joinusRight);
    joinusYellow.animate({"left": joinusRight}, 1000, "easeOutCubic", function () {
        joinusYellow.css("display", "none");
        joinusOthers.css("display", "none");
        joinusAll.css("display", "block");
        joinusAll.animate({"left": joinusMiddle}, 500, "easeOutQuint");
        start_time = Date.now();
        rotateJoinus();
        rotateAnimation = setInterval(rotateJoinus, 16);
        rotateAnimationTimeout = setTimeout(function () {
            clearInterval(rotateAnimation);
            rotateAnimation = undefined;
            joinusAll.css("transform", "rotateY(-45deg)");
            text_start_time = Date.now();
            showSlogan();
            textAnimation = setInterval(showSlogan, 16);
            textAnimationTimeout = setTimeout(function () {
                animationState = 4;
                clearInterval(textAnimation);
                textAnimation = undefined;
                textAnimationTimeout = undefined;
            }, 500);
            rotateAnimationTimeout = undefined;
        }, 500);
    });
}

function joinusIOS() {
    animationState = 4;
    joinusRight = joinus[0].clientWidth - joinusSlogan[0].clientHeight * 2 - 30;
    joinusMiddle = joinus[0].clientWidth / 2 - joinusSlogan[0].clientHeight * 0.707;
    joinusTextWidth = joinusSlogan[0].clientWidth;
    logoLeft = joinusMiddle - (joinusTextWidth / 2 + 15);
    textLeft = logoLeft + joinusSlogan[0].clientHeight * 1.414 + 30;
    joinus.css({"background-color": "#209b15", "cursor": "pointer"});
    joinusDisabled.css("display", "none");
    joinusYellow.css({"display": "none", "left": joinusRight});
    joinusOthers.css({"display": "none", "left": joinusRight});
    joinusAll.css({"display": "block", "left": logoLeft, "transform": "rotateY(-45deg)"});
    joinusSlogan.css({"visibility": "visible", "left": textLeft});
}

function clearAnimation() {
    if (rotateAnimation) {
        clearInterval(rotateAnimation);
        rotateAnimation = undefined;
    }
    if (textAnimation) {
        clearInterval(textAnimation);
        textAnimation = undefined;
    }
    if (rotateAnimationTimeout) {
        clearTimeout(rotateAnimationTimeout);
        rotateAnimationTimeout = undefined;
    }
    if (textAnimationTimeout) {
        clearTimeout(textAnimationTimeout);
        textAnimationTimeout = undefined;
    }
    joinusYellow.stop(true, false);
    joinusAll.stop(true, false);
    joinus.css("background-color", "#ffffff");
    joinusSlogan.css("clip", "rect(auto, 0, auto, auto");
    joinusDisabled.css("display", "block");
    joinusYellow.css("display", "none");
    joinusOthers.css("display", "none");
    joinusAll.css("display", "none");
}

function clearIOS() {
    joinus.css("background-color", "#ffffff");
    joinusDisabled.css("display", "block");
    joinusYellow.css("display", "none");
    joinusOthers.css("display", "none");
    joinusAll.css("display", "none");
    joinusSlogan.css("visibility", "hidden");
}

function rotateJoinus() {
    joinusAll.css("transform", "rotateY(" + easeOutQuint(Date.now() - start_time, 0, -45, 500) + "deg)");
}

function showSlogan() {
    joinusTextWidth = joinusSlogan[0].clientWidth;
    logoLeft = easeOutQuint(Date.now() - text_start_time, joinusMiddle, -(joinusTextWidth / 2 + 15), 500);
    textLeft = logoLeft + joinusSlogan[0].clientHeight * 1.414 + 30;
    textClip = joinus[0].clientWidth - logoLeft * 2 - joinusSlogan[0].clientHeight * 1.414 - 30;
    joinusAll.css("left", logoLeft);
    joinusSlogan.css({"left": textLeft, "clip": "rect(auto, " + textClip + "px, auto, auto"});
}
function selectDepartment(border, index) {
    if (lastDepartmentIndex == index) {
        lastDepartmentBorder.animate({"background-color": "#ffffff"}, 200, "linear");
        joinus.css("cursor", "auto");
        if (ios) {
            clearIOS();
        }
        else {
            joinusSlogan.css("clip", "rect(auto, 0px, auto, auto)");
            clearAnimation();
        }
        Cookies.remove("selected-department", {path: "/"});
        lastDepartmentIndex = undefined;
    }
    else {
        if (lastDepartmentIndex != undefined) {
            lastDepartmentBorder.animate({"background-color": "#ffffff"}, 200, "linear");
        }
        else {
            if (ios) {
                joinusIOS();
            }
            else {
                joinusAnimation();
            }
        }
        lastDepartmentBorder = $(border);
        lastDepartmentBorder.animate({"background-color": "#efcb36"}, 200, "linear");
        Cookies.set("selected-department", index, {expires: 1, path: "/"});
        lastDepartmentIndex = index;
    }
}

function checkDepartment() {
    var cookie = Cookies.get("selected-department");
    if (cookie != undefined) {
        if (ios) {
            joinusIOS();
        }
        else {
            joinusAnimation();
        }
        lastDepartmentBorder = $($(".department")[cookie]);
        lastDepartmentBorder.animate({"background-color": "#efcb36"}, 200, "linear");
        lastDepartmentIndex = cookie;
    }
}

function selectDynamics(e) {
    selected = $(".win-container")[e.detail.itemIndex];
    selectedID = $(selected).find(".listview-item .dynamics-id")[0].innerHTML;
    if (isMobile()) {
        window.location.href = "/dynamics-mobile/?ID=" + selectedID;
    }
    else {
        if (lastSelectedID == selectedID) {
            return;
        }
        if (reading) {
            abstract.animate({"opacity": 0}, "fast", loadDynamics);
        }
        else {
            loadDynamics();
        }
        lastSelectedID = selectedID;
        reading = true;
    }
}

function loadDynamics() {
    var selectedDynamics = $.grep(dynamics, function (dyn, index) {
        return dyn.ID == selectedID;
    }, false)[0];
    title.html(selectedDynamics.Title);
    main.html(selectedDynamics.Abstract);
    if (selectedDynamics.PaperID != "null" && selectedDynamics.PaperEnabled) {
        form.html('<button class="win-button" onclick="showFormDialog(' + selectedDynamics.PaperID + ')">参加活动</button>');
    }
    else {
        form.html('');
    }
    abstract.animate({"opacity": 1.0}, "fast");
}

function redirectDynamics() {
    if (isMobile()) {
        window.location.href = "/dynamics-mobile-all";
    }
    else {
        if (selectedID != undefined) {
            Cookies.set("selected-id", selectedID, {path: '/'});
        }
        window.location.href = "/dynamics";
    }
}

function loadBanner(bannerEnabled) {
    if (bannerEnabled) {
        $.get(BannerAPI.Get).done(function (bannerData) {
                var bannerImage = document.createElement("img");
                bannerImage.className = "banner";
                bannerImage.src = bannerData.Image;
                var bannerLink = document.createElement("a");
                bannerLink.href = bannerData.URL;
                bannerLink.appendChild(bannerImage);
                bannerArea.appendChild(bannerLink);
            })
            .fail(showErrorDialog);
    }
    else {
        noBanner.css("display", "block");
    }
}

function loadLinks(linksEnabled) {
    if(linksEnabled){
        linksArea.css("display", "block");
        $.get(LinkAPI.Get)
            .done(
                function (linksRaw) {
                    var linksData = $.evalJSON(linksRaw.JSON);
                    for (var linkIndex = 0; linkIndex < linksData.length; linkIndex++){
                        var currentLink = linksData[linkIndex];
                        var linkRow = document.createElement("div");
                        linkRow.className = "row link-row";
                        var linkID = document.createElement("div");
                        linkID.className = "col-md-1 link-id";
                        linkID.innerHTML = currentLink.ID;
                        var linkTitle = document.createElement("div");
                        linkTitle.className = "col-md-3 link-title";
                        linkTitle.innerHTML = currentLink.Title;
                        var linkURLArea = document.createElement("div");
                        linkURLArea.className = "col-md-8 link-url";
                        var linkURL = document.createElement("a");
                        linkURL.href = currentLink.URL;
                        linkURL.innerHTML = currentLink.URL;
                        linkURLArea.appendChild(linkURL);
                        linkRow.appendChild(linkID);
                        linkRow.appendChild(linkTitle);
                        linkRow.appendChild(linkURLArea);
                        linksList.appendChild(linkRow);
                    }
                }
            )
            .fail(showErrorDialog);
    }
    else{
        noLinks.css("display", "block");
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

function showFormDialogWithDep(paperID, questionID) {
    if (lastDepartmentIndex == undefined) {
        return;
    }
    $.get(PaperAPI.Get, {"ID": paperID})
        .done(function (data) {
            currentPaperID = paperID;
            questions = $.evalJSON(data.Questions);
            formDialog.show();
            formDialog.addEventListener("beforehide", hideForm, false);
            var formDialogSelector = $("#form-dialog");
            formDialogSelector.find(".win-contentdialog-content")[0].innerHTML = data.HTML;
            switch (questions[questionID - 1].Type) {
                case "Single":
                    formDialogSelector.find("#answer" + questionID)[0].value = departments[lastDepartmentIndex];
                    break;
                case "Multiple":
                    formDialogSelector.find(":checkbox").each(function () {
                        var checkbox = this;
                        if ($(checkbox).next()[0].innerHTML == departments[lastDepartmentIndex]) {
                            checkbox.checked = true;
                        }
                    });
                    break;
            }
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

function showEnrollDialog() {
    if (lastDepartmentIndex == undefined) {
        return;
    }
    enrollDialog.show();
    enrollDialog.addEventListener("beforehide", hideEnrollDialog, false);
}

function hideEnrollDialog(e) {
    if (e.detail.result == WinJS.UI.ContentDialog.DismissalResult.none) {
        e.preventDefault();
    }
}