import { URL, URLSearchParams } from 'url';
import * as vscode from 'vscode';

const OPENGROK_CONF_HOST = "opengrok.host";
const OPENGROK_CONF_PROJECT = "opengrok.project";

export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand('opengrok.openat', async () => {
		const editor = vscode.window.activeTextEditor;
		const conf = vscode.workspace.getConfiguration('');
		var host: string | undefined = conf.get(OPENGROK_CONF_HOST);
		var proj = conf.get(OPENGROK_CONF_PROJECT);

		if (!editor) {
			vscode.window.showWarningMessage('No Active Text Editor');
			return;
		}
		if (vscode.workspace.name == undefined) {
			vscode.window.showErrorMessage('Need to be in a workspace');
			return;
		}

		if (!(host && proj)) {
			vscode.window.showErrorMessage("Need to set host");

			host = await vscode.window.showInputBox({
				value: conf.get('opengrok.host'),
				placeHolder: 'OpenGrok Host (e.g. https://example.com:1234)',
				validateInput: text => {
					if (text == "" || !text.startsWith('http')) {
						return 'Should start with http|https';
					}
					return null;
				}
			});
			proj = await vscode.window.showInputBox({
				value: conf.get('opengrok.project'),
				placeHolder: 'Project name',
				validateInput: text => {
					if (text == "") {
						return 'Need a project name';
					}
					return null;
				}
			});

			conf.update('opengrok.host', host,  vscode.ConfigurationTarget.WorkspaceFolder);
			conf.update('opengrok.project', proj,  vscode.ConfigurationTarget.WorkspaceFolder);
		}

		const position = editor.selection.active;
		const relFilePath = vscode.workspace.asRelativePath(editor.document.fileName);

		if (host && proj) {
			var targetUrl = new URL(host);
			targetUrl.pathname = `source/xref/${proj}/${relFilePath}`;
			targetUrl.hash = (position.line + 1).toString();

			console.log(`URL: ${targetUrl.href}`);
			vscode.env.openExternal(vscode.Uri.parse(targetUrl.href));
		}
	});

	let fullsearch = vscode.commands.registerCommand('opengrok.fullsearch', async () => {
		const editor = vscode.window.activeTextEditor;
		const conf = vscode.workspace.getConfiguration('');
		var host: string | undefined = conf.get(OPENGROK_CONF_HOST);
		var proj = conf.get(OPENGROK_CONF_PROJECT);
		var search_txt: string|undefined;

		if (!(host && proj)) {
			vscode.window.showErrorMessage('Need to set OpenGrok server and project');
			return;
		}

		search_txt = await vscode.window.showInputBox({
			placeHolder: 'Text to search',
			validateInput: text => {
				if (text == "") {
					return 'Cannot be empty';
				}
				return null;
			}
		});

		if (host && proj && search_txt) {
			var targetUrl = new URL(host);
			targetUrl.pathname = `source/search`;
			targetUrl.search = `project=${proj}&full=${search_txt}`

			console.log(`URL: ${targetUrl.href}`);
			vscode.env.openExternal(vscode.Uri.parse(targetUrl.href));
		}
	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(fullsearch);
}

// this method is called when your extension is deactivated
export function deactivate() {}
