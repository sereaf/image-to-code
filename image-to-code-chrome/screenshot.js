(function () {
	chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
		setImage(request.screenshotData);
	});

	let x1, y1, x2, y2;
	let canvasBottom = document.getElementById('canvasBottom');
	let canvasTop = document.getElementById('canvasTop');
	let wrapper = document.getElementById('wrapper');
	let cropBtn = document.getElementById('crop');
	let copyToClipboardBtn = document.getElementById('copyToClipboard');
	let sendToVscodeBtn = document.getElementById('sendToVscode');
	let thresholdCheckbox = document.getElementById('doThreshold');
	let inverseCheckbox = document.getElementById('doInverse');
	let contextBottom = canvasBottom.getContext('2d');
	let contextTop = canvasTop.getContext('2d');
	let croppedImg;
	let code;

	cropBtn.addEventListener('click', async () => {
		getCropImg();
		if (inverseCheckbox.checked) croppedImg.data = inverse(croppedImg);
		if (thresholdCheckbox.checked) croppedImg.data = threshold(croppedImg);
		let x = x1 < x2 ? x1 : x2;
		let y = y1 < y2 ? y1 : y2;
		contextTop.putImageData(croppedImg, x, y);
		await Tesseract.recognize(canvasTop, 'eng').then(
			({ data: { text } }) => {
				console.log(text);
				code = text;
			}
		);
		copyToClipboardBtn.disabled = false;
		sendToVscodeBtn.disabled = false;
	});

	copyToClipboardBtn.addEventListener('click', () => {
		if (code != undefined) {
			copyStringToClipboard(code);
		}
	});

	sendToVscodeBtn.addEventListener('click', async () => {
		if (code != undefined) {
			var myHeaders = new Headers();
			myHeaders.append('Content-Type', 'application/json');
			myHeaders.append('Accept', 'application/json');

			var raw = JSON.stringify({
				code: code.toString(),
			});

			var requestOptions = {
				method: 'POST',
				headers: myHeaders,
				body: raw,
				redirect: 'follow',
			};
			let res = await fetch('http://localhost:5000/code', requestOptions);
			console.log(res);
		}
	});

	function setImage(screenshotData) {
		let image = new Image();
		image.src = screenshotData;
		image.onload = function () {
			canvasBottom.width = image.width;
			canvasTop.width = image.width;
			wrapper.style.width = image.width;
			canvasBottom.height = image.height;
			canvasTop.height = image.height;
			wrapper.style.height = image.height;
			contextBottom.drawImage(
				image,
				0,
				0,
				image.width,
				image.height,
				0,
				0,
				image.width,
				image.height
			);
		};
		initDraw();
	}

	function drawCropRect(newRect = false) {
		if (
			x1 != undefined &&
			y1 != undefined &&
			x2 != undefined &&
			y2 != undefined
		) {
			contextTop.clearRect(0, 0, canvasTop.width, canvasTop.height);
			contextTop.fillStyle = 'rgba(100, 100, 100, 0.5)';
			contextTop.fillRect(x1, y1, x2 - x1, y2 - y1);
		} else {
			return;
		}
	}

	function initDraw() {
		let isMouseDown = false;
		canvasTop.addEventListener('mousedown', (e) => {
			x1 = e.clientX;
			y1 = e.clientY;
			drawCropRect();
			isMouseDown = true;
		});
		canvasTop.addEventListener('mousemove', (e) => {
			if (isMouseDown) {
				x2 = e.clientX;
				y2 = e.clientY;
				drawCropRect();
			}
		});
		canvasTop.addEventListener('mouseup', (e) => {
			isMouseDown = false;
			x2 = e.clientX;
			y2 = e.clientY;
			drawCropRect((newRect = true));
		});
	}

	function getCropImg() {
		if (
			x1 != undefined &&
			y1 != undefined &&
			x2 != undefined &&
			y2 != undefined
		) {
			croppedImg = contextBottom.getImageData(x1, y1, x2 - x1, y2 - y1);
		}
	}

	function threshold(
		pixels,
		threshold = 100,
		light = [255, 255, 255],
		dark = [0, 0, 0]
	) {
		var d = pixels.data,
			i = 0,
			l = d.length;
		while (l-- > 0) {
			const v = d[i] * 0.2126 + d[i + 1] * 0.7152 + d[i + 2] * 0.0722;
			[d[i], d[i + 1], d[i + 2]] = v >= threshold ? light : dark;
			i += 4;
		}
		return d;
	}

	function inverse(pixels) {
		var d = pixels.data,
			i = 0,
			l = d.length;
		while (l-- > 0) {
			d[i] = 255 - d[i];
			d[i + 1] = 255 - d[i + 1];
			d[i + 2] = 255 - d[i + 2];
			i += 4;
		}
		return d;
	}

	function copyStringToClipboard(str) {
		navigator.clipboard.writeText(str);
	}
})();
