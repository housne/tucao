#!/usr/local/bin/python
# coding: utf-8

import sqlite3
from sqlalchemy import create_engine, Column, Integer, String, Date, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship, backref

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

if __name__ == '__main__':
	Base.metadata.create_all(engine)