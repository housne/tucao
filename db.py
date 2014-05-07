from sqlalchemy import create_engine, Column, Integer, String, Date, ForeignKey, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship, backref

Base = declarative_base()
engine = create_engine('sqlite:///news.db', echo=True)
Session = sessionmaker(bind=engine)
session = Session()

class News(Base):
	__tablename__ = 'news'

	id = Column(Integer, primary_key=True)
	news_id = Column(Integer)
	body = Column(String)
	title = Column(String)
	image_source = Column(String)
	image = Column(String)

	def __init__(self, news_id=None, body=None, title=None, image_source=None, image=None):
		self.news_id = news_id
		self.body = body
		self.title = title
		self.image_source = image_source
		self.image = image 

	def get(self):
		news = session.query(News).filter(News.news_id == self.news_id).first()
		return row2dict(news)

	def save(self, news):
		news = News(news_id=news['id'], body=news['body'], title=news['title'], image_source=news['image_source'], image=news['image'])
		session.add(news)
		session.commit()


def row2dict(row):
	if row is None:
		return row
	d = {}
	for column in row.__table__.columns:
		d[column.name] = getattr(row, column.name)
	return d