declare const Zotero: any;

const monkey_patch_marker = 'PdfkitMonkeyPatched';

// eslint-disable-next-line @typescript-eslint/no-unused-vars, no-inner-declarations, prefer-arrow/prefer-arrow-functions
function patch(object, method, patcher) {
    if (object[method][monkey_patch_marker]) return;
    object[method] = patcher(object[method]);
    object[method][monkey_patch_marker] = true;
}

class Pdfkit {
    // tslint:disable-line:variable-name
    private initialized = false;
    private globals: Record<string, any>;
    private strings: any;

    // eslint-disable-next-line @typescript-eslint/require-await
    public async load(globals: Record<string, any>) {
        this.globals = globals;

        if (this.initialized) return;
        this.initialized = true;

        this.strings = globals.document.getElementById('zotero-pdfkit-strings');
    }
}

if (!Zotero.Pdfkit) Zotero.Pdfkit = new Pdfkit();

Zotero.Pdfkit.setDefaultPdf = async () => {
    var zp = Zotero.getActiveZoteroPane();
    var items = zp.getSelectedItems();
    if (items.length === 1 || items[0].isAttachment()) {
        var item = items[0];
        var attachments = item.parentItem.getAttachments();
        var firstDate = new Date();
        for (const a of attachments) {
            const obj = Zotero.Items.get(a);
            const d: Date = new Date(obj.dateAdded);
            if (firstDate > d) {
                firstDate = d;
            }
        }
        var offset = firstDate.getTimezoneOffset() * 60 * 1000;
        firstDate.setSeconds(firstDate.getSeconds() - 1);
        await Zotero.DB.executeTransaction(async () => {
            item.setField(
                'dateAdded',
                new Date(firstDate.getTime() - offset)
                    .toISOString()
                    .slice(0, 19)
                    .replace('T', ' ')
            );
            await item.save({ skipDateModifiedUpdate: true });
        });
        return item.getField('title');
    } else {
        alert('Invalid attachment');
        return 'invalid item';
    }
};

Zotero.Pdfkit.copyURI = () => {
    var zp = Zotero.getActiveZoteroPane();
    var items = zp.getSelectedItems();
    var result = '';
    items.forEach((item, _) => {
        var uri = `zotero://select/library/items/${item.key}`;
        if (result === '') {
            result = uri;
        } else {
            result = `${result}\n${uri}`;
        }
    });
    Zotero.Utilities.Internal.copyTextToClipboard(result);
};
