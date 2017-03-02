# -*-coding:utf-8-*-
import datetime
from django.shortcuts import render_to_response
from django.template import RequestContext
from django import forms
from models import *
from django.http import HttpResponse, HttpResponseRedirect
from django.contrib import auth
from DjangoUeditor.forms import UEditorField
from django.contrib.auth.decorators import login_required
import json
import csv


class BlankEditor(forms.Form):
    Content = UEditorField("", initial="", height=430)


def index(request):
    content = {}
    enrolls = Enroll.objects.all()
    if len(enrolls) == 0:
        content["enroll_len"] = len(enrolls)
    else:
        enroll = enrolls[0]
        content["paper_id"] = enroll.paper.pk
        content["question_id"] = enroll.questionID
        content["enroll_len"] = len(enrolls)
    return render_to_response('index.html', content, context_instance=RequestContext(request))


def index_mobile(request):
    content = {}
    enrolls = Enroll.objects.all()
    banners = Banner.objects.all()
    if len(enrolls) == 0:
        content["enroll_len"] = len(enrolls)
    else:
        enroll = enrolls[0]
        content["paper_id"] = enroll.paper.pk
        content["question_id"] = enroll.questionID
        content["enroll_len"] = len(enrolls)
    return render_to_response('index-mobile.html', content, context_instance=RequestContext(request))


def dynamics(request):
    return render_to_response("dynamics.html", context_instance=RequestContext(request))


def dynamics_mobile_all(request):
    return render_to_response("dynamics-mobile-all.html", context_instance=RequestContext(request))


@login_required(login_url='/admin/login/')
def dynamics_manage(request):
    form = BlankEditor()
    content = {'form': form}
    return render_to_response("dynamics-manage.html", content, context_instance=RequestContext(request))


@login_required(login_url='/admin/login/')
def settings(request):
    form = BlankEditor()
    content = {'form': form}
    return render_to_response("settings.html", content, context_instance=RequestContext(request))


@login_required(login_url='/admin/login/')
def form_designer(request):
    return render_to_response("form-designer.html", context_instance=RequestContext(request))


@login_required(login_url='/admin/login/')
def form_statistics(request):
    return render_to_response("form-statistics.html", context_instance=RequestContext(request))


def login(request):
    status = ''
    if request.user.is_authenticated():
        return HttpResponseRedirect('/admin/dynamics-manage')
    else:
        if request.POST:
            post = request.POST
            username = post.get('username', '')
            password = post.get('password', '')
            user = auth.authenticate(username=username, password=password)
            if user is not None:
                auth.login(request, user)
                return HttpResponseRedirect('/admin/dynamics-manage')
            else:
                status = 'failed'
    content = {'status': status}
    return render_to_response('login.html', content, context_instance=RequestContext(request))


def logout(request):
    auth.logout(request)
    return HttpResponseRedirect('/')


# 获得全部动态
def get_all_dynamics(req):
    dynamics_list = Dynamics.objects.order_by('-pub_time')
    data_list = []
    for item in dynamics_list:
        if item.paper:
            PaperID = item.paper.id
        else:
            PaperID = "null"
        data_list.append({
            "ID": item.id,
            "PaperID": PaperID,
            "PaperEnabled": item.paperenabled,
            "Title": item.title,
            "Author": item.author,
            "PublishDate": item.pub_time.strftime("%Y-%m-%d %H:%M:%S"),
            "Abstract": item.abstract,
            "Type": str(item.tag),
            "Content": item.content,
            "ViewedTimes": item.viewedtimes
        })
    tag_list = {}
    for tag in Tag.objects.all():
        tag_list[tag.title] = tag.data
    return HttpResponse(json.dumps({'Dynamics': data_list, "Types": tag_list}), content_type="application/json")


# 获得最新的十条动态
def get_latest_dynamics(req):
    dynamics_list = Dynamics.objects.order_by('-pub_time')[0:10]
    data_list = []
    for item in dynamics_list:
        if item.paper:
            PaperID = item.paper.id
        else:
            PaperID = "null"
        data_list.append({
            "ID": item.id,
            "PaperID": PaperID,
            "PaperEnabled": item.paperenabled,
            "Title": item.title,
            "Author": item.author,
            "PublishDate": item.pub_time.strftime("%Y-%m-%d %H:%M:%S"),
            "Abstract": item.abstract,
            "Type": str(item.tag),
            "ViewedTimes": item.viewedtimes
        })
    return HttpResponse(json.dumps({'Dynamics': data_list}), content_type="application/json")


def dynamics_mobile(req):
    try:
        Id = req.GET['ID']
        dyn = Dynamics.objects.get(pk=Id)
    except:
        return HttpResponseRedirect('/dynamics/')
    content = {'dyn': dyn}
    return render_to_response('dynamics-mobile.html', content, context_instance=RequestContext(req))


# 添加动态
@login_required(login_url='/admin/login/')
def addDynamics(req):
    new_dyn = Dynamics(
        title="",
        author="",
        pub_time=datetime.datetime.now(),
        content="",
        abstract="",
        tag=Tag.objects.all()[0],
    )
    new_dyn.save()
    data = {
        "ID": new_dyn.id,
        "PaperID": "null",
        "PaperEnabled": new_dyn.paperenabled,
        "Title": new_dyn.title,
        "Author": new_dyn.author,
        "PublishDate": new_dyn.pub_time.strftime("%Y-%m-%d %H:%M:%S"),
        "Abstract": new_dyn.abstract,
        "Type": new_dyn.tag.title,
        "Content": new_dyn.content,
    }
    return HttpResponse(json.dumps(data), content_type="application/json")


# 删除动态
@login_required(login_url='/admin/login/')
def deleteDynamics(req):
    status = ""
    try:
        Id = req.POST['ID']
        dyn = Dynamics.objects.get(pk=Id)
        enroll = Enroll.objects.filter(dynamic=dyn)
        if dyn.paper:
            dyn.paper.delete()
        if len(enroll) == 1:
            enroll[0].delete()
        dyn.delete()
        status = "success"
    except:
        status = "failed"
    return HttpResponse(json.dumps({'Status': status}), content_type="application/json")


# 修改动态
@login_required(login_url='/admin/login/')
def editDynamics(req):
    status = ""
    if req.POST:
        post = req.POST
        try:
            Id = post['ID']
            dyn = Dynamics.objects.get(pk=Id)
        except:
            return HttpResponseRedirect('/admin/dynamics-manage/')
        dyn.title = post['Title']
        dyn.author = post['Author']
        dyn.paperenabled = post['PaperEnabled'] == "true"
        dyn.abstract = post['Abstract']
        dyn.tag = Tag.objects.filter(title=post['Type'])[0]
        dyn.content = post['Content']
        dyn.viewedtimes = post['ViewedTimes']
        dyn.save()
        status = "success"
    return HttpResponse(json.dumps({'Status': status}), content_type="application/json")


# 添加问卷
@login_required(login_url='/admin/login/')
def addPaper(req):
    try:
        Id = req.POST['DynamicsID']
        dyn = Dynamics.objects.get(pk=Id)
        new_paper = Paper()
        new_paper.save()
        dyn.paper = new_paper
        dyn.paperenabled = True
        dyn.save()
    except:
        return HttpResponseRedirect('/admin/dynamics-manage/')
    content = {'ID': new_paper.id}
    return HttpResponse(json.dumps(content), content_type="application/json")


# 修改问卷
@login_required(login_url='/admin/login/')
def editPaper(req):
    status = ""
    Id = req.POST['ID']
    try:
        paper = Paper.objects.get(pk=Id)
    except:
        status = "failed"
        return HttpResponse(json.dumps({'Status': status}), content_type="application/json")
    if req.POST:
        post = req.POST
        paper.data = post["Questions"]
        paper.html = post["HTML"]
        paper.save()
        status = "success"
    return HttpResponse(json.dumps({'Status': status}), content_type="application/json")


@login_required(login_url='/admin/login/')
def updateEnroll(req):
    paper_id = req.POST['Paper']
    question_id = req.POST['Question']
    p = Paper.objects.get(pk=paper_id)
    dyn = Dynamics.objects.get(paper=p)
    enroll = Enroll.objects.all()
    if len(enroll) == 0:
        new_enroll = Enroll(dynamic=dyn,
                            paper=p,
                            questionID=question_id)
        new_enroll.save()
    else:
        old_enroll = enroll[0]
        old_enroll.dynamic = dyn
        old_enroll.paper = p
        old_enroll.questionID = question_id
        old_enroll.save()
    status = "success"
    return HttpResponse(json.dumps({'Status': status}), content_type="application/json")


def getEnroll(req):
    data = {}
    try:
        enrolls = Enroll.objects.all()
        if len(enrolls) == 0:
            data["Dynamic"] = -1
            data["Paper"] = -1
            data["Question"] = -1
        else:
            enroll = enrolls[0]
            data["Dynamic"] = enroll.dynamic.pk
            data["Paper"] = enroll.paper.pk
            data["Question"] = enroll.questionID
    except:
        data["Dynamic"] = -1
        data["Paper"] = -1
        data["Question"] = -1
    finally:
        return HttpResponse(json.dumps(data), content_type="application/json")


def deleteEnroll(req):
    try:
        enrolls = Enroll.objects.all()
        enrolls[0].delete()
        status = "success"
    except:
        status = "failed"
    return HttpResponse(json.dumps({'Status': status}), content_type="application/json")


# 查看问卷
def checkPaper(req):
    Id = req.GET['ID']
    try:
        paper = Paper.objects.get(pk=Id)
    except:
        return HttpResponseRedirect('/admin/dynamics-manage/')
    paper_data = {
        "ID": paper.id,
        "Questions": paper.data,
        "HTML": paper.html,
    }
    return HttpResponse(json.dumps(paper_data), content_type="application/json")


# 填写问卷
def joinPaper(req):
    status = ""
    try:
        Id = req.POST['PaperID']
        paper = Paper.objects.get(pk=Id)
        paper_dynamics = Dynamics.objects.get(paper=paper)
        if not paper_dynamics.paperenabled:
            status = "failed"
        elif req.POST:
            post = req.POST
            push = Push(paper=paper)
            push.data = post['Answer']
            push.save()
            status = 'success'
    except:
        status = "failed"
    return HttpResponse(json.dumps({'Status': status}), content_type="application/json")


# 问卷数据统计和展示
@login_required(login_url='/admin/login/')
def get_all_push(req):
    Id = req.GET['ID']
    try:
        paper = Paper.objects.get(pk=Id)
    except:
        return HttpResponseRedirect('/admin/dynamics-manage/')
    response = HttpResponse(content_type='text/csv')
    content_disposition = u'attachment; filename=\"' + u'统计数据.csv\"'
    response['Content-Disposition'] = content_disposition.encode('gbk')
    writer = csv.writer(response)
    paper_data = json.loads(paper.data)
    table_head = [item["Question"].encode('gbk') for item in paper_data]
    writer.writerow(table_head)
    push_list = Push.objects.filter(paper=paper)
    for push in push_list:
        temp_list = json.loads(push.data)
        ordered_list = []
        for i in xrange(len(temp_list)):
            key = str(i + 1)
            temp_list[key] = temp_list[key].encode('gbk')
            ordered_list.append(temp_list[key])
        writer.writerow(ordered_list)
    return response


@login_required(login_url='/admin/login/')
def update_banner(req):
    image = req.POST["Image"]
    url = req.POST["URL"]
    try:
        banners = Banner.objects.all()
        if len(banners) == 0:
            new_banner = Banner(
                image=image,
                url=url,
            )
            new_banner.save()
        else:
            old_banner = banners[0]
            old_banner.image = image
            old_banner.url = url
            old_banner.save()
        status = 'success'
    except:
        status = 'failed'
    return HttpResponse(json.dumps({'Status': status}), content_type="application/json")


def get_banner(req):
    data = {}
    try:
        banners = Banner.objects.all()
        if len(banners) == 0:
            data["Image"] = ""
            data["URL"] = ""
        else:
            banner = banners[0]
            data["Image"] = banner.image
            data["URL"] = banner.url
    except:
        data["Image"] = ""
        data["URL"] = ""
    finally:
        return HttpResponse(json.dumps(data), content_type="application/json")


def get_settings(req):
    data = {}
    try:
        all_settings = Setting.objects.all()
        if len(all_settings) == 0:
            data["BannerEnabled"] = False
            data["LinksEnabled"] = False
        else:
            firstSettings = all_settings[0]
            data["BannerEnabled"] = firstSettings.bannerEnabled
            data["LinksEnabled"] = firstSettings.linksEnabled
    except:
        data["BannerEnabled"] = False
        data["LinksEnabled"] = False
    finally:
        return HttpResponse(json.dumps(data), content_type="application/json")


def update_settings(req):
    banner_enabled = req.POST["BannerEnabled"]
    links_enabled = req.POST["LinksEnabled"]
    try:
        all_settings = Setting.objects.all()
        if len(all_settings) == 0:
            new_settings = Setting(
                bannerEnabled=banner_enabled == "true",
                linksEnabled=links_enabled == "true"
            )
            new_settings.save()
        else:
            old_settings = all_settings[0]
            old_settings.bannerEnabled = banner_enabled == "true"
            old_settings.linksEnabled = links_enabled == "true"
            old_settings.save()
        status = 'success'
    except:
        status = 'failed'
    return HttpResponse(json.dumps({'Status': status}), content_type="application/json")


@login_required(login_url='/admin/login/')
def getPushesbyID(req):
    Id = req.GET['ID']
    paper = Paper.objects.get(pk=Id)
    push_list = Push.objects.filter(paper=paper)
    push_data = []
    for push in push_list:
        push_data.append(push.data)
    data = {
        "Paper": paper.data,
        "Pushes": push_data
    }
    return HttpResponse(json.dumps(data), content_type="application/json")


@login_required(login_url='/admin/login/')
def updateLink(req):
    try:
        if req.POST:
            post = req.POST
            json_link = post.get("JSON", "")
            all_links = Link.objects.all()
            if len(all_links) == 0:
                new_links = Link(Json=json_link)
                new_links.save()
            else:
                old_links = all_links[0]
                old_links.Json = json_link
                old_links.save()
            status = "success"
    except:
        status = "failed"
    finally:
        return HttpResponse(json.dumps({'Status': status}), content_type="application/json")


def getLink(req):
    data = {}
    try:
        all_links = Link.objects.all()
        if len(all_links) == 0:
            data["JSON"] = ""
        else:
            firstLink = all_links[0]
            data["JSON"] = firstLink.Json
    except:
        data["JSON"] = ""
    finally:
        return HttpResponse(json.dumps(data), content_type="application/json")


def telemetry(req):
    status = "failed"
    try:
        dyn_id = req.POST["ID"]
        dyn = Dynamics.objects.get(pk=dyn_id)
        dyn.viewedtimes += 1
        dyn.save()
        status = "success"
    except:
        status = "failed"
    finally:
        return HttpResponse(json.dumps({'Status': status}), content_type="application/json")
