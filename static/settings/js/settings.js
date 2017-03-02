/**
 * Created by Robert on 2015/9/25.
 */
var banner;

function load() {
    processCSRFToken();
    $.get(SettingsAPI.Get)
        .done(function (settingsData) {
            $.get(BannerAPI.Get)
                .done(function (bannerData) {
                    $.get(LinkAPI.Get)
                        .done(function (linkData) {
                            banner = bannerData;
                            WinJS.Utilities.markSupportedForProcessing(onBannerToggle);
                            WinJS.Utilities.markSupportedForProcessing(onLinkToggle);
                            WinJS.Utilities.markSupportedForProcessing(selectLink);
                            WinJS.Utilities.markSupportedForProcessing(reorderLinks);
                            var linksBinding = linkData.JSON == "" ?
                                new WinJS.Binding.List({}) :
                                new WinJS.Binding.List($.evalJSON(linkData.JSON));
                            WinJS.Namespace.define("MSTCWebsite", {
                                "Links": linksBinding
                            });
                            WinJS.UI.processAll().done(function () {
                                var splitView = document.querySelector(".splitView").winControl;
                                new WinJS.UI._WinKeyboard(splitView.paneElement);
                                initializeJquery();
                                resizeBannerManage();
                                window.onresize = resizeBannerManage;
                                bannerToggle.checked = settingsData.BannerEnabled;
                                linkToggle.checked = settingsData.LinksEnabled;
                                editor.addListener('ready', function () {
                                    editor.setContent('<p><img src="' + banner.Image + '"></p>');
                                });
                                bannerURL.value = banner.URL;
                                onBannerToggle();
                                onLinkToggle();
                                showBody();
                            });
                        })
                        .fail(showErrorDialog);
                })
                .fail(showErrorDialog);
        })
        .fail(showErrorDialog);
}

function initializeJquery() {
    settings = $("#settings");
    saveDialog = $("#save-dialog")[0].winControl;
    linkDialog = $("#link-dialog")[0].winControl;
    deleteDialog = $("#delete-dialog")[0].winControl;
    notSelectedDialog = $("#notselected-dialog")[0].winControl;
    bannerToggle = $("#banner-toggle")[0].winControl;
    linkToggle = $("#link-toggle")[0].winControl;
    linksList = $("#links-list")[0].winControl;
    imageDetails = $("#image-details");
    linkDetails = $("#link-details");
    bannerURL = $("#banner-url")[0];
    linkTitle = $("#link-title")[0];
    linkURL = $("#link-url")[0];
    editor = UE.getEditor('id_Content');
    editorDiv = $("#id_Content");
    editorUI = $("#edui1");
    editorIframe = $("#edui1_iframeholder");
    hiddenHTML = $("#hidden-html");
}

function resizeBannerManage() {
    var windowsHeight = window.innerHeight;
    var headerHeight = header.clientHeight;
    var bannerManageHeight = windowsHeight - headerHeight - 150;
    var editorWidth = settings[0].clientWidth / 2 - 15;
    settings.css("height", bannerManageHeight);
    editorDiv.css("width", editorWidth);
    editorUI.css("width", editorWidth);
    editorIframe.css("width", editorWidth);
}

function onBannerToggle() {
    if (bannerToggle.checked) {
        imageDetails.css("display", "block");
    }
    else {
        imageDetails.css("display", "none");
    }
}

function onLinkToggle() {
    if (linkToggle.checked) {
        linkDetails.css("display", "block");
        linksList.forceLayout();
    }
    else {
        linkDetails.css("display", "none");
    }
}

function saveAll() {
    var newBanner = {};
    newBanner.csrfmiddlewaretoken = csrfToken;
    hiddenHTML.html(editor.getContent());
    newBanner.Image = hiddenHTML.find("img")[0].src;
    newBanner.URL = bannerURL.value;
    $.post(BannerAPI.Modify, newBanner)
        .done(function (data) {
            if (data.Status != "success") {
                showErrorDialog();
            }
            else {
                var newLinksList = [];
                for (var linkIndex = 0; linkIndex < MSTCWebsite.Links.length; linkIndex++) {
                    var currentLink = MSTCWebsite.Links.getAt(linkIndex);
                    newLinksList.push({
                        "ID": currentLink.ID,
                        "Title": currentLink.Title,
                        "URL": currentLink.URL
                    });
                }
                var newLinks = {};
                newLinks.csrfmiddlewaretoken = csrfToken;
                newLinks.JSON = $.toJSON(newLinksList);
                $.post(LinkAPI.Modify, newLinks)
                    .done(function (data) {
                        if (data.Status != "success") {
                            showErrorDialog();
                        }
                        else {
                            var newSettings = {};
                            newSettings.csrfmiddlewaretoken = csrfToken;
                            newSettings.BannerEnabled = bannerToggle.checked ? true : false;
                            newSettings.LinksEnabled = linkToggle.checked ? true : false;
                            $.post(SettingsAPI.Modify, newSettings)
                                .done(function (data) {
                                    if (data.Status != "success") {
                                        showErrorDialog();
                                    }
                                    else {
                                        showSaveDialog();
                                    }
                                })
                                .fail(showErrorDialog);
                        }
                    })
                    .fail(showErrorDialog);
            }
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
            window.location.href = "/admin/dynamics-manage";
            break;
        case WinJS.UI.ContentDialog.DismissalResult.secondary:
            window.location.href = "/admin/dynamics-manage";
            break;
    }
}

function selectLink(e) {
    var selectedLinkIndex = e.detail.itemIndex;
    if (lastSelectedLinkIndex == selectedLinkIndex) {
        return;
    }
    selectedLink = MSTCWebsite.Links.getAt(selectedLinkIndex);
    lastSelectedLinkIndex = selectedLinkIndex;
}

function reorderLinks() {
    for (var linkIndex = 0; linkIndex < MSTCWebsite.Links.length; linkIndex++) {
        var currentLink = MSTCWebsite.Links.getAt(linkIndex);
        currentLink.ID = linkIndex + 1;
        MSTCWebsite.Links.setAt(linkIndex, currentLink);
    }
    lastSelectedLinkIndex = linksList.selection.getIndices()[0];
}

function showLinkDialog(isNew) {
    if (isNew) {
        linkTitle.value = "";
        linkURL.value = "";
        linkDialog.addEventListener("beforehide", newLinkCallback, false);
    }
    else {
        if (lastSelectedLinkIndex == null) {
            notSelectedDialog.addEventListener("beforehide", hideNotSelectedDialog, false);
            notSelectedDialog.show();
            return;
        }
        else {
            linkTitle.value = selectedLink.Title;
            linkURL.value = selectedLink.Link;
            linkDialog.addEventListener("beforehide", modifyLinkCallback, false);
        }
    }
    linkDialog.show();
}

function newLinkCallback(e) {
    switch (e.detail.result) {
        case WinJS.UI.ContentDialog.DismissalResult.none:
            e.preventDefault();
            break;
        case WinJS.UI.ContentDialog.DismissalResult.primary:
            var newLink = {
                ID: MSTCWebsite.Links.length + 1,
                Title: linkTitle.value,
                URL: linkURL.value
            };
            MSTCWebsite.Links.push(newLink);
            break;
        case WinJS.UI.ContentDialog.DismissalResult.secondary:
            break;
    }
}

function modifyLinkCallback(e) {
    switch (e.detail.result) {
        case WinJS.UI.ContentDialog.DismissalResult.none:
            e.preventDefault();
            break;
        case WinJS.UI.ContentDialog.DismissalResult.primary:
            selectedLink.Title = linkTitle.value;
            selectedLink.URL = linkURL.value;
            MSTCWebsite.Links.setAt(lastSelectedLinkIndex, selectedLink);
            break;
        case WinJS.UI.ContentDialog.DismissalResult.secondary:
            break;
    }
}

function showDeleteDialog() {
    if (lastSelectedLinkIndex == null) {
        notSelectedDialog.addEventListener("beforehide", hideNotSelectedDialog, false);
        notSelectedDialog.show();
    }
    else {
        deleteDialog.addEventListener("beforehide", deleteLinkCallback, false);
        deleteDialog.show();
    }
}

function deleteLinkCallback(e) {
    switch (e.detail.result) {
        case WinJS.UI.ContentDialog.DismissalResult.none:
            e.preventDefault();
            break;
        case WinJS.UI.ContentDialog.DismissalResult.primary:
            MSTCWebsite.Links.splice(lastSelectedLinkIndex, 1);
            lastSelectedLinkIndex = undefined;
            break;
        case WinJS.UI.ContentDialog.DismissalResult.secondary:
            break;
    }
}

function hideNotSelectedDialog(e) {
    if (e.detail.result == WinJS.UI.ContentDialog.DismissalResult.none) {
        e.preventDefault();
    }
}