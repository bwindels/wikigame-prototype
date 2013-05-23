function createEventBus() {
	return {
		listeners: {},
		on: function(type, callback) {
			if(!this.listeners[type]) {
				this.listeners[type] = [];
			}
			this.listeners[type].push(callback);
		},
		emit: function(type) {
			var l = this.listeners[type],
				a = Array.prototype.slice.call(arguments, 1);
			if(l) {
				l.forEach(function(c) {
					c.apply(null, a);
				});
			}
		}
	};
}

function linkToSubject(link) {
	return link.substr(link.lastIndexOf('/') + 1);
}

function setupFrame(wikiFrame, bus) {
	wikiFrame.onload = function() {
		var w = wikiFrame.contentWindow,
			d = wikiFrame.contentDocument;
		//inject our stylesheet
		var l = d.createElement('link');
		l.rel = 'stylesheet';
		l.href = '/wikipedia.css';
		d.head.appendChild(l);
		//find all links on page
		var links = Array.prototype.slice.call(d.querySelectorAll('a'));
		//filter /wiki/ links
		var wikiLinks = links.filter(function(a) {
			var fromIndex = 0;
			if(a.href.indexOf('http://') === 0) {
				fromIndex = 8;
			}
			return a.href.indexOf('/wiki/', fromIndex) !== -1;
		});
		//disable default action for all links
		links.forEach(function(a) {
			a.addEventListener('click', function(e) {
				e.preventDefault();
				return false;
			}, false);
		});
		//emit event for wiki links
		wikiLinks.forEach(function(a) {
			a.addEventListener('click', function(e) {
				bus.emit('subjectClicked', linkToSubject(e.target.href));
			}, false);
		});
		var subjects = wikiLinks.map(function(a) {
			return linkToSubject(a.href);
		});
		bus.emit('allSubjectsOnPage', subjects);
	};
	bus.on('loadSubject', function(subject) {
		wikiFrame.src = '/wiki/' + subject;
	});
}

function setupStats(stats, bus) {
	var clickSpan = stats.querySelector('.clicks');
	var targetOnPageSpan = stats.querySelector('.targetOnPage');
	var target = 'Cyprus';
	var isTargetOnPage = false;
	var clicks = 0;

	function update() {
		clickSpan.innerHTML = clicks + ' clicks';
		if(isTargetOnPage) {
			targetOnPageSpan.innerHTML = 'target ' + target + ' is present on this page';
		} else {
			targetOnPageSpan.innerHTML = '';
		}
	}
	update();

	bus.on('loadSubject', function(subject, initLoad) {
		if(!initLoad) {
			++clicks;
			update();
		}
	});
	bus.on('allSubjectsOnPage', function(subjects) {
		isTargetOnPage = subjects.indexOf(target) !== -1;
		update();
	});

}

function init() {
	var stats = document.getElementById('stats'),
		wikiFrame = document.getElementById('wikipedia'),
		bus = createEventBus();
	setupFrame(wikiFrame, bus);
	setupStats(stats, bus);
	bus.on('subjectClicked', function(subject) {
		bus.emit('loadSubject', subject);
	});
	bus.emit('loadSubject', 'Alloy', true);
}

init();