export const COMMANDS = {
  LF: '\x0a',
  ESC: '\x1b',
  FS: '\x1c',
  GS: '\x1d',
  US: '\x1f',
  FF: '\x0c',
  DLE: '\x10',
  DC1: '\x11',
  DC4: '\x14',
  EOT: '\x04',
  NUL: '\x00',
  EOL: '\n',
  HORIZONTAL_LINE: {
    HR_58MM: '==================================',
    HR2_58MM: '**********************************',
    HR3_58MM: '----------------------------------',
    HR_80MM: '================================================',
    HR2_80MM: '************************************************',
    HR3_80MM: '------------------------------------------------'
  },
  FEED_CONTROL_SEQUENCES: {
    /**
     * Print and line feed
     */
    CTL_LF: '\x0a', // Print and line feed
    /**
     * Form feed
     */
    CTL_FF: '\x0c',
    /**
     * Carriage return
     */
    CTL_CR: '\x0d',
    /**
     * Horizontal tab
     */
    CTL_HT: '\x09',
    /**
     * Vertical tab
     */
    CTL_VT: '\x0b',
  },
  LINE_SPACING: {
    LS_DEFAULT: '\x1b\x32',
    LS_SET: '\x1b\x33',
    LS_SET1: '\x1b\x31',
  },
  HARDWARE: {
    /**
     * Clear data in buffer and reset modes
     */
    HW_INIT: '\x1b\x40',
    /**
     * Printer select
     */
    HW_SELECT: '\x1b\x3d\x01',
    /**
     * Reset printer hardware
     */
    HW_RESET: '\x1b\x3f\x0a\x00',
  },
  CASH_DRAWER: {
    /**
     * Sends a pulse to pin 2 []
     */
    CD_KICK_2: '\x1b\x70\x00',
    /**
     * ends a pulse to pin 5 []
     */
    CD_KICK_5: '\x1b\x70\x01',
  },
  MARGINS: {
    /**
     * Fix bottom size
     */
    BOTTOM: '\x1b\x4f',
    /**
     * Fix left size
     */
    LEFT: '\x1b\x6c',
    /**
     * Fix right size
     */
    RIGHT: '\x1b\x51',
  },
  PAPER: {
    /**
     * Full cut paper
     */
    PAPER_FULL_CUT: '\x1d\x56\x00',
    /**
     * Partial cut paper
     */
    PAPER_PART_CUT: '\x1d\x56\x01',
    /**
     * Partial cut paper
     */
    PAPER_CUT_A: '\x1d\x56\x41',
    /**
     * Partial cut paper
     */
    PAPER_CUT_B: '\x1d\x56\x42',
  },
  TEXT_FORMAT: {
    /**
     * Normal text
     */
    TXT_NORMAL: '\x1b\x21\x00',
    /**
     * Double height text
     */
    TXT_2HEIGHT: '\x1b\x21\x10',
    /**
     * Double width text
     */
    TXT_2WIDTH: '\x1b\x21\x20',
    /**
     * Double width & height text
     */
    TXT_4SQUARE: '\x1b\x21\x30',
    /**
     * other sizes
     */
    TXT_CUSTOM_SIZE: function (width: number, height: number) {
      let widthDec = (width - 1) * 16;
      let heightDec = height - 1;
      let sizeDec = widthDec + heightDec;
      return '\x1d\x21' + String.fromCharCode(sizeDec);
    },

    TXT_HEIGHT: {
      1: '\x00',
      2: '\x01',
      3: '\x02',
      4: '\x03',
      5: '\x04',
      6: '\x05',
      7: '\x06',
      8: '\x07'
    },
    TXT_WIDTH: {
      1: '\x00',
      2: '\x10',
      3: '\x20',
      4: '\x30',
      5: '\x40',
      6: '\x50',
      7: '\x60',
      8: '\x70'
    },
    /**
     * Underline font OFF
     */
    TXT_UNDERL_OFF: '\x1b\x2d\x00',
    /**
     * Underline font 1-dot ON
     */
    TXT_UNDERL_ON: '\x1b\x2d\x01',
    /**
     * Underline font 2-dot ON
     */
    TXT_UNDERL2_ON: '\x1b\x2d\x02',
    /**
     * Bold font OFF
     */
    TXT_BOLD_OFF: '\x1b\x45\x00',
    /**
     * Bold font ON
     */
    TXT_BOLD_ON: '\x1b\x45\x01',
    /**
     * Italic font ON
     */
    TXT_ITALIC_OFF: '\x1b\x35',
    /**
     * Italic font ON
     */
    TXT_ITALIC_ON: '\x1b\x34',
    /**
     * Font type A
     */
    TXT_FONT_A: '\x1b\x4d\x00',
    /**
     * Font type B
     */
    TXT_FONT_B: '\x1b\x4d\x01',
    /**
     * Font type C
     */
    TXT_FONT_C: '\x1b\x4d\x02',
    /**
     * Left justification
     */
    TXT_ALIGN_LT: '\x1b\x61\x00',
    /**
     * Centering
     */
    TXT_ALIGN_CT: '\x1b\x61\x01',
    /**
     *  Right justification
     */
    TXT_ALIGN_RT: '\x1b\x61\x02',
  }
}
