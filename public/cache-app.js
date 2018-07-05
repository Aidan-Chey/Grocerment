let cacheVersion = 105;
let cacheName = 'app';
let cacheLabel = cacheName + '::' + cacheVersion;
let cacheFiles = [
	'/'
	,'/favicon.ico'
	,'/index.html'
	,'/styles/general.css'
	,'/styles/item.css'
	,'/styles/list.css'
	,'/scripts/app.js'
	,'/scripts/scripts.js'
	,'/scripts/panes/item.js'
	,'/images/add.svg'
	,'/images/burger.svg'
	,'/images/cart.svg'
	,'/images/circle-arrow.svg'
	,'/images/square.svg'
	,'/images/tick.svg'
];

update_wating = () => {
	caches.keys().then( function(keysList) {
		let count = 0

		for (let i = keysList.length - 1; i >= 0; i--) {
			let separator = keysList[i].indexOf('::');
			let name = keysList[i].substring(0,separator);

			if(name == cacheName) count++;
		}

		if( count > 1 ) return sendMessage('update_waiting');
	});
}

sendMessage = (message) => {
	if (self.clients) clients.matchAll({includeUncontrolled:true}).then(function(clients) {
		for (let client of clients) {
			client.postMessage(message);
		}
	});
}

self.addEventListener( 'error', function(e) { console.error( ['[ServiceWorker-App] ERROR: Line ', e.lineno, ' in ', e.filename, ': ', e.message].join('') ); }, false );		//Should print any errors to console

self.addEventListener('install', function(event) {
	console.info('[ServiceWorker-App] Install');

	event.waitUntil(
		caches.open(cacheLabel).then(function(cache) {
			console.info('[ServiceWorker-App] Caching files');
			return cache.addAll(cacheFiles);
		})
	);
	skipWaiting();
});

self.addEventListener('activate', function(event) {
	update_wating();

	event.waitUntil(
		caches
			.keys()
			.then(function(keyList) {
				return Promise.all(
					keyList
						.filter(function (key) {
							let separator = key.indexOf('::');
							let name = key.substring(0,separator);
							let version = key.substring(separator + 2);

							return (name == cacheName && version != cacheVersion);
						})
						.map(function (key) {
							console.info('[ServiceWorker-App] Removing old cache', key);
							return caches.delete(key);
						})
				);
		})
	);
});

self.addEventListener('fetch', function(event) {
	if (event.request.method !== 'GET') return;

	event.respondWith(
		caches.match(event.request).then(function(response) {
			return response || fetch(event.request);
		})
	);
});
