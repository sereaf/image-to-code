import * as vscode from 'vscode';
import * as http from 'http';

export function activate(context: vscode.ExtensionContext) {
	console.log(
		'Congratulations, your extension "image-to-code" is now active!'
	);
	let disposable = vscode.commands.registerCommand(
		'image-to-code.startUp',
		() => {
			const server = http.createServer((req, res) => {
				res.setHeader('Access-Control-Allow-Origin', '*');
				res.setHeader('Access-Control-Request-Method', '*');
				res.setHeader(
					'Access-Control-Allow-Methods',
					'OPTIONS, GET, POST'
				);
				res.setHeader('Access-Control-Allow-Headers', '*');
				if (req.url === '/theme' && req.method === 'GET') {
					const panel = vscode.window.createWebviewPanel(
						'image to code',
						'Image to Code',
						vscode.ViewColumn.One,
						{
							enableScripts: true,
							retainContextWhenHidden: true,
							enableCommandUris: true,
						}
					);
					panel.webview.html = getWebviewContent();
					panel.webview.onDidReceiveMessage((message) => {
						if (message.command === 'error') {
							vscode.window.showErrorMessage(
								"Image to Code: Couldn't load vscode theme."
							);
						}
						res.setHeader('Content-Type', 'application/json');
						res.end(JSON.stringify(message));
						panel.dispose();
					});
				} else if (req.url === '/code' && req.method === 'POST') {
					const { headers, method, url } = req;
					let body = '';
					req.on('error', (err) => {
						console.error('Error: ', err);
					});
					req.on('data', (chunk) => {
						body += chunk.toString();
					});
					req.on('end', () => {
						const { code, location } = JSON.parse(body);
						vscode.workspace.openTextDocument({
							content: code,
						});
					});
					res.setHeader('Content-Type', 'application/json');
					res.end();
				} else if (req.method === 'OPTIONS') {
					res.setHeader('Access-Control-Allow-Origin', '*');
					res.setHeader('Access-Control-Request-Method', '*');
					res.setHeader(
						'Access-Control-Allow-Methods',
						'OPTIONS, GET, POST'
					);
					res.setHeader('Access-Control-Allow-Headers', '*');
					res.end();
				}
			});

			const PORT = 5000;

			server.listen(PORT, () =>
				console.log(`Server is running on port: ${PORT}`)
			);
		}
	);

	context.subscriptions.push(disposable);

	vscode.commands.executeCommand('image-to-code.startUp');
}

export function deactivate() {}

function getWebviewContent() {
	return `
    <!DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>yo</title>
        </head>
        <body>
            <p>Loading theme...</p>
            <script>
                (function () {
                    const vscode = acquireVsCodeApi();
                    try {
                        let htmlStyleStr = document.getElementsByTagName("html")[0].getAttribute('style')
                        htmlStyleStr = '{' + htmlStyleStr + '}'					
                        let htmlStyle = htmlStyleStr.split('{')[1].split('}')[0].trim().split(';')
                        .filter(text => text !== "")
                        .map(text => text.split(':'))
                        .map(parts => ({key: parts[0].trim(), value: parts[1].trim()}))
                        vscode.postMessage({
                            command: 'success',
                            style:  htmlStyle
                        })
                    } catch(err) {
                        console.error(err);
                        vscode.postMessage({
                            command: 'error',
                            style:  {}
                        })
                    }
                }())
            </script>
        </body>
    </html>`;
}
