/**
 * Created by Robert Xie
 * © 2015 HIT Microsoft Club
 * All Rights Reserved
 */
var csrfToken;

function isMobile() {
    return document.body.clientWidth <= 992;
}

function isIOS() {
    var u = navigator.userAgent;
    return u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/);
}

function isFirefox() {
    return navigator.userAgent.indexOf("Firefox") > -1;
}

function easeOutQuint(time, begin, end, duration) {
    return end * ((time = time / duration - 1) * time * time * time * time + 1) + begin;
}
function showSuccessDialog() {
    var successDialog = $("#success-dialog")[0].winControl;
    successDialog.show();
    successDialog.addEventListener("beforehide", hideSuccessDialog, false);
}
function hideSuccessDialog(e) {
    if (e.detail.result == WinJS.UI.ContentDialog.DismissalResult.none) {
        e.preventDefault();
    }
}

function showErrorDialog() {
    WinJS.UI.processAll().done(function(){
        var errorDialog = $("#error-dialog")[0].winControl;
        errorDialog.show();
        errorDialog.addEventListener("beforehide", hideErrorDialog, false);
        showBody();
    });
}
function hideErrorDialog(e) {
    switch (e.detail.result) {
        case WinJS.UI.ContentDialog.DismissalResult.none:
            e.preventDefault();
            break;
        case WinJS.UI.ContentDialog.DismissalResult.primary:
            window.location.reload(true);
            break;
        case WinJS.UI.ContentDialog.DismissalResult.secondary:
            document.body.innerHTML = "";
            break;
    }
}

function showAboutDialog() {
    var aboutDialog = $("#about-dialog")[0].winControl;
    aboutDialog.show();
    aboutDialog.addEventListener("beforehide", hideAboutDialog, false);
}

function hideAboutDialog(e) {
    if (e.detail.result == WinJS.UI.ContentDialog.DismissalResult.none) {
        e.preventDefault();
    }
}
function checkMax(id, optionIndex, max) {
    var answer = $("#answer" + id);
    var checked = answer.find(":checkbox:checked");
    var checkedCount = checked.length;
    if (checkedCount > max) {
        var option = answer.find("#answer-option" + optionIndex)[0];
        option.checked = false;
    }
}

function switchCheckBox(id, optionIndex, max) {
    var option = $("#answer" + id).find("#answer-option" + optionIndex)[0];
    var isChecked = option.checked;
    option.checked = !isChecked;
    checkMax(id, optionIndex, max);
}

function processCSRFToken() {
    csrfToken = $("input[name='csrfmiddlewaretoken']")[0].value;
}

function showBody() {
    $("body").animate({"opacity": 1.0}, "fast");
}


function getQueryString(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    var r = window.location.search.substr(1).match(reg);
    if (r != null) return unescape(r[2]);
    return null;
}

function randomColor() {
    var r = Math.round(Math.random() * 255);
    var g = Math.round(Math.random() * 255);
    var b = Math.round(Math.random() * 255);
    return "rgb(" + r + ", " + g + ", " + b + ")";
}

function sendTelemetry(id){
    var telemetryData = {};
    telemetryData.csrfmiddlewaretoken = csrfToken;
    telemetryData.ID = id;
    $.post(DynamicsAPI.Telemetry, telemetryData).done(function (data) {
            console.log("遥测数据已发送，动态ID为" + id + "。");
        })
        .fail(function () {
            console.log("遥测数据发送失败。");
        });
}

var DynamicsAPI = {
    "Get": "/api/dynamicsall/",
    "Get10": "/api/dynamics10/",
    "Add": "/api/addDynamics/",
    "Modify": "/api/editDynamics/",
    "Delete": "/api/deleteDynamics/",
    "Telemetry": "/api/telemetry/"
};

var PaperAPI = {
    "Get": "/api/checkPaper/",
    "Add": "/api/addPaper/",
    "Modify": "/api/editPaper/",
    "Answer": "/api/join/",
    "UpdateEnroll": "/api/updateEnroll/",
    "GetEnroll": "/api/getEnroll/",
    "DeleteEnroll": "/api/deleteEnroll/",
    "Statistics": "/api/paperCount/"
};

var BannerAPI = {
    "Get": "/api/getBanner/",
    "Modify": "/api/updateBanner/"
};

var SettingsAPI = {
    "Get": "/api/getSettings/",
    "Modify": "/api/updateSettings/"
};

var LinkAPI = {
    "Get": "/api/getLink/",
    "Modify": "/api/updateLink/"
};