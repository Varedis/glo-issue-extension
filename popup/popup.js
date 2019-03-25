(async () => {
	const b64toBlob = (b64Data, contentType = '') => {
		const sliceSize = 512;

		const byteCharacters = atob(b64Data);
		const byteArrays = [];

		for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
			const slice = byteCharacters.slice(offset, offset + sliceSize);

			const byteNumbers = new Array(slice.length);
			for (let i = 0; i < slice.length; i++) {
				byteNumbers[i] = slice.charCodeAt(i);
			}

			byteArrays.push(new Uint8Array(byteNumbers));
		}

		return new Blob(byteArrays, { type: contentType });
	}

	const constructUrl = async (uri, opts) => {
		const { token } = await browser.storage.local.get();

		let url = `https://gloapi.gitkraken.com/v1/glo/${uri}?token=${token}`

		if (opts.query) {
			url += opts.query;
		}

		return url;
	}

	const makeGloRequest = async (method, uri, opts) => {
		const options = {
			method,
			mode: 'cors',
			cache: 'no-cache',
			headers: {
				'Content-Type': 'application/json'
			},
		};

		if (opts.body) {
			options.body = JSON.stringify(opts.body);
		}

		const response = await fetch(await constructUrl(uri, opts), options);

		return response.json();
	}

	const makeGloUpload = async (method, uri, opts) => {
		// get the actual base64 content of the file
		const imageData = opts.file.split(";")[1].split(",")[1];

		// Create a FormData and append the file with "image" as parameter name
		const formData = new FormData();
		formData.append("file", b64toBlob(imageData, 'image/png'));

		const response = await fetch(await constructUrl(uri, opts), {
			method,
			mode: 'cors',
			cache: 'no-cache',
			body: formData,
		});

		return response.json();
	}

	const getCurrentUrl = async () => {
		const currentTab = await browser.tabs.query({ active: true, currentWindow: true });
		if (currentTab[0]) {
			return currentTab[0].url;
		}

		// TODO: Handle error
	}

	const updateColumns = (boards, boardValue) => {
		// Find the board
		const board = boards.reduce((res, b) => {
			if (b.id === boardValue) res = b;
			return res;
		});

		// Remove previous values
		const columnSelect = document.getElementById('column');
		for (let i = columnSelect.options.length - 1; i >= 0; i--) {
			columnSelect.remove(i)
		}

		// Update columns
		for (let column of board.columns) {
			const opt = document.createElement('option');
			opt.value = column.id;
			opt.text = column.name;
			columnSelect.appendChild(opt);
		}
	}

	let image;

	const createIssue = document.getElementById('createIssue');
	createIssue.onclick = async element => {
		const form = document.getElementById('form');

		// Populate possible boards
		const boardSelect = document.getElementById('board');
		const boards = await makeGloRequest('GET', 'boards', {
			query: '&fields=columns&fields=name',
		});
		for (let board of boards) {
			const opt = document.createElement('option');
			opt.value = board.id;
			opt.text = board.name;
			boardSelect.appendChild(opt);
		}

		// Populate possible columns based on the board
		boardSelect.onchange = async () => {
			updateColumns(boards, boardSelect.value);
		}
		updateColumns(boards, boardSelect.value);

		// Create issue description
		const url = await getCurrentUrl()

		const description = document.getElementById('description');
		description.value = `URL: [${url}](${url})\n\n\n\nIssue logged by: **Glo capture for Firefox**.`

		// Generate image
		image = await browser.tabs.captureVisibleTab()

		// Display image
		const img = document.createElement('img');
		img.id = 'image-to-upload';
		img.setAttribute("src", image);
		document.getElementById('image').appendChild(img);

		// Hide create button
		createIssue.setAttribute('class', 'hide');
		// Show form
		form.setAttribute('class', 'show')
	};

	const submitIssue = document.getElementById('form');
	form.onsubmit = async (event, data) => {
		event.preventDefault();

		const form = document.form;

		// Submit a card to Glo
		const card = await makeGloRequest('POST', `boards/${form.board.value}/cards`, {
			body: {
				column_id: form.column.value,
				name: form.title.value,
				description: {
					text: form.description.value,
				},
			}
		});

		// TODO: Handle errors

		// Upload an image attachment
		const attachment = await makeGloUpload('POST', `boards/${form.board.value}/cards/${card.id}/attachments`, {
			file: image,
		});

		if (attachment.id) {
			// Submit a comment with the attachment
			const comment = await makeGloRequest('POST', `boards/${form.board.value}/cards/${card.id}/comments`, {
				body: {
					text: `[Screenshot](${attachment.url})`,
				},
			});

			if (comment.id) {
				showSuccess();
			}
		}
	};

	const showSuccess = () => {
		const message = document.getElementById('message');
		message.innerHTML = `
		<div>Success!</div>
		<p>Your card has been added to your Glo board</p>
	`;
		message.setAttribute('class', 'show');
		document.getElementById('form').setAttribute('class', 'hide');
	}

	const tokenForm = document.getElementById('tokenForm');
	tokenForm.onsubmit = async (event, data) => {
		event.preventDefault();

		const tokenForm = document.tokenForm;

		if (tokenForm.token.value) {
			browser.storage.local.set({
				token: tokenForm.token.value,
			});

			const token = document.getElementById('patToken')
			token.setAttribute('class', 'hide');
			
			const createIssue = document.getElementById('createIssue');
			createIssue.setAttribute('class', 'show');
		}
	};

	const storage = await browser.storage.local.get();
	if (!storage.token) {
		const token = document.getElementById('patToken')
		token.setAttribute('class', 'show');
	} else {
		const createIssue = document.getElementById('createIssue');
		createIssue.setAttribute('class', 'show');
	}
})();
