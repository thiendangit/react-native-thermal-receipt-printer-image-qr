var processAlignText = function (text, restLength, align) {
    if (align === 0) {
        return text + " ".repeat(restLength);
    }
    else if (align === 1) {
        return " ".repeat(Math.ceil(restLength / 2)) + text + " ".repeat(Math.floor(restLength / 2));
    }
    else if (align === 2) {
        return " ".repeat(restLength) + text;
    }
    return '';
};
export var processColumnText = function (texts, columnWidth, columnAliment) {
    var new_texts = ['', '', ''];
    var result = '';
    texts.map(function (text, idx) {
        if (text.length >= columnWidth[idx]) {
            result += text.slice(0, columnWidth[idx]) + " ";
            new_texts[idx] = text.slice(columnWidth[idx], text.length);
        }
        else {
            result += processAlignText(text.trim(), columnWidth[idx] - text.length, columnAliment[idx]);
        }
    });
    var index_nonEmpty = new_texts.findIndex(function (new_text) { return new_text != ''; });
    if (index_nonEmpty !== -1) {
        result += "\n" + processColumnText(new_texts, columnWidth, columnAliment);
    }
    return result;
};
