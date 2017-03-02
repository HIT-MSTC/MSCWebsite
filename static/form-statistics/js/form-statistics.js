var questionIDs = [];
var questions = {};
const ChartsPerRow = 6;

function load() {
    paperID = Cookies.get("paper-id");
    processCSRFToken();
    $.get(PaperAPI.Statistics, {ID: paperID})
        .done(function (data) {
            WinJS.UI.processAll().done(function () {
                var splitView = document.querySelector(".splitView").winControl;
                new WinJS.UI._WinKeyboard(splitView.paneElement);
                initializeJquery();
                window.onresize = resizeStatistics;
                resizeStatistics();
                exportCSV.onclick = function(){window.location.href = "/api/sum/?ID=" + paperID;};
                var paper = $.evalJSON(data.Paper);
                addHeads(paper);
                addPushes(data.Pushes);
                addChart(paper, data.Pushes);
                showBody();
            });
        })
        .fail(showErrorDialog);
}

function addHeads(paper) {
    for (var questionIndex = 0; questionIndex < paper.length; questionIndex++) {
        var currentQuestion = paper[questionIndex];
        var tableHead = document.createElement("th");
        tableHead.innerHTML = currentQuestion.Question;
        paperHeads.appendChild(tableHead);
        questionIDs.push(currentQuestion.ID);
    }
}

function addPushes(pushes) {
    for (var pushIndex = 0; pushIndex < pushes.length; pushIndex++) {
        var currentPush = $.evalJSON(pushes[pushIndex]);
        var tableRow = document.createElement("tr");
        for (var questionIDIndex = 0; questionIDIndex < questionIDs.length; questionIDIndex++) {
            var tableData = document.createElement("td");
            var data = currentPush[questionIDs[questionIDIndex]];
            if (data == undefined) {
                tableData.innerHTML = "[填写时无此题]";
            }
            else {
                tableData.innerHTML = data;
            }
            tableRow.appendChild(tableData);
        }
        paperPushes.appendChild(tableRow);
    }
}

function addChartSub(chartRow, chartsCount, chartRowIndex, chartLength, questionsID, classifiedPushes) {
    for (var chartColumnIndex = 0; chartColumnIndex < chartsCount; chartColumnIndex++) {
        var currentIndex = chartRowIndex * ChartsPerRow + chartColumnIndex;
        var currentID = questionsID[currentIndex];
        var currentQuestion = questions[currentID].Question;
        var currentPushes = classifiedPushes[currentID];
        var currentPushKeys = Object.keys(currentPushes);
        var chartArea = document.createElement("div");
        chartArea.className = "col-md-2";
        chartRow.appendChild(chartArea);
        var titlePart = document.createElement("div");
        titlePart.className = "row chart-title";
        titlePart.innerHTML = currentQuestion;
        var chartPart = document.createElement("div");
        chartPart.className = "row";
        var textPart = document.createElement("div");
        textPart.className = "row chart-text";
        chartArea.appendChild(titlePart);
        chartArea.appendChild(chartPart);
        chartArea.appendChild(textPart);
        var chartCanvas = document.createElement("canvas");
        chartCanvas.height = chartLength;
        chartCanvas.width = chartLength;
        chartPart.appendChild(chartCanvas);
        var chartData = {
            datasets: [{
                data: [],
                backgroundColor: []
            }],
            labels: []
        };
        var pushCount = 0;
        for (var pushIndex = 0; pushIndex < currentPushKeys.length; pushIndex++) {
            var currentKey = currentPushKeys[pushIndex];
            var pushColor = randomColor();
            pushCount += currentPushes[currentKey];
            chartData.datasets[0].data.push(currentPushes[currentKey]);
            chartData.datasets[0].backgroundColor.push(pushColor);
            chartData.labels.push(currentKey);
            text = document.createElement("p");
            text.style.color = Chart.helpers.color(pushColor).saturate(0.5).darken(0.5).rgbString();
            text.style.textAlign = "right";
            text.innerHTML = currentKey + " - " + currentPushes[currentKey];
            textPart.appendChild(text);
        }
        text = document.createElement("hr");
        textPart.appendChild(text);
        text = document.createElement("p");
        text.style.color = "#2d3239";
        text.style.textAlign = "right";
        text.style.fontWeight = "bold";
        text.innerHTML = "合计 - " + pushCount;
        textPart.appendChild(text);
        var chartConfig = {
            type: 'pie',
            data: chartData,
            options: {
                responsive: true,
                tooltips: {
                    enabled: false
                }
            }
        };
        setTimeout(drawChart(chartCanvas, chartConfig), 100);
    }
}
function addChart(paper, pushes) {
    var classifiedPushes = classifyPushes(paper, pushes);
    var questionsID = Object.keys(classifiedPushes);
    var questionsLength = questionsID.length;
    var chartRows = Math.floor(questionsLength / ChartsPerRow);
    var chartLeft = questionsLength - chartRows * ChartsPerRow;
    var chartLength;
    var chartRow;
    if (isMobile()) {
        chartLength = header.clientWidth - 95;
    }
    else {
        chartLength = header.clientWidth / ChartsPerRow - 156 / ChartsPerRow;
    }
    for (var chartRowIndex = 0; chartRowIndex < chartRows; chartRowIndex++) {
        chartRow = document.createElement("div");
        chartRow.className = "row";
        chartsArea.appendChild(chartRow);
        addChartSub(chartRow, ChartsPerRow, chartRowIndex, chartLength, questionsID, classifiedPushes);
    }
    chartRow = document.createElement("div");
    chartRow.className = "row";
    chartsArea.appendChild(chartRow);
    addChartSub(chartRow, chartLeft, chartRows, chartLength, questionsID, classifiedPushes);
}

function drawChart(chartCanvas, chartConfig) {
    return function () {
        var chartContext = chartCanvas.getContext("2d");
        var chart = new Chart(chartContext, chartConfig);
    };
}

function classifyPushes(paper, pushes) {
    var questionIndex, currentQuestion;
    var classify = {};
    for (questionIndex = 0; questionIndex < paper.length; questionIndex++) {
        currentQuestion = paper[questionIndex];
        questions[currentQuestion.ID] = {};
        questions[currentQuestion.ID].Type = currentQuestion.Type;
        questions[currentQuestion.ID].Question = currentQuestion.Question;
        classify[currentQuestion.ID] = {};
    }
    for (var pushIndex = 0; pushIndex < pushes.length; pushIndex++) {
        var currentPush = $.evalJSON(pushes[pushIndex]);
        var currentPushKeys = Object.keys(currentPush);
        for (var keyIndex = 0; keyIndex < currentPushKeys.length; keyIndex++) {
            var currentID = currentPushKeys[keyIndex];
            var currentContent = currentPush[currentID];
            if (questions[currentID].Type == "Multiple") {
                var options = currentContent.split("#");
                for (var optionIndex = 0; optionIndex < options.length; optionIndex++) {
                    var currentOption = options[optionIndex];
                    if (classify[currentID][currentOption] == undefined) {
                        classify[currentID][currentOption] = 1
                    }
                    else {
                        classify[currentID][currentOption]++;
                    }
                }
            }
            else {
                if (classify[currentID][currentContent] == undefined) {
                    classify[currentID][currentContent] = 1
                }
                else {
                    classify[currentID][currentContent]++;
                }
            }
            var classifyKeys = Object.keys(classify[currentID]);
            var sortedClassify = {};
            classifyKeys.sort();
            for (var sortedIndex = 0; sortedIndex < classifyKeys.length; sortedIndex++){
                var currentKey = classifyKeys[sortedIndex];
                sortedClassify[currentKey] = classify[currentID][currentKey];
            }
            classify[currentID] = sortedClassify;
        }
    }
    for (questionIndex = 0; questionIndex < paper.length; questionIndex++) {
        currentQuestion = paper[questionIndex];
        if (Object.keys(classify[currentQuestion.ID]).length == 0 ||
            Object.keys(classify[currentQuestion.ID]).length > pushes.length / 2) {
            delete classify[currentQuestion.ID];
        }
    }
    return classify;
}

function initializeJquery() {
    exportCSV = $("#export-csv")[0];
    header = $("#header")[0];
    statisticsSwitch = $("#statistics-switch");
    pivotItem = $(".pivotItem");
    paperHeads = $("#paper-heads")[0];
    paperPushes = $("#paper-pushes")[0];
    chartsArea = $("#charts-area")[0];
}

function resizeStatistics() {
    var windowHeight = window.innerHeight;
    var headerHeight = header.clientHeight;
    var statisticsHeight = windowHeight - headerHeight - 180;
    if (isMobile()) {
        statisticsSwitch.css("height", statisticsHeight);
        // WinJS BugFix: Pivot Unable to Scroll on non-IE Browsers
        pivotItem.css("height", statisticsHeight - 50);
    }
    else {
        statisticsSwitch.css("height", statisticsHeight);
        // WinJS BugFix: Pivot Unable to Scroll on non-IE Browsers
        pivotItem.css("height", statisticsHeight - 50);
    }
    statisticsSwitch[0].winControl.forceLayout();
    $("canvas").each(function (index, chartCanvas) {
        var chartLength;
        if (isMobile()) {
            chartLength = header.clientWidth - 95;
        }
        else {
            chartLength = header.clientWidth / 3 - 52;
        }
        chartCanvas.height = chartLength;
        chartCanvas.width = chartLength;
    });
}