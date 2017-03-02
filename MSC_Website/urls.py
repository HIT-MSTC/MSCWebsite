# -*-coding:utf-8-*-
"""MSC_Website URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.8/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Add an import:  from blog import urls as blog_urls
    2. Add a URL to urlpatterns:  url(r'^blog/', include(blog_urls))
"""
from django.conf.urls import include, url
from django.contrib import admin
from main import views
from django.conf import settings

urlpatterns = [
    url(r'^$', views.index),
    url(r'^index-mobile/', views.index_mobile),
    url(r'^dynamics/', views.dynamics),
    url(r'^dynamics-mobile-all/', views.dynamics_mobile_all),
    url(r'^dynamics-mobile/', views.dynamics_mobile),

    url(r'^suadmin/', include(admin.site.urls)),
    url(r'^admin/$', views.login),
    url(r'^admin/login/', views.login),
    url(r'^admin/logout/', views.logout),
    url(r'^admin/dynamics-manage/', views.dynamics_manage),
    url(r'^admin/settings/', views.settings),
    url(r'^admin/form-designer/', views.form_designer),
    url(r'^admin/form-statistics/', views.form_statistics),

    url(r'^api/addDynamics/', views.addDynamics),
    url(r'^api/editDynamics/', views.editDynamics),
    url(r'^api/deleteDynamics/', views.deleteDynamics),
    url(r'^api/dynamics10/', views.get_latest_dynamics),
    url(r'^api/dynamicsall/', views.get_all_dynamics),

    url(r'^api/checkPaper/', views.checkPaper),
    url(r'^api/addPaper/', views.addPaper),
    url(r'^api/editPaper/', views.editPaper),
    url(r'^api/join/', views.joinPaper),
    url(r'^api/sum/', views.get_all_push),
    url(r'^api/paperCount/',views.getPushesbyID),

    url(r'^api/updateEnroll/', views.updateEnroll),
    url(r'^api/getEnroll/', views.getEnroll),
    url(r'^api/deleteEnroll/', views.deleteEnroll),

    url(r'^api/updateBanner/', views.update_banner),
    url(r'^api/getBanner/', views.get_banner),

    url(r'^api/updateLink/', views.updateLink),
    url(r'^api/getLink/', views.getLink),

    url(r'^api/getSettings/', views.get_settings),
    url(r'^api/updateSettings/', views.update_settings),

    url(r'^api/telemetry/', views.telemetry),

    url(r'^ueditor/', include('DjangoUeditor.urls')),
    url(r'^media/(?P<path>.*)$', 'django.views.static.serve', {'document_root': settings.MEDIA_ROOT}),
]