(async function () {
	var myHeaders = new Headers();
	var requestOptions = {
		method: 'GET',
		headers: myHeaders,
		redirect: 'follow',
	};
	try {
		await fetch('http://localhost:5000/theme', requestOptions)
			.then((response) => response.json())
			.then((data) => {
				let theme = data.style;
				for (i = 0; i < theme.length; i++) {
					let key = theme[i].key;
					let val = theme[i].value;
					document.documentElement.style.setProperty(key, val);
				}
			})
			.catch((e) => console.error("Couldn't load theme"));
	} catch {
		console.error("Couldn't load theme");
	}
})();
