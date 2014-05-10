#-*- coding:utf-8 -*-

import tornado.ioloop
import tornado.web
import urllib2
import json
import tornado.autoreload
import os
import re
import time
import datetime
from email.Utils import formatdate
from db import News

dirname = os.path.dirname(__file__)
TEMPATE_PATH = os.path.join(dirname, 'template')
IMAGE_PATH = os.path.join(dirname, 'images')

settings = {
	'template_path': TEMPATE_PATH,
	'debug': True
}

section = 2
sectionUrl = 'http://news-at.zhihu.com/api/2/section/' + str(section)
newsUrl = 'http://news-at.zhihu.com/api/2/news/'
beforeUlr = sectionUrl + '/before/'
cache = {}

def requestData(url, type=None):
	request = urllib2.Request(url)
	request.add_header('User-Agent', 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/34.0.1847.131 Safari/537.36')
	request.add_header('Referer', 'http://www.zhihu.com')
	try:
		response = urllib2.urlopen(request, timeout=30)
	except urllib2.HTTPError, e:
		return None
	if type == 'raw':
		return response.read()
	data = json.load(response)
	return data

class Cache(object):

	def __init__(self, key=None):
		self.key = key

	def get(self):
		try:
			data = cache[self.key]
			now = time.time()
			if 'expire' not in cache[self.key]:
				cache.pop(self.key, None)
				return 'expired'
			expire = cache[self.key]['expire']
			if now >= expire:
				return 'expired'
		except KeyError:
			return None
		return data['data']

	def save(self, data, expire):
		cache[self.key] = {}
		cache[self.key]['data'] = data
		cache[self.key]['expire'] = time.time() + expire
		

def notFound(RequestHandler):
	RequestHandler.clear()
	RequestHandler.set_status(404)
	RequestHandler.finish("404")

def imgReplace(str):
	body = re.sub(r'http\://[\w-]+\.zhimg\.com', '/images', str)
	return body

def getNews(news_id):
	news = News(news_id)
	data = news.get()
	return data

def formatDatetime(date):
	date = str(date)
	date = datetime.datetime.strptime(date, '%Y%m%d')
	date = str(date) + '+08:00'
	return date

class IndexHandler(tornado.web.RequestHandler):
	def get(self):
		indexCache = Cache(key='index')
		data = indexCache.get()
		if data is None or data == 'expired':
			data = requestData(sectionUrl)
			for i, v in enumerate(data['news']):
				data['news'][i]['thumbnail'] = imgReplace(v['thumbnail'])
			indexCache.save(data, 60*60*12)
		self.render('index.html', data = data)

class NewsHandler(tornado.web.RequestHandler):
	def get(self, news_id):
		data = getNews(news_id)
		if data is None:
			data = requestData(newsUrl + str(news_id))
			if data is None:
				notFound(self)
			data['body'] = imgReplace(data['body'])
			try:
				data['image'] = imgReplace(data['image'])
			except KeyError:
				data['image'] = 'default-lg.jpg'
			news = News(int(data['id']))
			news.save(data)
		self.render('news.html', data = data)

class ImageHandler(tornado.web.RequestHandler):
	def get(self, level, block, name, type):
		directory = IMAGE_PATH + '/%s/%s/' %(level, block)
		imageName = '%s.%s' %(name, type)
		try:
			data = open(directory + imageName, 'rb')
			data = data.read()
		except IOError:
			url = 'http://www.zhimg.com/%s/%s/%s.%s' %(level, block, name, type)
			data = requestData(url, type='raw')
			if not os.path.exists(directory):
				os.makedirs(directory)
			saveImage = open(directory + imageName, 'w+')
			saveImage.write(data)
			saveImage.close()
			if data is None:
				notFound(self)
		self.set_header('Content-Type', 'image/'+ type)
		self.write(data)

class BeforeHandler(tornado.web.RequestHandler):
	def get(self, date):
		beforeCache = Cache(key='before' + str(date))
		data = beforeCache.get()
		if data is None or data == 'expired':
			data = requestData(beforeUlr + date)
			for i, v in enumerate(data['news']):
				data['news'][i]['thumbnail'] = imgReplace(v['thumbnail'])
			beforeCache.save(data, 60*60*24)
		self.render('index.html', data = data)

class RssHandler(tornado.web.RequestHandler):
	def get(self):
		rssCache = Cache(key='rss')
		RssnNewsList = rssCache.get()
		if RssnNewsList is None or RssnNewsList == 'expired':
			latestList = requestData(sectionUrl)
			newsList = []
			for i in range(10):
				newsList.append(latestList['news'][i])
			RssnNewsList = []
			for i, news in enumerate(newsList):
				data = requestData(newsUrl + str(news['news_id']))
				data['date'] = newsList[i]['date']
				data['date'] = formatDatetime(data['date'])
				data['body'] = imgReplace(data['body'])
				RssnNewsList.append(data)
			rssCache.save(RssnNewsList, 60*60*24)
		self.set_header('Content-Type', 'application/xml')
		self.render('rss.xml', data = RssnNewsList)

application = tornado.web.Application([
		(r'/', IndexHandler),
		(r'/news/([0-9]+)', NewsHandler),
		(r'/images/([^/]+)/([^/]+)/([a-z0-9_\-]+).([^/]+)', ImageHandler),
		#(r'/before/([0-9]+)', BeforeHandler),
		(r'/rss', RssHandler)
	], **settings)


if __name__ == '__main__':
	application.listen(8090)
	tornado.ioloop.IOLoop.instance().start()