(function () {
	let btn = document.getElementById('btn');
	let lastKeyDown = '';

	btn.addEventListener('click', () => {
		screenShot();
	});

	document.addEventListener('keydown', (e) => {
		if (
			lastKeyDown.toLowerCase() === 'control' &&
			e.key.toLowerCase() === 'y'
		) {
			screenShot();
		}
		lastKeyDown = e.key;
	});

	function screenShot() {
		chrome.tabs.captureVisibleTab({ format: 'png' }, (screenshotData) => {
			let viewTabUrl = chrome.runtime.getURL(
				'screenshot.html?id=' + Math.round(Math.random() * 1000000000)
			);
			let targertId;
			chrome.tabs.create({ url: viewTabUrl }, (tab) => {
				targertId = tab.id;
				chrome.tabs.onUpdated.addListener(function listener(
					tabId,
					changeInfo,
					tab
				) {
					if (
						changeInfo.status === 'complete' &&
						tabId === targertId
					) {
						chrome.tabs.onUpdated.removeListener(listener);
						chrome.tabs.sendMessage(targertId, {
							screenshotData: screenshotData,
						});
					}
				});
			});
		});
	}
})();
