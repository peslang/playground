(function () {
  "use strict";

  var keywords = [
    "иначе если", "else if", "constructor", "конструктор", "enumeration", "перечисление",
    "exception", "исключение", "structure", "структура", "abstract", "абстрактный",
    "static", "статический", "continue", "продолжить", "умолчание", "default", "finally",
    "вконце", "import", "импорт", "export", "экспорт", "method", "метод", "return",
    "возврат", "throw", "выбросить", "break", "прервать", "while", "пока", "catch",
    "поймать", "else", "иначе", "when", "когда", "выбор", "case", "try", "попытка",
    "class", "класс", "contract", "контракт", "for", "для", "loop", "цикл", "step", "шаг",
    "down", "вниз", "scope", "область", "const", "конст", "void", "ничто", "unknown",
    "неизвестно", "any", "любой", "this", "этот", "base", "базовый", "new", "новый",
    "use", "исп", "var", "пер", "val", "знч", "oblig", "обз", "if", "если", "not", "не",
    "and", "и", "or", "или", "as", "как", "is", "это", "in", "из", "to", "по"
  ].sort(function (a, b) { return b.length - a.length; });

  var types = [
    "Число", "Number", "Булево", "Boolean", "Строка", "String", "Дата", "Date", "Время",
    "Time", "ДатаВремя", "DateTime", "Длительность", "Duration", "Момент", "Moment",
    "Объект", "Object", "Байты", "Bytes", "Исключение", "Exception", "ЧасовойПояс",
    "ЧасоваяЗона", "TimeZone", "Задача", "Task", "Тип", "Type", "Ууид", "Uuid",
    "Массив", "Array", "ЧитаемыйМассив", "Множество", "Set", "ЧитаемоеМножество",
    "Соответствие", "Map", "ЧитаемоеСоответствие", "КлючИЗначение", "KeyValue"
  ].sort(function (a, b) { return b.length - a.length; });

  var collectionTypes = [
    "ЧитаемоеСоответствие", "ЧитаемоеМножество", "КлючИЗначение", "ЧитаемыйМассив",
    "Соответствие", "Множество", "KeyValue", "Массив", "Array", "Set", "Map"
  ].sort(function (a, b) { return b.length - a.length; });

  var constants = ["Истина", "True", "Ложь", "False", "Неопределено", "Undefined"];

  var knownAnnotations = [
    "Переопределение", "Реализация", "ИменованныеПараметры", "Устарело", "Контекстный",
    "Обработчик", "Подписка", "ДоступноСКлиента", "НаКлиенте", "НаСервере"
  ].sort(function (a, b) { return b.length - a.length; });

  var wordBoundary = "(?<![A-Za-zА-Яа-яЁё0-9_])";
  var wordEnd = "(?![A-Za-zА-Яа-яЁё0-9_])";

  function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function wordPattern(words) {
    return wordBoundary + "(" + words.map(escapeRegex).join("|") + ")" + wordEnd;
  }

  function expressionRules() {
    return [
      [wordPattern(constants), "constant.language"],
      [wordPattern(types), "type"],
      [wordPattern(["ждать", "await"]), "keyword.await"],
      [wordPattern(keywords), "keyword"],
      [/(?<![A-Za-zА-Яа-яЁё0-9_.])(?:\d+(?:\.\d+)?(?:мс|мин|дн|с|ч)|0[xX][0-9a-fA-F]+|0[bB][01]+|\d+\.\d+|\d+)(?![A-Za-zА-Яа-яЁё0-9_])/, "number"],
      [/->|=>|\*\*|\?\?|\?\.|::|==|!=|<=|>=|\+=|-=|\*=|\/=|%=|[+\-*/%=<>?:]/, "operator"],
      [/[A-Za-zА-Яа-яЁё_][A-Za-zА-Яа-яЁё0-9_]*/, "variable"]
    ];
  }

  window.registerPesLanguage = function (monaco) {
    monaco.languages.register({ id: "pes", extensions: [".pes"], aliases: ["Pes", "Пес"] });

    monaco.languages.setLanguageConfiguration("pes", {
      comments: {
        lineComment: "//",
        blockComment: ["/*", "*/"]
      },
      brackets: [
        ["(", ")"],
        ["[", "]"],
        ["{", "}"]
      ],
      autoClosingPairs: [
        { open: "(", close: ")" },
        { open: "[", close: "]" },
        { open: "{", close: "}" },
        { open: "\"", close: "\"", notIn: ["string"] }
      ],
      surroundingPairs: [
        ["(", ")"],
        ["[", "]"],
        ["{", "}"],
        ["\"", "\""]
      ]
    });

    monaco.languages.setMonarchTokensProvider("pes", {
      defaultToken: "",
      ignoreCase: false,
      tokenizer: {
        root: [
          [/\/\/.*$/, "comment"],
          [/\/\*/, "comment", "@comment"],

          [/(?<![A-Za-zА-Яа-яЁё0-9_])(?:Момент|Moment|Дата|Date|Время|Time|ДатаВремя|DateTime|Байты|Bytes|Ууид|Uuid|Тип|Type|ЧасовойПояс|ЧасоваяЗона|TimeZone)\{[^{}]*\}/, "type.literal"],

          [/(?<![A-Za-zА-Яа-яЁё0-9_>])(<)([A-Za-zА-Яа-яЁё_][A-Za-zА-Яа-яЁё0-9_,\s]*)(>)(?=[\[{])/, ["delimiter.angle", "type", "delimiter.angle"]],
          [/(?<![A-Za-zА-Яа-яЁё0-9_])\{/, { token: "delimiter.brace", next: "@bracedLiteral" }],
          [/\[/, { token: "delimiter.bracket", next: "@arrayLiteral" }],

          [/"/, "string", "@string"],

          [/@(Локально|ВПодсистеме|ВПроекте|ВТипе|Глобально)/, ["annotation.decorator", "annotation.visibility"]],
          [new RegExp("@(" + knownAnnotations.map(escapeRegex).join("|") + ")" + wordEnd), ["annotation.decorator", "annotation"]],
          [/(@)([A-Za-zА-Яа-яЁё_][A-Za-zА-Яа-яЁё0-9_]*)/, ["annotation.decorator", "annotation"]],

          [wordPattern(["расширение", "extension"]), "modifier.extension"],
          [/(?<![A-Za-zА-Яа-яЁё0-9_])(?:асинх|async)/, "keyword"],
          [/(?<![A-Za-zА-Яа-яЁё0-9_])(?:этот|this)\s+([A-Za-zА-Яа-яЁё_][A-Za-zА-Яа-яЁё0-9_]*)\s*:/, ["keyword.this", "parameter"]],

          [new RegExp(wordBoundary + "(" + collectionTypes.map(escapeRegex).join("|") + ")" + wordEnd + "(<)"), ["type.collection", { token: "delimiter.angle", next: "@genericParams" }]],
          [new RegExp(wordBoundary + "(Задача|Task)" + wordEnd + "(<)"), ["type", { token: "delimiter.angle", next: "@genericParams" }]],

          [wordPattern(constants), "constant.language"],
          [wordPattern(types), "type"],
          [wordPattern(["ждать", "await"]), "keyword.await"],
          [wordPattern(keywords), "keyword"],

          [/(?<![A-Za-zА-Яа-яЁё0-9_.])(?:\d+(?:\.\d+)?(?:мс|мин|дн|с|ч)|0[xX][0-9a-fA-F]+|0[bB][01]+|\d+\.\d+|\d+)(?![A-Za-zА-Яа-яЁё0-9_])/, "number"],
          [/->|=>|\*\*|\?\?|\?\.|::|==|!=|<=|>=|\+=|-=|\*=|\/=|%=|[+\-*/%=<>?:]/, "operator"],
          [/[A-Za-zА-Яа-яЁё_][A-Za-zА-Яа-яЁё0-9_]*/, "identifier"]
        ],

        comment: [
          [/[^/*]+/, "comment"],
          [/\*\//, "comment", "@pop"],
          [/[/*]/, "comment"]
        ],

        genericParams: [
          [/>/, "delimiter.angle", "@pop"],
          [wordPattern(types), "type"],
          [/,/, "delimiter"],
          [/\s+/, ""]
        ],

        bracedLiteral: [
          [/:(?=\})/, "delimiter.map"],
          [/=>/, "delimiter.map"],
          [/"(?:[^"\\]|\\.)*"/, "string"],
          [wordPattern(constants), "constant.language"],
          [/(?<![A-Za-zА-Яа-яЁё0-9_.])(?:\d+(?:\.\d+)?(?:мс|мин|дн|с|ч)|0[xX][0-9a-fA-F]+|0[bB][01]+|\d+\.\d+|\d+)(?![A-Za-zА-Яа-яЁё0-9_])/, "number"],
          [/,/, "delimiter"],
          [/\}/, { token: "delimiter.brace", next: "@pop" }],
          [/\s+/, ""]
        ],

        arrayLiteral: [
          [/"(?:[^"\\]|\\.)*"/, "string"],
          [wordPattern(constants), "constant.language"],
          [/(?<![A-Za-zА-Яа-яЁё0-9_.])(?:\d+(?:\.\d+)?(?:мс|мин|дн|с|ч)|0[xX][0-9a-fA-F]+|0[bB][01]+|\d+\.\d+|\d+)(?![A-Za-zА-Яа-яЁё0-9_])/, "number"],
          [/,/, "delimiter"],
          [/\]/, { token: "delimiter.bracket", next: "@pop" }],
          [/\s+/, ""]
        ],

        string: [
          [/(?<![\\])\$\{/, { token: "interpolation.delimiter", next: "@interpolDollar" }],
          [/(?<![\\])(%)([A-Za-zА-Яа-яЁё_][A-Za-zА-Яа-яЁё0-9_]*)/, ["interpolation.delimiter", "variable"]],
          [/(?<![\\])(\$)([A-Za-zА-Яа-яЁё_][A-Za-zА-Яа-яЁё0-9_]*)/, ["interpolation.delimiter", "variable"]],
          [/(?<![\\])%\(/, { token: "interpolation.delimiter", next: "@interpolPercentParen" }],
          [/(?<![\\])%\{/, { token: "interpolation.delimiter", next: "@interpolPercent" }],
          [/\\./, "string.escape"],
          [/[^"\\$%]+/, "string"],
          [/"/, "string", "@pop"]
        ],

        interpolDollar: [
          [/\|/, { token: "interpolation.format", next: "@interpolFormat" }],
          [/\}/, { token: "interpolation.delimiter", next: "@pop" }]
        ].concat(expressionRules()),

        interpolFormat: [
          [/(?=\})/, "", "@pop"],
          [/[^}]+/, "interpolation.format"]
        ],

        interpolPercent: [
          [/\}/, { token: "interpolation.delimiter", next: "@pop" }]
        ].concat(expressionRules()),

        interpolPercentParen: [
          [/\)/, { token: "interpolation.delimiter", next: "@pop" }]
        ].concat(expressionRules())
      }
    });

    monaco.editor.defineTheme("pes-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6b7280", fontStyle: "italic" },
        { token: "string", foreground: "f5a97f" },
        { token: "string.escape", foreground: "d4a5ff" },
        { token: "number", foreground: "d4a5ff" },
        { token: "keyword", foreground: "7eb8ff" },
        { token: "keyword.await", foreground: "c792ea", fontStyle: "italic" },
        { token: "keyword.this", foreground: "7eb8ff" },
        { token: "type", foreground: "7ee8b8" },
        { token: "type.collection", foreground: "7ee8b8", fontStyle: "bold" },
        { token: "type.literal", foreground: "d4a5ff" },
        { token: "constant.language", foreground: "d4a5ff" },
        { token: "annotation.decorator", foreground: "e8d87a" },
        { token: "annotation.visibility", foreground: "ffcb6b", fontStyle: "bold" },
        { token: "annotation", foreground: "e8d87a" },
        { token: "modifier.extension", foreground: "82aaff", fontStyle: "italic" },
        { token: "parameter", foreground: "e6e8eb" },
        { token: "variable", foreground: "e6e8eb" },
        { token: "interpolation.delimiter", foreground: "7eb8ff" },
        { token: "interpolation.format", foreground: "d4a5ff" },
        { token: "delimiter", foreground: "9aa3b2" },
        { token: "delimiter.brace", foreground: "9aa3b2" },
        { token: "delimiter.bracket", foreground: "9aa3b2" },
        { token: "delimiter.angle", foreground: "9aa3b2" },
        { token: "delimiter.map", foreground: "7eb8ff" },
        { token: "operator", foreground: "9aa3b2" },
        { token: "identifier", foreground: "e6e8eb" }
      ],
      colors: {
        "editor.background": "#1a1d23",
        "editor.foreground": "#e6e8eb",
        "editorLineNumber.foreground": "#4b5563",
        "editorLineNumber.activeForeground": "#9aa3b2",
        "editor.selectionBackground": "#2a3344",
        "editor.inactiveSelectionBackground": "#222833",
        "editorCursor.foreground": "#f0b429",
        "editor.lineHighlightBackground": "#1f232b"
      }
    });
  };
})();
