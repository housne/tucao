#-*- coding:utf-8 -*-
import urllib2
import json
import requests
from conf import *
import qiniu
from bs4 import BeautifulSoup
import fetch
import os

def parse_news_body(body):
    soup = BeautifulSoup(body)
    for img in soup.find_all('img'):
        img['src'] = upload_to_qiniu(img['src'])
    return unicode(soup)


def upload_to_qiniu(url):
    data = fetch_data(url, type="raw")
    q = qiniu.Auth(qiniu_access_key, qiniu_secrect_key)
    token = q.upload_token(qiniu_bucket_name)
    ret, info = qiniu.put_data(token, None, data)
    if ret is not None:
        return qiniu_bucket_host + "/" + ret['hash']
    else:
        return "%s/404-icon.png" %(qiniu_bucket_host)

def fetch_data(url, type=None):
    request = urllib2.Request(url)
    request.add_header('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.118 Safari/537.36')
    request.add_header('Referer', 'http://www.zhihu.com')
    try:
        response = urllib2.urlopen(request, timeout=30)
    except urllib2.HTTPError, e:
        return None
    if type == 'raw':
        return response.read()
    data = json.load(response)
    return data

def fetch_log(log):
    with open(os.path.dirname(__file__) + '/fetch.log', 'a+') as log_file:
        log_file.write("%s \n" %log)

