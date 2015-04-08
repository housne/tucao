#!/usr/local/bin/python
# coding: utf-8

import sqlite3
from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship, backref
import os
from fetch import Fetch

Base = declarative_base()
engine = create_engine('sqlite:///news.db', echo=True)

class news(Base):
	__tablename__ = 'news'

	id = Column(Integer, primary_key=True)
	news_id = Column(Integer)
	body = Column(String)
	title = Column(String)
	image_source = Column(String)
	image = Column(String)
	thumbnail = Column(String)
	date = Column(DateTime)


# def create_conf_file():
# 	access_key = input('qiniu access key')
# 	secrect_key = input('qiniu secrect key')
# 	bucket_name = input('qiniu bucket name')
# 	bucket_host = input('qiniu bucket host')
# 	site_url = input('site url include http')
# 	conf_file = open(os.path.dirname(__file__) + 'conf.py', 'w+')
# 	data = '''
# 	access_key="%s"\n
# 	secrect_key="%s"\n
# 	qiniu_bucket_name=%s\n
# 	qiniu_bucket_host=%s\n
# 	site_url=%s
# 	''' %(access_key, secrect_key, bucket_name, qiniu_bucket_host, site_url)
# 	conf_file.write(data)
# 	conf_file.close()


if __name__ == '__main__':
	#create_conf_file()
	Base.metadata.create_all(engine)
	fetch = Fetch()
	fetch.init_fetch()