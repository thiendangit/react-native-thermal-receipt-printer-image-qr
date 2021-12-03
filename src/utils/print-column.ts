import {ColumnAliment} from "..";

const processAlignText = (text: string, restLength: number, align: ColumnAliment): string => {
  if (align === 0) {
    return text + " ".repeat(restLength);
  } else if (align === 1) {
    return " ".repeat(Math.ceil(restLength / 2)) + text + " ".repeat(Math.floor(restLength / 2));
  } else if (align === 2) {
    return " ".repeat(restLength) + text;
  }
  return '';
};

export const processColumnText = (texts: string[], columnWidth: number[], columnAliment: (ColumnAliment)[]): string => {
  let new_texts: [string, string, string] = ['', '', ''];
  let result = ''
  texts.map((text, idx) => {
    if (text.length >= columnWidth[idx]) {
      result += text.slice(0, columnWidth[idx]) + " ";
      new_texts[idx] = text.slice(columnWidth[idx], text.length)
    } else {
      result += processAlignText(text.trim(), columnWidth[idx] - text.length, columnAliment[idx]);
    }
  });
  const index_nonEmpty = new_texts.findIndex((new_text) => new_text != '');
  if (index_nonEmpty !== -1) {
    result += "\n" + processColumnText(new_texts, columnWidth, columnAliment)
  }
  return result
};
