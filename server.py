#-*- coding:utf-8 -*-

from flask import Flask, jsonify, render_template, make_response
import os
from news import News
from conf import *
from fetch import Fetch
from cache import Cache
import time
import datetime

app = Flask(__name__, static_url_path='/assets')

def jsonResponse(data=None, type=None):
    response = {}
    status = 200
    if type == None:
        response['code'] = 0
        response['result'] = data
    elif type == '404':
        status = 404
        response = {"code": 404, "message": "Not Found"}
    elif type == '500':
        status = 500
        response =  {"code": 500, "message": "Server Eroor"}
    response = jsonify(response)
    response.status_code = status
    return response


@app.route('/api/news')
def index():
    news = News()
    data = news.list()
    if data is None:
        return jsonResponse(type='404')
    for i, item in enumerate(data):
        data[i]['date'] = time.mktime(item['date'].timetuple())
        print(data[i]['date'])
    return jsonResponse(data=data)

@app.route('/api/news/<int:id>')
def news(id):
    news = News(news_id=id)
    data = news.get()
    if data is None:
        return jsonResponse(type='404')
    return jsonResponse(data=data)

@app.route('/rss')
def rss():
    news = News()
    data = news.sort()
    response = make_response(render_template('rss.xml', data=data, site_url=site_url))
    response.headers['Content-Type'] = 'application/atom+xml; charset=utf-8'
    return response


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catch_all(path):
    return render_template('index.html')


if __name__ == '__main__':
    fetch = Fetch()
    fetch.start()
    app.run(debug="True")
