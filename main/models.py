# -*-coding:utf-8-*-
from django.db import models
from DjangoUeditor.models import UEditorField


# Create your models here.

class Tag(models.Model):
    title = models.CharField(max_length=128)
    data = models.CharField(max_length=128)

    def __unicode__(self):
        return self.title


class Paper(models.Model):
    now_num = models.IntegerField(default=0)
    data = models.TextField()
    html = models.TextField()
    

class Dynamics(models.Model):
    title = models.CharField(max_length=128)
    author = models.CharField(max_length=128)
    pub_time = models.DateTimeField()
    content = UEditorField(null=True, blank=True, imagePath="image/%(datetime)s.%(extname)s",
                        filePath="files/%(basename)s_%(datetime)s.%(extname)s")
    abstract = models.CharField(max_length=80)
    tag = models.ForeignKey(Tag)
    viewedtimes = models.IntegerField(default=0)
    paper = models.ForeignKey(Paper, null=True)
    paperenabled = models.BooleanField(default=False)

    def __unicode__(self):
        return self.title


class Push(models.Model):
    paper = models.ForeignKey(Paper)
    data = models.TextField()


class Answer(models.Model):
    question = models.TextField()
    answer = models.TextField()
    paper = models.ForeignKey(Paper)


class Enroll(models.Model):
    dynamic = models.ForeignKey(Dynamics)
    paper = models.ForeignKey(Paper)
    questionID = models.IntegerField(default=0)


class Banner(models.Model):
    image = models.TextField(default="")
    url = models.TextField(default="")


class Setting(models.Model):
    bannerEnabled = models.BooleanField(default=False)
    linksEnabled = models.BooleanField(default=False)


class Link(models.Model):
    Json = models.TextField(default="")
