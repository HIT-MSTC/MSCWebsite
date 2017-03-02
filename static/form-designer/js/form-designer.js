/**
 * Created by Robert Xie
 * © 2015 HIT Microsoft Club
 * All Rights Reserved
 */

var questions;

function load() {
    reading = false;
    paperID = Cookies.get("paper-id");
    processCSRFToken();
    $.get(PaperAPI.Get, {"ID": paperID})
        .done(function (data) {
            questions = data;
            var evalQuestions;
            if (questions.Questions == "") {
                evalQuestions = [];
            }
            else {
                evalQuestions = $.evalJSON(questions.Questions);
            }
            newID = evalQuestions.length + 1;
            WinJS.Namespace.define("MSTCWebsite", {
                "Questions": new WinJS.Binding.List(evalQuestions)
            });
            WinJS.Utilities.markSupportedForProcessing(reorderQuestions);
            WinJS.Utilities.markSupportedForProcessing(selectQuestion);
            WinJS.UI.processAll().done(function () {
                var splitView = document.querySelector(".splitView").winControl;
                new WinJS.UI._WinKeyboard(splitView.paneElement);
                initializeJquery();
                getEnroll();
                resizeQuestions();
                window.onresize = resizeQuestions;
                typeChange();
                showBody();
            });
        })
        .fail(showErrorDialog);
}

function getEnroll() {
    $.get(PaperAPI.GetEnroll)
        .done(function (data) {
            enrollPaper = data.Paper;
        })
        .fail(showErrorDialog);
}

function initializeJquery() {
    header = $("#header")[0];
    questionsListView = $("#questions-listview");
    designer = $("#designer");
    designerContainer = $("#designer-container");
    question = $("#question")[0];
    optionsCount = $("#options-count");
    optionsCountLabel = $("#options-count-label");
    optionsCountText = $("#options-count-text");
    optionsMax = $("#options-max");
    optionsMaxLabel = $("#options-max-label");
    optionsMaxText = $("#options-max-text");
    optionsContainer = $("#options-container");
    type = $("#type")[0];
    paperSum = $("#paper-sum")[0];
    formDialog = $("#form-dialog")[0].winControl;
    jsonDialog = $("#json-dialog")[0].winControl;
    saveDialog = $("#save-dialog")[0].winControl;
    enrollDialog = $("#enroll-dialog")[0].winControl;
    deleteDialog = $("#delete-enroll-dialog")[0].winControl;
    selectDialog = $("#select-enroll-dialog")[0].winControl;
    notSelectedDialog = $("#notselected-dialog")[0].winControl;
}

function resizeQuestions() {
    var windowsHeight = window.innerHeight;
    var headerHeight = header.clientHeight;
    var questionsListHeight = windowsHeight - headerHeight - 150;
    questionsListView.css("height", questionsListHeight);
    questionsListView[0].winControl.forceLayout();
    designer.css("height", questionsListHeight);
}

function reorderQuestions() {
    for (var questionIndex = 0; questionIndex < MSTCWebsite.Questions.length; questionIndex++) {
        var currentQuestion = MSTCWebsite.Questions.getAt(questionIndex);
        currentQuestion.ID = questionIndex + 1;
        MSTCWebsite.Questions.setAt(questionIndex, currentQuestion);
    }
    lastSelectedIndex = questionsListView[0].winControl.selection.getIndices()[0];
}

function generateForm() {
    var formHTML = "";
    var optionIndex, currentOption;
    for (var questionIndex = 0; questionIndex < MSTCWebsite.Questions.length; questionIndex++) {
        var currentQuestion = MSTCWebsite.Questions.getAt(questionIndex);
        switch (currentQuestion.Type) {
            case  "Single":
                formHTML += '<div class="answer-row"><label for="answer' + currentQuestion.ID + '">'
                    + (questionIndex + 1) + '. ' + currentQuestion.Question +
                    '</label></div>' +
                    '<div class="answer-row"><select class="answer" id="answer' + currentQuestion.ID + '">';
                for (optionIndex = 0; optionIndex < currentQuestion.Options.length; optionIndex++) {
                    currentOption = currentQuestion.Options[optionIndex];
                    formHTML += '<option value="' + currentOption + '">' + currentOption + '</option>'
                }
                formHTML += "</select></div>";
                break;
            case "Multiple":
                formHTML += '<div class="answer-row">' + (questionIndex + 1) + '. ' + currentQuestion.Question +
                    ' （最多选' + currentQuestion.Max + '项）' +
                    '</div><div id="answer' + currentQuestion.ID + '" class="answer-row">';
                for (optionIndex = 0; optionIndex < currentQuestion.Options.length; optionIndex++) {
                    currentOption = currentQuestion.Options[optionIndex];
                    formHTML += '<input id="answer-option' + optionIndex + '" type="checkbox" onchange="checkMax(' +
                        currentQuestion.ID + ', ' + optionIndex + ', ' + currentQuestion.Max + ')"/>' +
                        '<div class="option-label" onclick=\'switchCheckBox(' +
                        currentQuestion.ID + ', ' + optionIndex + ', ' + currentQuestion.Max + ');\'>' + currentOption + "</div>";
                }
                formHTML += "</div>";
                break;
            case "Blank":
                formHTML += '<div class="answer-row">' + (questionIndex + 1) + '. ' + currentQuestion.Question
                    + '</div><div class="answer-row"><input type="text" id="answer' + currentQuestion.ID + '"></input></div>';
                break;
            case "LongBlank":
                formHTML += '<div class="answer-row">' + (questionIndex + 1) + '. ' + currentQuestion.Question
                    + '</div><div class="answer-row"><textarea id="answer' + currentQuestion.ID + '"></textarea></div>';
                break;
        }
    }
    return formHTML;
}

function previewForm() {
    formDialog.show();
    formDialog.addEventListener("beforehide", hideForm, false);
    $("#form-dialog").find(".win-contentdialog-content")[0].innerHTML = generateForm();
}

function hideForm(e) {
    switch (e.detail.result) {
        case WinJS.UI.ContentDialog.DismissalResult.none:
            e.preventDefault();
            break;
        case WinJS.UI.ContentDialog.DismissalResult.primary:
            var answer = {};
            answer.PaperID = questions.ID;
            var answerDict = {};
            for (var questionIndex = 0; questionIndex < MSTCWebsite.Questions.length; questionIndex++) {
                var currentQuestion = MSTCWebsite.Questions.getAt(questionIndex);
                var answerContainer = $("#answer" + currentQuestion.ID);
                switch (currentQuestion.Type) {
                    case "Single":
                        answerDict[currentQuestion.Question] = answerContainer[0].value;
                        break;
                    case "Multiple":
                        var checked = answerContainer.find(":checkbox:checked");
                        var answerArray = [];
                        for (var checkedIndex = 0; checkedIndex < checked.length; checkedIndex++) {
                            answerArray.push($(checked[checkedIndex]).next()[0].innerHTML);
                        }
                        answerDict[currentQuestion.Question] = answerArray.join("#");
                        break;
                    case "Blank":
                        answerDict[currentQuestion.Question] = answerContainer[0].value;
                        break;
                    case "LongBlank":
                        answerDict[currentQuestion.Question] = answerContainer[0].value;
                        break;
                }
            }
            answer.Answer = $.toJSON(answerDict);
            showJSONDialog($.toJSON(answer));
            break;
        case WinJS.UI.ContentDialog.DismissalResult.secondary:
            break;
    }
}

function showJSONDialog(json) {
    jsonDialog.show();
    jsonDialog.addEventListener("beforehide", HideJSONDialog, false);
    $("#json-dialog").find(".win-contentdialog-content")[0].innerHTML = '<h3 class="win-h3">生成的JSON数据</h3><p>' + json + '</p>';
}

function HideJSONDialog(e) {
    if (e.detail.result == WinJS.UI.ContentDialog.DismissalResult.none) {
        e.preventDefault();
    }
}

function selectQuestion(e) {
    var selectedIndex = e.detail.itemIndex;
    if (lastSelectedIndex == selectedIndex) {
        return;
    }
    var selected = MSTCWebsite.Questions.getAt(selectedIndex);
    if (reading) {
        designerContainer.animate({"opacity": 0}, "fast", function () {
            modifyQuestion();
            loadQuestion(selected);
            lastSelectedIndex = selectedIndex;
            reading = true;
        });
    }
    else {
        loadQuestion(selected);
        lastSelectedIndex = selectedIndex;
        reading = true;
    }
}

function loadQuestion(selected) {
    question.value = selected.Question;
    type.value = selected.Type;
    typeChange();
    if (selected.Type == "Blank" || selected.Type == "LongBlank" || selected.Type == "") {
        designerContainer.animate({"opacity": 1.0}, "fast");
        return;
    }
    var optionsCountValue = selected.Options.length;
    refreshOptions(optionsCountValue, selected);
    designerContainer.animate({"opacity": 1.0}, "fast");
}

function refreshOptions(optionsCountValue) {
    var selected = arguments[1] || undefined;
    var columnCount = Math.floor(optionsCountValue / 9);
    var remainingCount = optionsCountValue - columnCount * 9;
    var rootColumn, optionRow, optionColumn, label, input;
    optionsContainer.html("");
    for (var columnIndex = 0; columnIndex < columnCount; columnIndex++) {
        rootColumn = document.createElement("div");
        rootColumn.className = "col-lg-2";
        for (var index = columnIndex * 9; index < columnIndex * 9 + 9; index++) {
            optionRow = document.createElement("div");
            optionRow.className = "row option-row";
            optionColumn = document.createElement("div");
            optionColumn.className = "col-md-12";
            label = document.createElement("label");
            label.className = "same-row";
            label.for = "option" + index;
            label.innerHTML = "选项 " + String.fromCharCode(65 + index) + ":";
            input = document.createElement("input");
            input.id = "option" + index;
            input.className = "same-row";
            input.type = "text";
            if (selected != undefined) input.value = selected.Options[index];
            optionColumn.appendChild(label);
            optionColumn.appendChild(input);
            optionRow.appendChild(optionColumn);
            rootColumn.appendChild(optionRow);
        }
        optionsContainer[0].appendChild(rootColumn);
    }
    rootColumn = document.createElement("div");
    rootColumn.className = "col-lg-2";
    for (var remainingIndex = columnCount * 9; remainingIndex < columnCount * 9 + remainingCount; remainingIndex++) {
        optionRow = document.createElement("div");
        optionRow.className = "row option-row";
        optionColumn = document.createElement("div");
        optionColumn.className = "col-md-12";
        label = document.createElement("label");
        label.className = "same-row";
        label.for = "option" + remainingIndex;
        label.innerHTML = "选项 " + String.fromCharCode(65 + remainingIndex) + ":";
        input = document.createElement("input");
        input.id = "option" + remainingIndex;
        input.className = "same-row";
        input.type = "text";
        if (selected != undefined) input.value = selected.Options[remainingIndex];
        optionColumn.appendChild(label);
        optionColumn.appendChild(input);
        optionRow.appendChild(optionColumn);
        rootColumn.appendChild(optionRow);
    }
    optionsContainer[0].appendChild(rootColumn);
    optionsCount[0].value = optionsCountValue;
    optionsCountText[0].value = optionsCountValue;
    optionsMax[0].max = optionsCountValue;
    if (selected != undefined) {
        if (selected.Type == "Multiple") {
            optionsMax[0].value = selected.Max;
            optionsMaxText[0].value = selected.Max;
            return;
        }
    }
    var defaultMax = Math.floor(optionsCountValue / 2);
    optionsMax[0].value = defaultMax;
    optionsMaxText[0].value = defaultMax;
}

function typeChange() {
    switch (type.value) {
        case "Single":
            optionsCount.css("display", "block");
            optionsCountLabel.css("display", "block");
            optionsCountText.css("display", "block");
            optionsMax.css("display", "none");
            optionsMaxLabel.css("display", "none");
            optionsMaxText.css("display", "none");
            optionsContainer.css("display", "block");
            optionsCountChange();
            break;
        case "Multiple":
            optionsCount.css("display", "block");
            optionsCountLabel.css("display", "block");
            optionsCountText.css("display", "block");
            optionsMax.css("display", "block");
            optionsMaxLabel.css("display", "block");
            optionsMaxText.css("display", "block");
            optionsContainer.css("display", "block");
            optionsCountChange();
            break;
        case "Blank":
            optionsCount.css("display", "none");
            optionsCountLabel.css("display", "none");
            optionsCountText.css("display", "none");
            optionsMax.css("display", "none");
            optionsMaxLabel.css("display", "none");
            optionsMaxText.css("display", "none");
            optionsContainer.css("display", "none");
            break;
        case "LongBlank":
            optionsCount.css("display", "none");
            optionsCountLabel.css("display", "none");
            optionsCountText.css("display", "none");
            optionsMax.css("display", "none");
            optionsMaxLabel.css("display", "none");
            optionsMaxText.css("display", "none");
            optionsContainer.css("display", "none");
            break;
        default:
            optionsCount.css("display", "none");
            optionsCountLabel.css("display", "none");
            optionsCountText.css("display", "none");
            optionsMax.css("display", "none");
            optionsMaxLabel.css("display", "none");
            optionsMaxText.css("display", "none");
            optionsContainer.css("display", "none");
            break;
    }
}

function optionsCountChange() {
    var optionsCountValue = optionsCount[0].value;
    refreshOptions(optionsCountValue);
}

function optionsMaxChange() {
    optionsMaxText[0].value = optionsMax[0].value;
}

function addQuestion() {
    var newQuestion = {};
    newQuestion.ID = newID;
    newID++;
    newQuestion.Type = "";
    newQuestion.Question = "";
    MSTCWebsite.Questions.push(newQuestion);
}

function showSelectDialog() {
    selectDialog.show();
    selectDialog.addEventListener("beforehide", hideSelectDialog, false);
}

function hideSelectDialog(e) {
    var newQuestion = {};
    switch (e.detail.result) {
        case WinJS.UI.ContentDialog.DismissalResult.none:
            e.preventDefault();
            break;
        case WinJS.UI.ContentDialog.DismissalResult.primary:
            newQuestion.ID = newID;
            newID++;
            newQuestion.Type = "Single";
            newQuestion.Question = "";
            newQuestion.Options = ["技术部", "运营部", "市场部", "人力部", "财务部", "产品部"];
            MSTCWebsite.Questions.push(newQuestion);
            break;
        case WinJS.UI.ContentDialog.DismissalResult.secondary:
            newQuestion.ID = newID;
            newID++;
            newQuestion.Type = "Multiple";
            newQuestion.Question = "";
            newQuestion.Options = ["技术部", "运营部", "市场部", "人力部", "财务部", "产品部"];
            newQuestion.Max = 3;
            MSTCWebsite.Questions.push(newQuestion);
            break;
    }
}

function deleteQuestion() {
    if (lastSelectedIndex == undefined) {
        notSelectedDialog.addEventListener("beforehide", hideNotSelectedDialog, false);
        notSelectedDialog.show();
        return;
    }
    designerContainer.animate({"opacity": 0}, "fast");
    MSTCWebsite.Questions.splice(lastSelectedIndex, 1);
    reorderQuestions();
    newID--;
    lastSelectedIndex = undefined;
    reading = false;
}
function modifyQuestion() {
    var newQuestion = {};
    newQuestion.ID = MSTCWebsite.Questions.getAt(lastSelectedIndex).ID;
    newQuestion.Type = type.value;
    newQuestion.Question = question.value;
    if (newQuestion.Type == "Blank" || newQuestion.Type == "LongBlank") {
        MSTCWebsite.Questions.setAt(lastSelectedIndex, newQuestion);
        return;
    }
    var options = [];
    var optionsCountValue = optionsCount[0].value;
    for (var optionsIndex = 0; optionsIndex < optionsCountValue; optionsIndex++) {
        options.push($("#option" + optionsIndex)[0].value);
    }
    newQuestion.Options = options;
    if (newQuestion.Type == "Multiple") {
        newQuestion.Max = optionsMax[0].value;
    }
    MSTCWebsite.Questions.setAt(lastSelectedIndex, newQuestion);
}

function isDepartment(question) {
    return (question.Type != "Blank") && (question.Type != "LongBlank") &&
        (question.Options.indexOf("技术部") != -1) &&
        (question.Options.indexOf("运营部") != -1) &&
        (question.Options.indexOf("市场部") != -1) &&
        (question.Options.indexOf("人力部") != -1) &&
        (question.Options.indexOf("财务部") != -1) &&
        (question.Options.indexOf("产品部") != -1);
}

function saveAll() {
    if (lastSelectedIndex != null) {
        modifyQuestion();
    }
    var changedQuestions = [];
    post = {};
    var markedEnroll = false;
    for (var index = 0; index < MSTCWebsite.Questions.length; index++) {
        var currentQuestion = MSTCWebsite.Questions.getAt(index);
        if (isDepartment(currentQuestion)) {
            markedEnroll = true;
            enrollID = currentQuestion.ID;
        }
        changedQuestions.push(currentQuestion);
    }
    post.csrfmiddlewaretoken = csrfToken;
    post.ID = questions.ID;
    post.Questions = $.toJSON(changedQuestions);
    post.HTML = generateForm();
    if (markedEnroll && post.ID != enrollPaper) {
        showEnrollDialog();
    }
    else if (!markedEnroll && post.ID == enrollPaper) {
        showDeleteDialog();
    }
    else {
        postSave();
    }
}

function showEnrollDialog() {
    enrollDialog.show();
    enrollDialog.addEventListener("beforehide", hideEnrollDialog, false);
}

function hideEnrollDialog(e) {
    switch (e.detail.result) {
        case WinJS.UI.ContentDialog.DismissalResult.none:
            e.preventDefault();
            break;
        case WinJS.UI.ContentDialog.DismissalResult.primary:
            var enroll = {};
            enroll.csrfmiddlewaretoken = csrfToken;
            enroll.Paper = post.ID;
            enroll.Question = enrollID;
            $.post(PaperAPI.UpdateEnroll, enroll)
                .done(function (data) {
                    if (data.Status != "success") {
                        showErrorDialog();
                        return;
                    }
                    postSave();
                })
                .fail(showErrorDialog);
            break;
        case WinJS.UI.ContentDialog.DismissalResult.secondary:
            postSave();
            break;
    }
}

function showDeleteDialog() {
    deleteDialog.show();
    deleteDialog.addEventListener("beforehide", hideDeleteDialog, false);
}

function hideDeleteDialog(e) {
    switch (e.detail.result) {
        case WinJS.UI.ContentDialog.DismissalResult.none:
            e.preventDefault();
            break;
        case WinJS.UI.ContentDialog.DismissalResult.primary:
            $.post(PaperAPI.DeleteEnroll, {"csrfmiddlewaretoken": csrfToken})
                .done(function (data) {
                    if (data.Status != "success") {
                        showErrorDialog();
                        return;
                    }
                    postSave();
                })
                .fail(showErrorDialog);
            break;
        case WinJS.UI.ContentDialog.DismissalResult.secondary:
            break;
    }
}

function postSave() {
    $.post(PaperAPI.Modify, post)
        .done(function (data) {
            if (data.Status != "success") {
                showErrorDialog();
                return;
            }
            Cookies.remove("paper-id", {path: '/'});
            showSaveDialog();
        })
        .fail(showErrorDialog);
}

function showSaveDialog() {
    saveDialog.show();
    saveDialog.addEventListener("beforehide", hideSaveDialog, false);
}

function hideSaveDialog(e) {
    switch (e.detail.result) {
        case WinJS.UI.ContentDialog.DismissalResult.none:
            e.preventDefault();
            break;
        case WinJS.UI.ContentDialog.DismissalResult.primary:
            Cookies.remove("paper-id", {path: '/'});
            window.location.href = "/admin/dynamics-manage";
            break;
        case WinJS.UI.ContentDialog.DismissalResult.secondary:
            Cookies.remove("paper-id", {path: '/'});
            window.location.href = "/admin/dynamics-manage";
            break;
    }
}

function hideNotSelectedDialog(e){
    if (e.detail.result == WinJS.UI.ContentDialog.DismissalResult.none) {
        e.preventDefault();
    }
}