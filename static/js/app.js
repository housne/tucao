
(function(window){

    var articleImg = ''; //aritcle image for share

    /*
        ajax function using promise
        use it like $http.get.then(fn(url, arguments))
    */
    var $http =  {

        get: function(url, args){
            return this.request('GET', url, args);
        },

        post: function(url, args){
            return this.request('POST', url, args);
        },

        request: function(method, url, args){
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
        }
    };

    //simple dom selector
    var $selector = function(selector){
        if(/^\#.+/.test(selector)) return document.getElementById(selector.replace('#', ''));
        if(/^\..+/.test(selector)) return document.getElementsByClassName(selector.replace('.', ''));
    }

    /*
        evil code, extend element protype
        I don't want use jquery or zepto or any lib but I want to use the jquery code style
        so I use this in my private project
        do not use this in your public project
    */
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
    };

    Element.prototype.setTransLate = function(transform){
        var direct = 'Y';
        var clientWidth = window.innerWidth;
        if(clientWidth <= 600){
            var transform = transform < 0 ? -clientWidth : clientWidth;
            direct = 'X'
        }
        this.setAttribute('style', 'transform:translate' + direct + '('+ transform +'px); -webkit-transform: translate' + direct + '('+ transform +'px);');
        return this;
    };

    Element.prototype.addEventListeners = function(events, fn){
        var events = events.split(' ');
        var self = this;
        events.forEach(function(event){
            self.addEventListener(event, fn);
        })
    };

    var proxy = function(fn, context){
        args = [].slice.call( arguments, 2 );
        var proxy = function(){
            fn.apply(context || this, args.concat([].slice.call(arguments)));
        };
        return proxy;
    };

    // share component
    var shareComponent = {

        container: $selector('#shareContainer'),

        el: $selector('#shareComponent'),

        btn: $selector('#shareBtn'),

        closer: $selector('#hideShare'),

        mask: $selector('#shareMask'),

        item: $selector('#shareBar'),

        hide: function(){
            var self = this;
            this.container.removeClass('show');
            setTimeout(function(){self.el.addClass('hide');}, 300);
        },

        show: function(){
            var self = this;
            this.el.removeClass('hide');
            setTimeout(function(){self.container.addClass('show');}, 100);
        },

        share: function(type){
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
        },

        init: function(){
            var self = this;
            this.btn.addEventListeners('click touchstart', proxy(this.show, this));
            this.closer.addEventListeners('click touchstart', proxy(this.hide, this));
            this.mask.addEventListeners('click touchstart', proxy(this.hide, this));
            this.item.addEventListener('click', function(event){
                var target = event.target;
                if(target.tagName.toLowerCase() !== 'button') return;
                event.preventDefault();
                var type = target.dataset && target.dataset.type || '';
                self.share(type);
                self.hide();
            });
        }
    };

    var route = {

        routes: [
            {
                url: /\/$/,
                controller: initializeIndex
            },
            {
                url: '/news/:id',
                controller: initializeNews
            }
        ],

        resolve: function(){
            if(window.ga) window.ga('send', 'pageview', window.location.pathname);
        },

        init: function(){
            var self = this;
            var controller = function(index, params){
                var route = self.routes[index];
                route.controller(params);
                if(route.resolve && typeof route.resolve === 'function') route.resolve();
                self.resolve();
            };
            var path = window.location.pathname;
            for(var i=0, l=this.routes.length; i<l; i++){
                var url = this.routes[i].url;
                var params = {};
                if(typeof url === 'string'){
                    if(path === url){
                        controller(i, params);
                        return;
                    };
                    if(typeof url === 'string' && url.indexOf(':') !== -1 && path.indexOf(url.replace(/(.+)\:.+$/, '$1')) !== -1){
                        var urlKeys = url.split('/'), pathKeys = path.split('/');
                        urlKeys.forEach(function(key, index){
                            if(key.indexOf(':') !== -1) params[key.replace(':', '')] = pathKeys[index];
                        });
                        controller(i, params);
                        return;
                    };
                };
                if(Object.prototype.toString.call(url) === '[object RegExp]' && url.test(path)){
                    controller(i, params);
                    return;
                };
            };
        }
    };

    var pushState = {

        binding: function(){
           document.getElementsByTagName('body')[0].delegate('click', 'a', function(event, target){
                var href = target.getAttribute('href') || '';
                if(!/^\/.*$/.test(href)) return;
                event.preventDefault();
                history.pushState({}, document.title, href);
                route.init();
            }); 
        },

        init: function(){
            this.binding();
            window.addEventListener('popstate', proxy(route.init, route));
        }
    };

    function initialize(){
        route.init();
        pushState.init();
        initializeRefresh();
        shareComponent.init();
    };

    
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

    function initializeNews(params){
        var id = params.id;
        $selector('#indexView').removeClass('loading');
        $http.get('/api/news/'+ id).then(function(response){
            render(response);
            window.scrollTo(0, 0);
            $selector('#indexView').removeClass('loading').setTransLate(-getPageHeight());
            $selector('#newsView').removeClass('hidden').removeAttribute('style');
            setTimeout(function(){$selector('#newsView').removeClass('unvisible');}, 600);
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