/**
 * Created by Robert Xie
 * © 2015 HIT Microsoft Club
 * All Rights Reserved
 */
    
var title, text;
var currentPaperID, questions, formDialog;

function load(){
    processCSRFToken();
    var selectedID = getQueryString("ID");
    sendTelemetry(selectedID);
    WinJS.UI.processAll().done(function () {
        title = $("#title")[0];
        text = $("#text");
        formDialog = $("#form-dialog")[0].winControl;
        resizeText();
        window.onresize = resizeText;
        showBody();
    });
}

function resizeText(){
    var windowHeight = window.innerHeight;
    var titleHeight = title.clientHeight;
    var textHeight = windowHeight - titleHeight - 120;
    text.css("height", textHeight);
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