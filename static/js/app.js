
(function(window){

    var articleImg = '';

    var $http =  {
        'get': function(url, args){
            return request('GET', url, args);
        },
        'post': function(url, args){
            return request('POST', url, args);
        }
    };

    var $selector = function(selector){
        if(/^\#.+/.test(selector)) return document.getElementById(selector.replace('#', ''));
        if(/^\..+/.test(selector)) return document.getElementsByClassName(selector.replace('.', ''));
    }

    Element.prototype.addClass = function(klass){
        if(this.className.indexOf(klass) !== -1) return this;
        if(!this.className){
            this.className = klass;
        }else{
            this.className += ' ' + klass;
        };
        return this;
    };

    Element.prototype.removeClass = function(klass){
        if(!this.className || this.className.indexOf(klass) === -1) return this;
        if(this.className.indexOf(' ') === -1 && this.className === klass){
            this.removeAttribute('class');
            return this;
        };
        var klasses = this.className.split(' ');
        var replacer = (klass !== klasses[0] && klass !== klasses[klasses.length - 1]) ? ' ' : '';
        var reg = new RegExp('\\s*'+ klass +'\\s*', 'g');
        this.className = this.className.replace(reg, replacer);
        return this;
    };

    Element.prototype.delegate = function(event, target, callback){
        this.addEventListener(event, function(event){
            var eTarget = event.target;
            while(eTarget.tagName.toLowerCase() !== target && eTarget.parentNode){
                if(eTarget.tagName.toLowerCase() === 'body') break;
                eTarget = eTarget.parentNode;
            };
            if(eTarget.tagName.toLowerCase() !== target) return;
            callback(event, eTarget);
        });
        return this;
    }

    Element.prototype.setTransLate = function(transform){
        var direct = 'Y';
        var clientWidth = window.innerWidth;
        if(clientWidth <= 600){
            var transform = transform < 0 ? -clientWidth : clientWidth;
            direct = 'X'
        }
        this.setAttribute('style', 'transform:translate' + direct + '('+ transform +'px); -webkit-transform: translate' + direct + '('+ transform +'px);');
        return this;
    }

    Element.prototype.addEventListeners = function(events, fn){
        var events = events.split(' ');
        var self = this;
        events.forEach(function(event){
            self.addEventListener(event, fn);
        })
    }


    function request(method, url, args){
        return new Promise(function(resolve, reject){
            var xhr = new XMLHttpRequest();
            var uri = url;
            if(args) {
                uri += '?';
                for (key in args) {
                    if (args.hasOwnProperty(key)) {
                        uri += encodeURIComponent(key) + '=' + encodeURIComponent(args[key]) + '&';
                    }
                };
            };
            if(method === 'POST' || method === 'PUT'){
                xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            };
            xhr.addEventListener('readystatechange', function(){
                if(xhr.readyState === 4 && xhr.status === 200){
                    resolve(JSON.parse(xhr.responseText));
                }else if(xhr.readyState === 4 && xhr.status !== 200){
                    reject('request error');
                }
            });
            xhr.open(method, uri);
            xhr.send();
        });
    };

    function initialize(){
        pushStateRouterHandler();
        routeHandler();
        window.addEventListener('popstate', routeHandler)
        initializeRefresh();
        shareComponent();
    };

    function pushStateRouterHandler(){
        document.getElementsByTagName('body')[0].delegate('click', 'a', function(event, target){
            var href = target.getAttribute('href') || '';
            if(!/^\/.*$/.test(href)) return;
            event.preventDefault();
            history.pushState({}, document.title, href);
            routeHandler();
        });
    }

    function routeHandler(){
        var path = window.location.pathname;
        if(/^\/news\/\d+/.test(path)){
            var id = path.replace(/^\/news\/(\d+)/, '$1');
            initializeNews(id);
        }else if(/\//.test(path)){
            initializeIndex();
        };
        if(window.ga) window.ga('send', 'pageview', window.location.pathname);
    }

    function initializeRefresh(){
        var page = 1;
        localStorage['page'] = 1;
        $http.get('/api/news', {'page': page}).then(function(response){
            render(response);
            if(response.total > 1) $selector('#pagination').style.display = 'block';
        });
        var render = function(response){
            var result = response.result;
            result = convertTimestampToLoaleDateString(result);
            var html = '';
            result.forEach(function(news){
                html += '<li>';
                html += '    <a href="/news/'+ news.news_id +'">';
                html += '        <img src="'+ news.thumbnail +'">';
                html += '        <div class="news-summary">';
                html += '            <span class="news-date">'+ news.date +'</span><span class="news-title">'+ news.title +'</span>';
                html += '        </div>';
                html += '    </a>';
                html += '</li>';
            });
            $selector('#newsList').innerHTML += html;
        };
        $selector('#loadMore').addEventListener('click', function(){
            pagination(render);
        });

    }

    function initializeIndex(){
        if(!isMinWidth()) window.scrollTo(0, 0);
        $selector('#newsView').setTransLate(getPageHeight());
        window.scrollTo(0, 0);
        setTimeout(function(){$selector('#newsView').addClass('hidden unvisible');}, 500);
        $selector('#indexView').removeAttribute('style');
    }

    function pagination(render){
        var page = localStorage['page'] || 1;
        page ++;
        $http.get('/api/news', {'page': page}).then(function(response){
            render(response);
            localStorage['page'] = page;
            if(response.total >= page) $selector('#pagination').style.display = 'none';
        });
    }

    function initializeNews(id){
        $selector('#indexView').removeClass('loading');
        $http.get('/api/news/'+ id).then(function(response){
            render(response);
            window.scrollTo(0, 0);
            $selector('#indexView').removeClass('loading').setTransLate(-getPageHeight());
            $selector('#newsView').removeClass('hidden').removeAttribute('style');
            setTimeout(function(){$selector('#newsView').removeClass('unvisible');}, 500);
            articleImg = response.result.image;
         });

        var render = function(response){
            var news = response.result;
            var html = '';
            html += '<div class="news-thumb" style="background-image: url('+ news.image +')">';
            html += '        <div class="image-copyright">图片 '+ news.image_source +'</div>';
            html += '</div>';
            html += '<div class="news-content">'+ news.body +'</div>';
            $selector('#newsDetail').innerHTML = html;
        };
    }

    function shareComponent(){
        var hideShareComponent = function(){
            $selector('#shareContainer').removeClass('show');
            setTimeout(function(){$selector('#shareComponent').addClass('hide');}, 300);
        };
        $selector('#shareBtn').addEventListeners('click touchstart', function(event){
            event.preventDefault();
            $selector('#shareComponent').removeClass('hide');
            setTimeout(function(){$selector('#shareContainer').addClass('show');}, 100);
        });
        $selector('#hideShare').addEventListeners('click touchstart', hideShareComponent);
        $selector('#shareMask').addEventListeners('click touchstart', hideShareComponent);

        var share = function(type){
            var url = '', title = document.title, uri = encodeURIComponent(location.href);
            switch(type){
                case 'twitter':
                    url = 'http://twitter.com/share?text='+ title +'&url=' + uri;
                    break;
                case 'facebook':
                    url = 'http://www.facebook.com/sharer.php?u=' + uri;
                    break;
                case 'google':
                    url = 'https://plus.google.com/share?url=' + uri;
                    break;
                case 'weibo':
                    url = 'http://service.weibo.com/share/share.php?url='+ uri +'&title='+ title +'&pic='+ articleImg;
                    break;
            };
            if(!url) return;
            window.open(url);
        };

        $selector('#shareBar').addEventListener('click', function(event){
            var target = event.target;
            if(target.tagName.toLowerCase() !== 'button') return;
            event.preventDefault();
            var type = target.dataset && target.dataset.type || '';
            share(type);
            hideShareComponent();
        })
    }

    function convertTimestampToLoaleDateString(result){

        var dateFormat = function(timestamp){
            try{
                var date = new Date(timestamp*1000);
            }catch(error){
                console.error('date formatter error', error.message);
                var date = new Date();
            }
            return date.toLocaleDateString();
        };

        if(Object.prototype.toString.call(result) === '[object Array]'){
            result.forEach(function(item, index){
                result[index].date = dateFormat(item.date);
            });
        }else if(typeof result === 'string' || typeof result === 'number'){
            var result = dateFormat(result);
        };

        return result;
    }

    function getPageHeight(){
        var indexHeight = $selector('#indexView').offsetHeight;
        var windowHeight = window.innerHeight;
        return indexHeight > windowHeight ? indexHeight : windowHeight;
    }

    function isMinWidth(){
        return window.innerWidth <= 600;
    }

    initialize();

})(this)