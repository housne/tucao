#-*- coding:utf-8 -*-

import tornado.ioloop
import tornado.web
import urllib2
import json
import tornado.autoreload
import os
import re

dirname = os.path.dirname(__file__)
TEMPATE_PATH = os.path.join(dirname, 'template')

settings = {
	'template_path': TEMPATE_PATH,
	'debug': True
}

section = 2
sectionUrl = 'http://news-at.zhihu.com/api/2/section/' + str(section)
newsUrl = 'http://news-at.zhihu.com/api/2/news/'
beforeUlr = sectionUrl + '/before/'

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

def notFound(RequestHandler):
	RequestHandler.clear()
	RequestHandler.set_status(404)
	RequestHandler.finish("404")

def imgReplace(str):
	body = re.sub(r'http\://[\w-]+\.zhimg\.com', '/images', str)
	return body

class IndexHandler(tornado.web.RequestHandler):
	def get(self):
		data = requestData(sectionUrl)
		for i, v in enumerate(data['news']):
			data['news'][i]['thumbnail'] = imgReplace(v['thumbnail'])
		self.render('index.html', data = data)

class NewsHandler(tornado.web.RequestHandler):
	def get(self, news_id):
		data = requestData(newsUrl + str(news_id))
		if data is None:
			notFound(self)
		data['body'] = imgReplace(data['body'])
		try:
			data['image'] = imgReplace(data['image'])
		except KeyError:
			data['image'] = '/images/default-lg.jpg'
		self.render('news.html', data = data)

class ImageHandler(tornado.web.RequestHandler):
	def get(self, level, block, name, type):
		url = 'http://www.zhimg.com/%s/%s/%s.%s' %(level, block, name, type)
		data = requestData(url, type='raw')
		if data is None:
			notFound(self)
		self.set_header('Content-Type', 'image/'+ type)
		self.write(data)

class BeforeHandler(tornado.web.RequestHandler):
	def get(self, date):
		data = requestData(beforeUlr + date)
		for i, v in enumerate(data['news']):
			data['news'][i]['thumbnail'] = imgReplace(v['thumbnail'])
		self.render('index.html', data = data)

class RssHandler(tornado.web.RequestHandler):
	def get(self):
		latestList = requestData(sectionUrl)
		newsList = []
		for i in range(10):
			newsList.append(latestList['news'][i])
		RssnNewsList = []
		for i, news in enumerate(newsList):
			data = requestData(newsUrl + str(news['news_id']))
			data['date'] = newsList[i]['date']
			data['body'] = imgReplace(data['body'])
			RssnNewsList.append(data)
		self.set_header('Content-Type', 'application/xml')
		self.render('rss.xml', data = RssnNewsList)

application = tornado.web.Application([
		(r'/', IndexHandler),
		(r'/news/([0-9]+)', NewsHandler),
		(r'/images/([^/]+)/([^/]+)/([a-z0-9_\-]+).([^/]+)', ImageHandler),
		(r'/before/([0-9]+)', BeforeHandler),
		(r'/rss', RssHandler)
	], **settings)


if __name__ == '__main__':
	application.listen(8090)
	tornado.ioloop.IOLoop.instance().start()