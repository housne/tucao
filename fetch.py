#-*- coding:utf-8 -*-
import urllib2
import json
import requests
import time
from news import News
from utils import *
from threading import Thread
from datetime import datetime


section = 2
sectionUrl = 'http://news-at.zhihu.com/api/2/section/' + str(section)
newsUrl = 'http://news-at.zhihu.com/api/2/news/'
beforeUlr = sectionUrl + '/before/'


class Fetch(Thread):

    def __get_news_from_api(self):
        news = News()
        news_ids_from_database = [news['news_id'] for news in news.list()]
        news_from_api = self.fetch_data(sectionUrl)['news']
        news_ids_from_api = [news['news_id'] for news in news_from_api]
        if news_ids_from_api[0] != news_ids_from_database[0]:
            fetch_log("detected new data from api")
            matched = [idx for idx, val in enumerate(news_ids_from_api) if val == news_ids_from_database[0]]
            if len(matched) == 0:
                end = len(news_ids_from_api)
            else:
                end = matched[0]
            fetch_log("end index is %s" %end)
            return [self.__fetch_news(news) for news in news_from_api[:end]][::-1]
        else:
           return None

    def __fetch_news(self, news_data):
        data = self.fetch_data(newsUrl + str(news_data['news_id']))
        if data is None or news_data['news_id'] != data['id']:
            return None
        data['body'] = parse_news_body(data['body'])
        try:
            data['image'] = upload_to_qiniu(data['image'])
        except KeyError:
            data['image'] = 'default-lg.jpg'
        data['thumbnail'] = upload_to_qiniu(news_data['thumbnail'])
        data['date'] = datetime.strptime(news_data['date'], '%Y%m%d')
        news = News(news_id=int(data['id']))
        news.save(data)
        return news_data['news_id']

    def fetch_data(self, url, type=None):
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

    def init_fetch(self):
        print('fetching from api for the first time...')
        news_from_api = self.fetch_data(sectionUrl)['news']
        print('index data fetch finished')
        for news in news_from_api[::-1]:
            id = self.__fetch_news(news)
            print('news id %d fetched' %id)
        print('done')
        

    def run(self):
        while True:
            self.__get_news_from_api()
            time.sleep(60*60*2)

    

