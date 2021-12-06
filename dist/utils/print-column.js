var processAlignText = function (text, restLength, align) {
    if (align === 0) {
        return text + " ".repeat(restLength);
    }
    else if (align === 1) {
        return " ".repeat(Math.floor(restLength / 2)) + text + " ".repeat(Math.ceil(restLength / 2));
    }
    else if (align === 2) {
        return " ".repeat(restLength) + text;
    }
    return '';
};
var processNewLine = function (text, maxLength) {
    var newText;
    var newTextTail;
    var next_char = text.slice(maxLength, maxLength + 1);
    if (next_char === ' ') {
        newText = text.slice(0, maxLength);
        newTextTail = text.slice(maxLength, text.length);
    }
    else {
        var newMaxLength = text.slice(0, maxLength).split('').map(function (e) { return e; }).lastIndexOf(' ');
        if (newMaxLength === -1) {
            newText = text.slice(0, maxLength);
            newTextTail = text.slice(maxLength, text.length);
        }
        else {
            newText = text.slice(0, newMaxLength);
            newTextTail = text.slice(newMaxLength, text.length);
        }
    }
    return {
        text: newText,
        text_tail: newTextTail.trim()
    };
};
export var processColumnText = function (texts, columnWidth, columnAliment, columnStyle) {
    var new_texts = ['', '', ''];
    var result = '';
    texts.map(function (text, idx) {
        if (text.length >= columnWidth[idx]) {
            var processedText = processNewLine(text, columnWidth[idx]);
            result += (columnStyle === null || columnStyle === void 0 ? void 0 : columnStyle[idx]) + processAlignText(processedText.text, columnWidth[idx] - processedText.text.length, columnAliment[idx]) + (idx !== 2 ? " " : "");
            new_texts[idx] = processedText.text_tail;
        }
        else {
            result += (columnStyle === null || columnStyle === void 0 ? void 0 : columnStyle[idx]) + processAlignText(text.trim(), columnWidth[idx] - text.length, columnAliment[idx]) + (idx !== 2 ? " " : "");
        }
    });
    var index_nonEmpty = new_texts.findIndex(function (new_text) { return new_text != ''; });
    if (index_nonEmpty !== -1) {
        result += "\n" + processColumnText(new_texts, columnWidth, columnAliment, columnStyle);
    }
    return result;
};
