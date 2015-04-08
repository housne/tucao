from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship, backref

Base = declarative_base()
engine = create_engine('sqlite:///news.db', connect_args={'check_same_thread':False})
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
	thumbnail = Column(String)
	date = Column(DateTime)

	def __init__(self, news_id=None, body=None, title=None, image_source=None, image=None, thumbnail=None, date=None):
		self.news_id = news_id
		self.body = body
		self.title = title
		self.image_source = image_source
		self.image = image 
		self.thumbnail = thumbnail
		self.date = date

	def get(self):
		news = session.query(News).filter(News.news_id == self.news_id).first()
		return row2dict(news)

	def save(self, news):
		news = News(news_id=news['id'], body=news['body'], title=news['title'], image_source=news['image_source'], image=news['image'], thumbnail=news['thumbnail'], date=news['date'])
		session.add(news)
		try:
			session.commit()
		except:
			session.rollback()

	def list(self, offset=0, limit=20, page=1):
		page = page - 1
		if page != 0:
			offset = limit * page
		newses = session.query(News.news_id, News.title, News.date, News.thumbnail).offset(offset).limit(limit)
		fields = ('news_id', 'title', 'date', 'thumbnail')
		return [dict(zip(fields, d)) for d in newses]

	def sort(self):
		newses = session.query(News).limit(10)
		return [row2dict(news) for news in newses]

	def count(self, limit=20):
		count = session.query(News).count()
		total = int(count / limit);
		if count % limit != 0 and total > 0:
			total += 1
		return total



def row2dict(row):
	if row is None:
		return row
	d = {}
	for column in row.__table__.columns:
		d[column.name] = getattr(row, column.name)
	return d