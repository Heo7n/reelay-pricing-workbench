/* Generated from independent Seedance 2.5 evidence by models-source.cjs. */
(function(root){
'use strict';
const snapshot = {
  "version": "volc-seedance25-2026-10-20",
  "model": "seedance-2.5",
  "verifiedAt": "2026-10-20",
  "sourceFormula": "IF(VALUE([时长-输入视频（秒）])>0,(MAX(ROUNDUP(VALUE([时长-输出视频（秒）])*2/3,0),VALUE([时长-输入视频（秒）]))+VALUE([时长-输出视频（秒）]))*VALUE([长边（像素）])*VALUE([短边（像素）])*VALUE([帧率])/1024,VALUE([时长-输出视频（秒）])*VALUE([长边（像素）])*VALUE([短边（像素）])*VALUE([帧率])/1024)",
  "sourceFormulaSha256": "f8d5a553af3196c22d8727d891644f99b13c28c67d662b1e922b90dcddfbefb9",
  "sourceDescription": "估算值，实际以调用 API 后返回信息中的 usage 字段为准",
  "sourceUrl": "https://bytedance.larkoffice.com/share/base/form/shrcnhVCMxKxcwW1QML5r9u8nvh",
  "sourceTable": "tblheIYDXXwYM43b",
  "sourceField": "fld0p1bMiB",
  "views": {
    "480p": "vew2CR2JYM",
    "720p": "vewVBehIlq",
    "1080p": "vewdDcyFjS"
  },
  "derivation": "Execute the independently captured Seedance 2.5 table formula over its official input-duration options; preserve exact minima and verify every displayed source row.",
  "duplicatePolicy": "The 480p source repeats 21:9 durations 16–30. Each repeated row is independently validated and must agree exactly; identical values are represented once, with both source row numbers retained. This does not assert how the remote form coerces a duplicated lookup list.",
  "inputSeconds": [
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "11",
    "12",
    "13",
    "14",
    "15",
    "16",
    "17",
    "18",
    "19",
    "20",
    "21",
    "22",
    "23",
    "24",
    "25",
    "26",
    "27",
    "28",
    "29",
    "30"
  ],
  "outputSeconds": [
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "11",
    "12",
    "13",
    "14",
    "15",
    "16",
    "17",
    "18",
    "19",
    "20",
    "21",
    "22",
    "23",
    "24",
    "25",
    "26",
    "27",
    "28",
    "29",
    "30"
  ],
  "fps": "24",
  "dimensions": {
    "480p": {
      "16:9": [
        854,
        480
      ],
      "4:3": [
        752,
        560
      ],
      "1:1": [
        640,
        640
      ],
      "3:4": [
        560,
        752
      ],
      "9:16": [
        480,
        854
      ],
      "21:9": [
        992,
        432
      ]
    },
    "720p": {
      "16:9": [
        1280,
        720
      ],
      "4:3": [
        1112,
        834
      ],
      "1:1": [
        960,
        960
      ],
      "3:4": [
        834,
        1112
      ],
      "9:16": [
        720,
        1280
      ],
      "21:9": [
        1470,
        630
      ]
    },
    "1080p": {
      "16:9": [
        1920,
        1080
      ],
      "4:3": [
        1664,
        1248
      ],
      "1:1": [
        1440,
        1440
      ],
      "3:4": [
        1248,
        1664
      ],
      "9:16": [
        1080,
        1920
      ],
      "21:9": [
        2206,
        946
      ]
    }
  },
  "sourceRows": 339,
  "uniqueSourceRows": 324,
  "specificationCount": 486,
  "formulaEvaluationCount": 9831,
  "rowsByResolution": {
    "480p": 123,
    "720p": 108,
    "1080p": 108
  },
  "uniqueRowsByResolution": {
    "480p": 108,
    "720p": 108,
    "1080p": 108
  },
  "duplicateRows": [
    {
      "resolution": "480p",
      "ratio": "21:9",
      "seconds": "16",
      "firstRow": 94,
      "repeatedRow": 109,
      "displayedTokens": "271188",
      "tokens": "271188",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json"
    },
    {
      "resolution": "480p",
      "ratio": "21:9",
      "seconds": "17",
      "firstRow": 95,
      "repeatedRow": 110,
      "displayedTokens": "291276",
      "tokens": "291276",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json"
    },
    {
      "resolution": "480p",
      "ratio": "21:9",
      "seconds": "18",
      "firstRow": 96,
      "repeatedRow": 111,
      "displayedTokens": "301320",
      "tokens": "301320",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json"
    },
    {
      "resolution": "480p",
      "ratio": "21:9",
      "seconds": "19",
      "firstRow": 97,
      "repeatedRow": 112,
      "displayedTokens": "321408",
      "tokens": "321408",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json"
    },
    {
      "resolution": "480p",
      "ratio": "21:9",
      "seconds": "20",
      "firstRow": 98,
      "repeatedRow": 113,
      "displayedTokens": "341496",
      "tokens": "341496",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json"
    },
    {
      "resolution": "480p",
      "ratio": "21:9",
      "seconds": "21",
      "firstRow": 99,
      "repeatedRow": 114,
      "displayedTokens": "351540",
      "tokens": "351540",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json"
    },
    {
      "resolution": "480p",
      "ratio": "21:9",
      "seconds": "22",
      "firstRow": 100,
      "repeatedRow": 115,
      "displayedTokens": "371628",
      "tokens": "371628",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json"
    },
    {
      "resolution": "480p",
      "ratio": "21:9",
      "seconds": "23",
      "firstRow": 101,
      "repeatedRow": 116,
      "displayedTokens": "391716",
      "tokens": "391716",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json"
    },
    {
      "resolution": "480p",
      "ratio": "21:9",
      "seconds": "24",
      "firstRow": 102,
      "repeatedRow": 117,
      "displayedTokens": "401760",
      "tokens": "401760",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json"
    },
    {
      "resolution": "480p",
      "ratio": "21:9",
      "seconds": "25",
      "firstRow": 103,
      "repeatedRow": 118,
      "displayedTokens": "421848",
      "tokens": "421848",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json"
    },
    {
      "resolution": "480p",
      "ratio": "21:9",
      "seconds": "26",
      "firstRow": 104,
      "repeatedRow": 119,
      "displayedTokens": "441936",
      "tokens": "441936",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json"
    },
    {
      "resolution": "480p",
      "ratio": "21:9",
      "seconds": "27",
      "firstRow": 105,
      "repeatedRow": 120,
      "displayedTokens": "451980",
      "tokens": "451980",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json"
    },
    {
      "resolution": "480p",
      "ratio": "21:9",
      "seconds": "28",
      "firstRow": 106,
      "repeatedRow": 121,
      "displayedTokens": "472068",
      "tokens": "472068",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json"
    },
    {
      "resolution": "480p",
      "ratio": "21:9",
      "seconds": "29",
      "firstRow": 107,
      "repeatedRow": 122,
      "displayedTokens": "492156",
      "tokens": "492156",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json"
    },
    {
      "resolution": "480p",
      "ratio": "21:9",
      "seconds": "30",
      "firstRow": 108,
      "repeatedRow": 123,
      "displayedTokens": "502200",
      "tokens": "502200",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json"
    }
  ],
  "sourceFiles": {
    "evidence/2026-10-20/models/minimum-480p.clipboard.json": "581d11fc9887ddb0e75098e1d07452ed880b5f984c5896c65a904e3f36060069",
    "evidence/2026-10-20/models/minimum-720p.clipboard.json": "2d09bc00d0ed1c288ddfd2a73857b403fcd5ccaedfc02361d6ea51b906dc34ab",
    "evidence/2026-10-20/models/minimum-1080p.clipboard.json": "02aa927ebf4b2b2641b86fb83d6bad2a8e2023a2be878cf3d6cc01ba4c849a29",
    "evidence/2026-10-20/models/seedance-2.5-calculator-public.html": "944cf465b833f63aee5b5833258d26005fff269b89f3c6d61d896ce892d83168",
    "evidence/2026-10-20/models/seedance-2.5-calculator-fields.json": "45b8cda2e9b6c39ede25d81c762971196ec59ce2241394ecdb7c205ef57e1ac5",
    "evidence/2026-10-20/models/create-video-generation-task-api.md": "b397daf9a72c5c93de6dcf66610dea543c4bbdd3a500a00a234135898abaee24",
    "evidence/2026-10-20/models/documents-manifest.json": "bc898399ffb609d32af6645c9423c4d36cd5eeb52697b26cc7f2c00a7757e2f9"
  },
  "entries": {
    "480p|16:9|4": {
      "tokens": "67252.5",
      "displayedTokens": "67253",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 1,
      "sourceRows": [
        1
      ],
      "minimizingInputSeconds": [
        "2",
        "3"
      ]
    },
    "480p|9:16|4": {
      "tokens": "67252.5",
      "displayedTokens": "67253",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 1,
      "sourceRows": [
        1
      ],
      "minimizingInputSeconds": [
        "2",
        "3"
      ]
    },
    "480p|16:9|5": {
      "tokens": "86467.5",
      "displayedTokens": "86468",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 2,
      "sourceRows": [
        2
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4"
      ]
    },
    "480p|9:16|5": {
      "tokens": "86467.5",
      "displayedTokens": "86468",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 2,
      "sourceRows": [
        2
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4"
      ]
    },
    "480p|16:9|6": {
      "tokens": "96075",
      "displayedTokens": "96075",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 3,
      "sourceRows": [
        3
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4"
      ]
    },
    "480p|9:16|6": {
      "tokens": "96075",
      "displayedTokens": "96075",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 3,
      "sourceRows": [
        3
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4"
      ]
    },
    "480p|16:9|7": {
      "tokens": "115290",
      "displayedTokens": "115290",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 4,
      "sourceRows": [
        4
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5"
      ]
    },
    "480p|9:16|7": {
      "tokens": "115290",
      "displayedTokens": "115290",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 4,
      "sourceRows": [
        4
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5"
      ]
    },
    "480p|16:9|8": {
      "tokens": "134505",
      "displayedTokens": "134505",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 5,
      "sourceRows": [
        5
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6"
      ]
    },
    "480p|9:16|8": {
      "tokens": "134505",
      "displayedTokens": "134505",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 5,
      "sourceRows": [
        5
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6"
      ]
    },
    "480p|16:9|9": {
      "tokens": "144112.5",
      "displayedTokens": "144113",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 6,
      "sourceRows": [
        6
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6"
      ]
    },
    "480p|9:16|9": {
      "tokens": "144112.5",
      "displayedTokens": "144113",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 6,
      "sourceRows": [
        6
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6"
      ]
    },
    "480p|16:9|10": {
      "tokens": "163327.5",
      "displayedTokens": "163328",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 7,
      "sourceRows": [
        7
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7"
      ]
    },
    "480p|9:16|10": {
      "tokens": "163327.5",
      "displayedTokens": "163328",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 7,
      "sourceRows": [
        7
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7"
      ]
    },
    "480p|16:9|11": {
      "tokens": "182542.5",
      "displayedTokens": "182543",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 8,
      "sourceRows": [
        8
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8"
      ]
    },
    "480p|9:16|11": {
      "tokens": "182542.5",
      "displayedTokens": "182543",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 8,
      "sourceRows": [
        8
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8"
      ]
    },
    "480p|16:9|12": {
      "tokens": "192150",
      "displayedTokens": "192150",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 9,
      "sourceRows": [
        9
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8"
      ]
    },
    "480p|9:16|12": {
      "tokens": "192150",
      "displayedTokens": "192150",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 9,
      "sourceRows": [
        9
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8"
      ]
    },
    "480p|16:9|13": {
      "tokens": "211365",
      "displayedTokens": "211365",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 10,
      "sourceRows": [
        10
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9"
      ]
    },
    "480p|9:16|13": {
      "tokens": "211365",
      "displayedTokens": "211365",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 10,
      "sourceRows": [
        10
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9"
      ]
    },
    "480p|16:9|14": {
      "tokens": "230580",
      "displayedTokens": "230580",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 11,
      "sourceRows": [
        11
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10"
      ]
    },
    "480p|9:16|14": {
      "tokens": "230580",
      "displayedTokens": "230580",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 11,
      "sourceRows": [
        11
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10"
      ]
    },
    "480p|16:9|15": {
      "tokens": "240187.5",
      "displayedTokens": "240188",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 12,
      "sourceRows": [
        12
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10"
      ]
    },
    "480p|9:16|15": {
      "tokens": "240187.5",
      "displayedTokens": "240188",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 12,
      "sourceRows": [
        12
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10"
      ]
    },
    "480p|16:9|16": {
      "tokens": "259402.5",
      "displayedTokens": "259403",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 13,
      "sourceRows": [
        13
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11"
      ]
    },
    "480p|9:16|16": {
      "tokens": "259402.5",
      "displayedTokens": "259403",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 13,
      "sourceRows": [
        13
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11"
      ]
    },
    "480p|16:9|17": {
      "tokens": "278617.5",
      "displayedTokens": "278618",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 14,
      "sourceRows": [
        14
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12"
      ]
    },
    "480p|9:16|17": {
      "tokens": "278617.5",
      "displayedTokens": "278618",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 14,
      "sourceRows": [
        14
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12"
      ]
    },
    "480p|16:9|18": {
      "tokens": "288225",
      "displayedTokens": "288225",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 15,
      "sourceRows": [
        15
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12"
      ]
    },
    "480p|9:16|18": {
      "tokens": "288225",
      "displayedTokens": "288225",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 15,
      "sourceRows": [
        15
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12"
      ]
    },
    "480p|16:9|19": {
      "tokens": "307440",
      "displayedTokens": "307440",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 16,
      "sourceRows": [
        16
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13"
      ]
    },
    "480p|9:16|19": {
      "tokens": "307440",
      "displayedTokens": "307440",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 16,
      "sourceRows": [
        16
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13"
      ]
    },
    "480p|16:9|20": {
      "tokens": "326655",
      "displayedTokens": "326655",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 17,
      "sourceRows": [
        17
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14"
      ]
    },
    "480p|9:16|20": {
      "tokens": "326655",
      "displayedTokens": "326655",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 17,
      "sourceRows": [
        17
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14"
      ]
    },
    "480p|16:9|21": {
      "tokens": "336262.5",
      "displayedTokens": "336263",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 18,
      "sourceRows": [
        18
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14"
      ]
    },
    "480p|9:16|21": {
      "tokens": "336262.5",
      "displayedTokens": "336263",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 18,
      "sourceRows": [
        18
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14"
      ]
    },
    "480p|16:9|22": {
      "tokens": "355477.5",
      "displayedTokens": "355478",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 19,
      "sourceRows": [
        19
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15"
      ]
    },
    "480p|9:16|22": {
      "tokens": "355477.5",
      "displayedTokens": "355478",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 19,
      "sourceRows": [
        19
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15"
      ]
    },
    "480p|16:9|23": {
      "tokens": "374692.5",
      "displayedTokens": "374693",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 20,
      "sourceRows": [
        20
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16"
      ]
    },
    "480p|9:16|23": {
      "tokens": "374692.5",
      "displayedTokens": "374693",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 20,
      "sourceRows": [
        20
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16"
      ]
    },
    "480p|16:9|24": {
      "tokens": "384300",
      "displayedTokens": "384300",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 21,
      "sourceRows": [
        21
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16"
      ]
    },
    "480p|9:16|24": {
      "tokens": "384300",
      "displayedTokens": "384300",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 21,
      "sourceRows": [
        21
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16"
      ]
    },
    "480p|16:9|25": {
      "tokens": "403515",
      "displayedTokens": "403515",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 22,
      "sourceRows": [
        22
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17"
      ]
    },
    "480p|9:16|25": {
      "tokens": "403515",
      "displayedTokens": "403515",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 22,
      "sourceRows": [
        22
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17"
      ]
    },
    "480p|16:9|26": {
      "tokens": "422730",
      "displayedTokens": "422730",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 23,
      "sourceRows": [
        23
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18"
      ]
    },
    "480p|9:16|26": {
      "tokens": "422730",
      "displayedTokens": "422730",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 23,
      "sourceRows": [
        23
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18"
      ]
    },
    "480p|16:9|27": {
      "tokens": "432337.5",
      "displayedTokens": "432338",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 24,
      "sourceRows": [
        24
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18"
      ]
    },
    "480p|9:16|27": {
      "tokens": "432337.5",
      "displayedTokens": "432338",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 24,
      "sourceRows": [
        24
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18"
      ]
    },
    "480p|16:9|28": {
      "tokens": "451552.5",
      "displayedTokens": "451553",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 25,
      "sourceRows": [
        25
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19"
      ]
    },
    "480p|9:16|28": {
      "tokens": "451552.5",
      "displayedTokens": "451553",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 25,
      "sourceRows": [
        25
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19"
      ]
    },
    "480p|16:9|29": {
      "tokens": "470767.5",
      "displayedTokens": "470768",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 26,
      "sourceRows": [
        26
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19",
        "20"
      ]
    },
    "480p|9:16|29": {
      "tokens": "470767.5",
      "displayedTokens": "470768",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 26,
      "sourceRows": [
        26
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19",
        "20"
      ]
    },
    "480p|16:9|30": {
      "tokens": "480375",
      "displayedTokens": "480375",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 27,
      "sourceRows": [
        27
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19",
        "20"
      ]
    },
    "480p|9:16|30": {
      "tokens": "480375",
      "displayedTokens": "480375",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 27,
      "sourceRows": [
        27
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19",
        "20"
      ]
    },
    "480p|4:3|4": {
      "tokens": "69090",
      "displayedTokens": "69090",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 28,
      "sourceRows": [
        28
      ],
      "minimizingInputSeconds": [
        "2",
        "3"
      ]
    },
    "480p|3:4|4": {
      "tokens": "69090",
      "displayedTokens": "69090",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 28,
      "sourceRows": [
        28
      ],
      "minimizingInputSeconds": [
        "2",
        "3"
      ]
    },
    "480p|4:3|5": {
      "tokens": "88830",
      "displayedTokens": "88830",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 29,
      "sourceRows": [
        29
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4"
      ]
    },
    "480p|3:4|5": {
      "tokens": "88830",
      "displayedTokens": "88830",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 29,
      "sourceRows": [
        29
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4"
      ]
    },
    "480p|4:3|6": {
      "tokens": "98700",
      "displayedTokens": "98700",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 30,
      "sourceRows": [
        30
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4"
      ]
    },
    "480p|3:4|6": {
      "tokens": "98700",
      "displayedTokens": "98700",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 30,
      "sourceRows": [
        30
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4"
      ]
    },
    "480p|4:3|7": {
      "tokens": "118440",
      "displayedTokens": "118440",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 31,
      "sourceRows": [
        31
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5"
      ]
    },
    "480p|3:4|7": {
      "tokens": "118440",
      "displayedTokens": "118440",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 31,
      "sourceRows": [
        31
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5"
      ]
    },
    "480p|4:3|8": {
      "tokens": "138180",
      "displayedTokens": "138180",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 32,
      "sourceRows": [
        32
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6"
      ]
    },
    "480p|3:4|8": {
      "tokens": "138180",
      "displayedTokens": "138180",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 32,
      "sourceRows": [
        32
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6"
      ]
    },
    "480p|4:3|9": {
      "tokens": "148050",
      "displayedTokens": "148050",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 33,
      "sourceRows": [
        33
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6"
      ]
    },
    "480p|3:4|9": {
      "tokens": "148050",
      "displayedTokens": "148050",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 33,
      "sourceRows": [
        33
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6"
      ]
    },
    "480p|4:3|10": {
      "tokens": "167790",
      "displayedTokens": "167790",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 34,
      "sourceRows": [
        34
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7"
      ]
    },
    "480p|3:4|10": {
      "tokens": "167790",
      "displayedTokens": "167790",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 34,
      "sourceRows": [
        34
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7"
      ]
    },
    "480p|4:3|11": {
      "tokens": "187530",
      "displayedTokens": "187530",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 35,
      "sourceRows": [
        35
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8"
      ]
    },
    "480p|3:4|11": {
      "tokens": "187530",
      "displayedTokens": "187530",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 35,
      "sourceRows": [
        35
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8"
      ]
    },
    "480p|4:3|12": {
      "tokens": "197400",
      "displayedTokens": "197400",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 36,
      "sourceRows": [
        36
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8"
      ]
    },
    "480p|3:4|12": {
      "tokens": "197400",
      "displayedTokens": "197400",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 36,
      "sourceRows": [
        36
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8"
      ]
    },
    "480p|4:3|13": {
      "tokens": "217140",
      "displayedTokens": "217140",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 37,
      "sourceRows": [
        37
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9"
      ]
    },
    "480p|3:4|13": {
      "tokens": "217140",
      "displayedTokens": "217140",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 37,
      "sourceRows": [
        37
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9"
      ]
    },
    "480p|4:3|14": {
      "tokens": "236880",
      "displayedTokens": "236880",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 38,
      "sourceRows": [
        38
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10"
      ]
    },
    "480p|3:4|14": {
      "tokens": "236880",
      "displayedTokens": "236880",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 38,
      "sourceRows": [
        38
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10"
      ]
    },
    "480p|4:3|15": {
      "tokens": "246750",
      "displayedTokens": "246750",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 39,
      "sourceRows": [
        39
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10"
      ]
    },
    "480p|3:4|15": {
      "tokens": "246750",
      "displayedTokens": "246750",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 39,
      "sourceRows": [
        39
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10"
      ]
    },
    "480p|4:3|16": {
      "tokens": "266490",
      "displayedTokens": "266490",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 40,
      "sourceRows": [
        40
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11"
      ]
    },
    "480p|3:4|16": {
      "tokens": "266490",
      "displayedTokens": "266490",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 40,
      "sourceRows": [
        40
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11"
      ]
    },
    "480p|4:3|17": {
      "tokens": "286230",
      "displayedTokens": "286230",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 41,
      "sourceRows": [
        41
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12"
      ]
    },
    "480p|3:4|17": {
      "tokens": "286230",
      "displayedTokens": "286230",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 41,
      "sourceRows": [
        41
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12"
      ]
    },
    "480p|4:3|18": {
      "tokens": "296100",
      "displayedTokens": "296100",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 42,
      "sourceRows": [
        42
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12"
      ]
    },
    "480p|3:4|18": {
      "tokens": "296100",
      "displayedTokens": "296100",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 42,
      "sourceRows": [
        42
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12"
      ]
    },
    "480p|4:3|19": {
      "tokens": "315840",
      "displayedTokens": "315840",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 43,
      "sourceRows": [
        43
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13"
      ]
    },
    "480p|3:4|19": {
      "tokens": "315840",
      "displayedTokens": "315840",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 43,
      "sourceRows": [
        43
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13"
      ]
    },
    "480p|4:3|20": {
      "tokens": "335580",
      "displayedTokens": "335580",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 44,
      "sourceRows": [
        44
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14"
      ]
    },
    "480p|3:4|20": {
      "tokens": "335580",
      "displayedTokens": "335580",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 44,
      "sourceRows": [
        44
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14"
      ]
    },
    "480p|4:3|21": {
      "tokens": "345450",
      "displayedTokens": "345450",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 45,
      "sourceRows": [
        45
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14"
      ]
    },
    "480p|3:4|21": {
      "tokens": "345450",
      "displayedTokens": "345450",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 45,
      "sourceRows": [
        45
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14"
      ]
    },
    "480p|4:3|22": {
      "tokens": "365190",
      "displayedTokens": "365190",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 46,
      "sourceRows": [
        46
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15"
      ]
    },
    "480p|3:4|22": {
      "tokens": "365190",
      "displayedTokens": "365190",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 46,
      "sourceRows": [
        46
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15"
      ]
    },
    "480p|4:3|23": {
      "tokens": "384930",
      "displayedTokens": "384930",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 47,
      "sourceRows": [
        47
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16"
      ]
    },
    "480p|3:4|23": {
      "tokens": "384930",
      "displayedTokens": "384930",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 47,
      "sourceRows": [
        47
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16"
      ]
    },
    "480p|4:3|24": {
      "tokens": "394800",
      "displayedTokens": "394800",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 48,
      "sourceRows": [
        48
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16"
      ]
    },
    "480p|3:4|24": {
      "tokens": "394800",
      "displayedTokens": "394800",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 48,
      "sourceRows": [
        48
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16"
      ]
    },
    "480p|4:3|25": {
      "tokens": "414540",
      "displayedTokens": "414540",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 49,
      "sourceRows": [
        49
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17"
      ]
    },
    "480p|3:4|25": {
      "tokens": "414540",
      "displayedTokens": "414540",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 49,
      "sourceRows": [
        49
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17"
      ]
    },
    "480p|4:3|26": {
      "tokens": "434280",
      "displayedTokens": "434280",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 50,
      "sourceRows": [
        50
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18"
      ]
    },
    "480p|3:4|26": {
      "tokens": "434280",
      "displayedTokens": "434280",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 50,
      "sourceRows": [
        50
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18"
      ]
    },
    "480p|4:3|27": {
      "tokens": "444150",
      "displayedTokens": "444150",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 51,
      "sourceRows": [
        51
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18"
      ]
    },
    "480p|3:4|27": {
      "tokens": "444150",
      "displayedTokens": "444150",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 51,
      "sourceRows": [
        51
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18"
      ]
    },
    "480p|4:3|28": {
      "tokens": "463890",
      "displayedTokens": "463890",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 52,
      "sourceRows": [
        52
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19"
      ]
    },
    "480p|3:4|28": {
      "tokens": "463890",
      "displayedTokens": "463890",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 52,
      "sourceRows": [
        52
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19"
      ]
    },
    "480p|4:3|29": {
      "tokens": "483630",
      "displayedTokens": "483630",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 53,
      "sourceRows": [
        53
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19",
        "20"
      ]
    },
    "480p|3:4|29": {
      "tokens": "483630",
      "displayedTokens": "483630",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 53,
      "sourceRows": [
        53
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19",
        "20"
      ]
    },
    "480p|4:3|30": {
      "tokens": "493500",
      "displayedTokens": "493500",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 54,
      "sourceRows": [
        54
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19",
        "20"
      ]
    },
    "480p|3:4|30": {
      "tokens": "493500",
      "displayedTokens": "493500",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 54,
      "sourceRows": [
        54
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19",
        "20"
      ]
    },
    "480p|1:1|4": {
      "tokens": "67200",
      "displayedTokens": "67200",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 55,
      "sourceRows": [
        55
      ],
      "minimizingInputSeconds": [
        "2",
        "3"
      ]
    },
    "480p|1:1|5": {
      "tokens": "86400",
      "displayedTokens": "86400",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 56,
      "sourceRows": [
        56
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4"
      ]
    },
    "480p|1:1|6": {
      "tokens": "96000",
      "displayedTokens": "96000",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 57,
      "sourceRows": [
        57
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4"
      ]
    },
    "480p|1:1|7": {
      "tokens": "115200",
      "displayedTokens": "115200",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 58,
      "sourceRows": [
        58
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5"
      ]
    },
    "480p|1:1|8": {
      "tokens": "134400",
      "displayedTokens": "134400",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 59,
      "sourceRows": [
        59
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6"
      ]
    },
    "480p|1:1|9": {
      "tokens": "144000",
      "displayedTokens": "144000",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 60,
      "sourceRows": [
        60
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6"
      ]
    },
    "480p|1:1|10": {
      "tokens": "163200",
      "displayedTokens": "163200",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 61,
      "sourceRows": [
        61
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7"
      ]
    },
    "480p|1:1|11": {
      "tokens": "182400",
      "displayedTokens": "182400",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 62,
      "sourceRows": [
        62
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8"
      ]
    },
    "480p|1:1|12": {
      "tokens": "192000",
      "displayedTokens": "192000",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 63,
      "sourceRows": [
        63
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8"
      ]
    },
    "480p|1:1|13": {
      "tokens": "211200",
      "displayedTokens": "211200",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 64,
      "sourceRows": [
        64
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9"
      ]
    },
    "480p|1:1|14": {
      "tokens": "230400",
      "displayedTokens": "230400",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 65,
      "sourceRows": [
        65
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10"
      ]
    },
    "480p|1:1|15": {
      "tokens": "240000",
      "displayedTokens": "240000",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 66,
      "sourceRows": [
        66
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10"
      ]
    },
    "480p|1:1|16": {
      "tokens": "259200",
      "displayedTokens": "259200",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 67,
      "sourceRows": [
        67
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11"
      ]
    },
    "480p|1:1|17": {
      "tokens": "278400",
      "displayedTokens": "278400",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 68,
      "sourceRows": [
        68
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12"
      ]
    },
    "480p|1:1|18": {
      "tokens": "288000",
      "displayedTokens": "288000",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 69,
      "sourceRows": [
        69
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12"
      ]
    },
    "480p|1:1|19": {
      "tokens": "307200",
      "displayedTokens": "307200",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 70,
      "sourceRows": [
        70
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13"
      ]
    },
    "480p|1:1|20": {
      "tokens": "326400",
      "displayedTokens": "326400",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 71,
      "sourceRows": [
        71
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14"
      ]
    },
    "480p|1:1|21": {
      "tokens": "336000",
      "displayedTokens": "336000",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 72,
      "sourceRows": [
        72
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14"
      ]
    },
    "480p|1:1|22": {
      "tokens": "355200",
      "displayedTokens": "355200",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 73,
      "sourceRows": [
        73
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15"
      ]
    },
    "480p|1:1|23": {
      "tokens": "374400",
      "displayedTokens": "374400",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 74,
      "sourceRows": [
        74
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16"
      ]
    },
    "480p|1:1|24": {
      "tokens": "384000",
      "displayedTokens": "384000",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 75,
      "sourceRows": [
        75
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16"
      ]
    },
    "480p|1:1|25": {
      "tokens": "403200",
      "displayedTokens": "403200",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 76,
      "sourceRows": [
        76
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17"
      ]
    },
    "480p|1:1|26": {
      "tokens": "422400",
      "displayedTokens": "422400",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 77,
      "sourceRows": [
        77
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18"
      ]
    },
    "480p|1:1|27": {
      "tokens": "432000",
      "displayedTokens": "432000",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 78,
      "sourceRows": [
        78
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18"
      ]
    },
    "480p|1:1|28": {
      "tokens": "451200",
      "displayedTokens": "451200",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 79,
      "sourceRows": [
        79
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19"
      ]
    },
    "480p|1:1|29": {
      "tokens": "470400",
      "displayedTokens": "470400",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 80,
      "sourceRows": [
        80
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19",
        "20"
      ]
    },
    "480p|1:1|30": {
      "tokens": "480000",
      "displayedTokens": "480000",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 81,
      "sourceRows": [
        81
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19",
        "20"
      ]
    },
    "480p|21:9|4": {
      "tokens": "70308",
      "displayedTokens": "70308",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 82,
      "sourceRows": [
        82
      ],
      "minimizingInputSeconds": [
        "2",
        "3"
      ]
    },
    "480p|21:9|5": {
      "tokens": "90396",
      "displayedTokens": "90396",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 83,
      "sourceRows": [
        83
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4"
      ]
    },
    "480p|21:9|6": {
      "tokens": "100440",
      "displayedTokens": "100440",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 84,
      "sourceRows": [
        84
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4"
      ]
    },
    "480p|21:9|7": {
      "tokens": "120528",
      "displayedTokens": "120528",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 85,
      "sourceRows": [
        85
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5"
      ]
    },
    "480p|21:9|8": {
      "tokens": "140616",
      "displayedTokens": "140616",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 86,
      "sourceRows": [
        86
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6"
      ]
    },
    "480p|21:9|9": {
      "tokens": "150660",
      "displayedTokens": "150660",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 87,
      "sourceRows": [
        87
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6"
      ]
    },
    "480p|21:9|10": {
      "tokens": "170748",
      "displayedTokens": "170748",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 88,
      "sourceRows": [
        88
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7"
      ]
    },
    "480p|21:9|11": {
      "tokens": "190836",
      "displayedTokens": "190836",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 89,
      "sourceRows": [
        89
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8"
      ]
    },
    "480p|21:9|12": {
      "tokens": "200880",
      "displayedTokens": "200880",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 90,
      "sourceRows": [
        90
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8"
      ]
    },
    "480p|21:9|13": {
      "tokens": "220968",
      "displayedTokens": "220968",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 91,
      "sourceRows": [
        91
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9"
      ]
    },
    "480p|21:9|14": {
      "tokens": "241056",
      "displayedTokens": "241056",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 92,
      "sourceRows": [
        92
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10"
      ]
    },
    "480p|21:9|15": {
      "tokens": "251100",
      "displayedTokens": "251100",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 93,
      "sourceRows": [
        93
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10"
      ]
    },
    "480p|21:9|16": {
      "tokens": "271188",
      "displayedTokens": "271188",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 94,
      "sourceRows": [
        94,
        109
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11"
      ]
    },
    "480p|21:9|17": {
      "tokens": "291276",
      "displayedTokens": "291276",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 95,
      "sourceRows": [
        95,
        110
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12"
      ]
    },
    "480p|21:9|18": {
      "tokens": "301320",
      "displayedTokens": "301320",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 96,
      "sourceRows": [
        96,
        111
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12"
      ]
    },
    "480p|21:9|19": {
      "tokens": "321408",
      "displayedTokens": "321408",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 97,
      "sourceRows": [
        97,
        112
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13"
      ]
    },
    "480p|21:9|20": {
      "tokens": "341496",
      "displayedTokens": "341496",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 98,
      "sourceRows": [
        98,
        113
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14"
      ]
    },
    "480p|21:9|21": {
      "tokens": "351540",
      "displayedTokens": "351540",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 99,
      "sourceRows": [
        99,
        114
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14"
      ]
    },
    "480p|21:9|22": {
      "tokens": "371628",
      "displayedTokens": "371628",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 100,
      "sourceRows": [
        100,
        115
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15"
      ]
    },
    "480p|21:9|23": {
      "tokens": "391716",
      "displayedTokens": "391716",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 101,
      "sourceRows": [
        101,
        116
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16"
      ]
    },
    "480p|21:9|24": {
      "tokens": "401760",
      "displayedTokens": "401760",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 102,
      "sourceRows": [
        102,
        117
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16"
      ]
    },
    "480p|21:9|25": {
      "tokens": "421848",
      "displayedTokens": "421848",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 103,
      "sourceRows": [
        103,
        118
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17"
      ]
    },
    "480p|21:9|26": {
      "tokens": "441936",
      "displayedTokens": "441936",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 104,
      "sourceRows": [
        104,
        119
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18"
      ]
    },
    "480p|21:9|27": {
      "tokens": "451980",
      "displayedTokens": "451980",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 105,
      "sourceRows": [
        105,
        120
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18"
      ]
    },
    "480p|21:9|28": {
      "tokens": "472068",
      "displayedTokens": "472068",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 106,
      "sourceRows": [
        106,
        121
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19"
      ]
    },
    "480p|21:9|29": {
      "tokens": "492156",
      "displayedTokens": "492156",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 107,
      "sourceRows": [
        107,
        122
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19",
        "20"
      ]
    },
    "480p|21:9|30": {
      "tokens": "502200",
      "displayedTokens": "502200",
      "sourceFile": "evidence/2026-10-20/models/minimum-480p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vew2CR2JYM",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 108,
      "sourceRows": [
        108,
        123
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19",
        "20"
      ]
    },
    "720p|16:9|4": {
      "tokens": "151200",
      "displayedTokens": "151200",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 1,
      "sourceRows": [
        1
      ],
      "minimizingInputSeconds": [
        "2",
        "3"
      ]
    },
    "720p|9:16|4": {
      "tokens": "151200",
      "displayedTokens": "151200",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 1,
      "sourceRows": [
        1
      ],
      "minimizingInputSeconds": [
        "2",
        "3"
      ]
    },
    "720p|16:9|5": {
      "tokens": "194400",
      "displayedTokens": "194400",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 2,
      "sourceRows": [
        2
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4"
      ]
    },
    "720p|9:16|5": {
      "tokens": "194400",
      "displayedTokens": "194400",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 2,
      "sourceRows": [
        2
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4"
      ]
    },
    "720p|16:9|6": {
      "tokens": "216000",
      "displayedTokens": "216000",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 3,
      "sourceRows": [
        3
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4"
      ]
    },
    "720p|9:16|6": {
      "tokens": "216000",
      "displayedTokens": "216000",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 3,
      "sourceRows": [
        3
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4"
      ]
    },
    "720p|16:9|7": {
      "tokens": "259200",
      "displayedTokens": "259200",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 4,
      "sourceRows": [
        4
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5"
      ]
    },
    "720p|9:16|7": {
      "tokens": "259200",
      "displayedTokens": "259200",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 4,
      "sourceRows": [
        4
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5"
      ]
    },
    "720p|16:9|8": {
      "tokens": "302400",
      "displayedTokens": "302400",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 5,
      "sourceRows": [
        5
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6"
      ]
    },
    "720p|9:16|8": {
      "tokens": "302400",
      "displayedTokens": "302400",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 5,
      "sourceRows": [
        5
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6"
      ]
    },
    "720p|16:9|9": {
      "tokens": "324000",
      "displayedTokens": "324000",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 6,
      "sourceRows": [
        6
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6"
      ]
    },
    "720p|9:16|9": {
      "tokens": "324000",
      "displayedTokens": "324000",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 6,
      "sourceRows": [
        6
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6"
      ]
    },
    "720p|16:9|10": {
      "tokens": "367200",
      "displayedTokens": "367200",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 7,
      "sourceRows": [
        7
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7"
      ]
    },
    "720p|9:16|10": {
      "tokens": "367200",
      "displayedTokens": "367200",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 7,
      "sourceRows": [
        7
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7"
      ]
    },
    "720p|16:9|11": {
      "tokens": "410400",
      "displayedTokens": "410400",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 8,
      "sourceRows": [
        8
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8"
      ]
    },
    "720p|9:16|11": {
      "tokens": "410400",
      "displayedTokens": "410400",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 8,
      "sourceRows": [
        8
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8"
      ]
    },
    "720p|16:9|12": {
      "tokens": "432000",
      "displayedTokens": "432000",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 9,
      "sourceRows": [
        9
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8"
      ]
    },
    "720p|9:16|12": {
      "tokens": "432000",
      "displayedTokens": "432000",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 9,
      "sourceRows": [
        9
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8"
      ]
    },
    "720p|16:9|13": {
      "tokens": "475200",
      "displayedTokens": "475200",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 10,
      "sourceRows": [
        10
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9"
      ]
    },
    "720p|9:16|13": {
      "tokens": "475200",
      "displayedTokens": "475200",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 10,
      "sourceRows": [
        10
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9"
      ]
    },
    "720p|16:9|14": {
      "tokens": "518400",
      "displayedTokens": "518400",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 11,
      "sourceRows": [
        11
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10"
      ]
    },
    "720p|9:16|14": {
      "tokens": "518400",
      "displayedTokens": "518400",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 11,
      "sourceRows": [
        11
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10"
      ]
    },
    "720p|16:9|15": {
      "tokens": "540000",
      "displayedTokens": "540000",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 12,
      "sourceRows": [
        12
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10"
      ]
    },
    "720p|9:16|15": {
      "tokens": "540000",
      "displayedTokens": "540000",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 12,
      "sourceRows": [
        12
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10"
      ]
    },
    "720p|16:9|16": {
      "tokens": "583200",
      "displayedTokens": "583200",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 13,
      "sourceRows": [
        13
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11"
      ]
    },
    "720p|9:16|16": {
      "tokens": "583200",
      "displayedTokens": "583200",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 13,
      "sourceRows": [
        13
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11"
      ]
    },
    "720p|16:9|17": {
      "tokens": "626400",
      "displayedTokens": "626400",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 14,
      "sourceRows": [
        14
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12"
      ]
    },
    "720p|9:16|17": {
      "tokens": "626400",
      "displayedTokens": "626400",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 14,
      "sourceRows": [
        14
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12"
      ]
    },
    "720p|16:9|18": {
      "tokens": "648000",
      "displayedTokens": "648000",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 15,
      "sourceRows": [
        15
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12"
      ]
    },
    "720p|9:16|18": {
      "tokens": "648000",
      "displayedTokens": "648000",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 15,
      "sourceRows": [
        15
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12"
      ]
    },
    "720p|16:9|19": {
      "tokens": "691200",
      "displayedTokens": "691200",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 16,
      "sourceRows": [
        16
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13"
      ]
    },
    "720p|9:16|19": {
      "tokens": "691200",
      "displayedTokens": "691200",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 16,
      "sourceRows": [
        16
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13"
      ]
    },
    "720p|16:9|20": {
      "tokens": "734400",
      "displayedTokens": "734400",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 17,
      "sourceRows": [
        17
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14"
      ]
    },
    "720p|9:16|20": {
      "tokens": "734400",
      "displayedTokens": "734400",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 17,
      "sourceRows": [
        17
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14"
      ]
    },
    "720p|16:9|21": {
      "tokens": "756000",
      "displayedTokens": "756000",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 18,
      "sourceRows": [
        18
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14"
      ]
    },
    "720p|9:16|21": {
      "tokens": "756000",
      "displayedTokens": "756000",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 18,
      "sourceRows": [
        18
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14"
      ]
    },
    "720p|16:9|22": {
      "tokens": "799200",
      "displayedTokens": "799200",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 19,
      "sourceRows": [
        19
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15"
      ]
    },
    "720p|9:16|22": {
      "tokens": "799200",
      "displayedTokens": "799200",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 19,
      "sourceRows": [
        19
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15"
      ]
    },
    "720p|16:9|23": {
      "tokens": "842400",
      "displayedTokens": "842400",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 20,
      "sourceRows": [
        20
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16"
      ]
    },
    "720p|9:16|23": {
      "tokens": "842400",
      "displayedTokens": "842400",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 20,
      "sourceRows": [
        20
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16"
      ]
    },
    "720p|16:9|24": {
      "tokens": "864000",
      "displayedTokens": "864000",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 21,
      "sourceRows": [
        21
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16"
      ]
    },
    "720p|9:16|24": {
      "tokens": "864000",
      "displayedTokens": "864000",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 21,
      "sourceRows": [
        21
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16"
      ]
    },
    "720p|16:9|25": {
      "tokens": "907200",
      "displayedTokens": "907200",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 22,
      "sourceRows": [
        22
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17"
      ]
    },
    "720p|9:16|25": {
      "tokens": "907200",
      "displayedTokens": "907200",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 22,
      "sourceRows": [
        22
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17"
      ]
    },
    "720p|16:9|26": {
      "tokens": "950400",
      "displayedTokens": "950400",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 23,
      "sourceRows": [
        23
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18"
      ]
    },
    "720p|9:16|26": {
      "tokens": "950400",
      "displayedTokens": "950400",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 23,
      "sourceRows": [
        23
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18"
      ]
    },
    "720p|16:9|27": {
      "tokens": "972000",
      "displayedTokens": "972000",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 24,
      "sourceRows": [
        24
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18"
      ]
    },
    "720p|9:16|27": {
      "tokens": "972000",
      "displayedTokens": "972000",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 24,
      "sourceRows": [
        24
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18"
      ]
    },
    "720p|16:9|28": {
      "tokens": "1015200",
      "displayedTokens": "1015200",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 25,
      "sourceRows": [
        25
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19"
      ]
    },
    "720p|9:16|28": {
      "tokens": "1015200",
      "displayedTokens": "1015200",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 25,
      "sourceRows": [
        25
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19"
      ]
    },
    "720p|16:9|29": {
      "tokens": "1058400",
      "displayedTokens": "1058400",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 26,
      "sourceRows": [
        26
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19",
        "20"
      ]
    },
    "720p|9:16|29": {
      "tokens": "1058400",
      "displayedTokens": "1058400",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 26,
      "sourceRows": [
        26
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19",
        "20"
      ]
    },
    "720p|16:9|30": {
      "tokens": "1080000",
      "displayedTokens": "1080000",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 27,
      "sourceRows": [
        27
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19",
        "20"
      ]
    },
    "720p|9:16|30": {
      "tokens": "1080000",
      "displayedTokens": "1080000",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 27,
      "sourceRows": [
        27
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19",
        "20"
      ]
    },
    "720p|4:3|25": {
      "tokens": "912917.25",
      "displayedTokens": "912917",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 28,
      "sourceRows": [
        28
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17"
      ]
    },
    "720p|3:4|25": {
      "tokens": "912917.25",
      "displayedTokens": "912917",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 28,
      "sourceRows": [
        28
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17"
      ]
    },
    "720p|4:3|26": {
      "tokens": "956389.5",
      "displayedTokens": "956390",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 29,
      "sourceRows": [
        29
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18"
      ]
    },
    "720p|3:4|26": {
      "tokens": "956389.5",
      "displayedTokens": "956390",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 29,
      "sourceRows": [
        29
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18"
      ]
    },
    "720p|4:3|27": {
      "tokens": "978125.625",
      "displayedTokens": "978126",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 30,
      "sourceRows": [
        30
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18"
      ]
    },
    "720p|3:4|27": {
      "tokens": "978125.625",
      "displayedTokens": "978126",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 30,
      "sourceRows": [
        30
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18"
      ]
    },
    "720p|4:3|28": {
      "tokens": "1021597.875",
      "displayedTokens": "1021598",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 31,
      "sourceRows": [
        31
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19"
      ]
    },
    "720p|3:4|28": {
      "tokens": "1021597.875",
      "displayedTokens": "1021598",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 31,
      "sourceRows": [
        31
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19"
      ]
    },
    "720p|4:3|29": {
      "tokens": "1065070.125",
      "displayedTokens": "1065070",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 32,
      "sourceRows": [
        32
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19",
        "20"
      ]
    },
    "720p|3:4|29": {
      "tokens": "1065070.125",
      "displayedTokens": "1065070",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 32,
      "sourceRows": [
        32
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19",
        "20"
      ]
    },
    "720p|4:3|30": {
      "tokens": "1086806.25",
      "displayedTokens": "1086806",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 33,
      "sourceRows": [
        33
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19",
        "20"
      ]
    },
    "720p|3:4|30": {
      "tokens": "1086806.25",
      "displayedTokens": "1086806",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 33,
      "sourceRows": [
        33
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19",
        "20"
      ]
    },
    "720p|4:3|4": {
      "tokens": "152152.875",
      "displayedTokens": "152153",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 34,
      "sourceRows": [
        34
      ],
      "minimizingInputSeconds": [
        "2",
        "3"
      ]
    },
    "720p|3:4|4": {
      "tokens": "152152.875",
      "displayedTokens": "152153",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 34,
      "sourceRows": [
        34
      ],
      "minimizingInputSeconds": [
        "2",
        "3"
      ]
    },
    "720p|4:3|5": {
      "tokens": "195625.125",
      "displayedTokens": "195625",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 35,
      "sourceRows": [
        35
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4"
      ]
    },
    "720p|3:4|5": {
      "tokens": "195625.125",
      "displayedTokens": "195625",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 35,
      "sourceRows": [
        35
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4"
      ]
    },
    "720p|4:3|6": {
      "tokens": "217361.25",
      "displayedTokens": "217361",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 36,
      "sourceRows": [
        36
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4"
      ]
    },
    "720p|3:4|6": {
      "tokens": "217361.25",
      "displayedTokens": "217361",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 36,
      "sourceRows": [
        36
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4"
      ]
    },
    "720p|4:3|7": {
      "tokens": "260833.5",
      "displayedTokens": "260834",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 37,
      "sourceRows": [
        37
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5"
      ]
    },
    "720p|3:4|7": {
      "tokens": "260833.5",
      "displayedTokens": "260834",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 37,
      "sourceRows": [
        37
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5"
      ]
    },
    "720p|4:3|8": {
      "tokens": "304305.75",
      "displayedTokens": "304306",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 38,
      "sourceRows": [
        38
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6"
      ]
    },
    "720p|3:4|8": {
      "tokens": "304305.75",
      "displayedTokens": "304306",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 38,
      "sourceRows": [
        38
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6"
      ]
    },
    "720p|4:3|9": {
      "tokens": "326041.875",
      "displayedTokens": "326042",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 39,
      "sourceRows": [
        39
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6"
      ]
    },
    "720p|3:4|9": {
      "tokens": "326041.875",
      "displayedTokens": "326042",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 39,
      "sourceRows": [
        39
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6"
      ]
    },
    "720p|4:3|10": {
      "tokens": "369514.125",
      "displayedTokens": "369514",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 40,
      "sourceRows": [
        40
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7"
      ]
    },
    "720p|3:4|10": {
      "tokens": "369514.125",
      "displayedTokens": "369514",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 40,
      "sourceRows": [
        40
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7"
      ]
    },
    "720p|4:3|11": {
      "tokens": "412986.375",
      "displayedTokens": "412986",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 41,
      "sourceRows": [
        41
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8"
      ]
    },
    "720p|3:4|11": {
      "tokens": "412986.375",
      "displayedTokens": "412986",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 41,
      "sourceRows": [
        41
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8"
      ]
    },
    "720p|4:3|12": {
      "tokens": "434722.5",
      "displayedTokens": "434723",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 42,
      "sourceRows": [
        42
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8"
      ]
    },
    "720p|3:4|12": {
      "tokens": "434722.5",
      "displayedTokens": "434723",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 42,
      "sourceRows": [
        42
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8"
      ]
    },
    "720p|4:3|13": {
      "tokens": "478194.75",
      "displayedTokens": "478195",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 43,
      "sourceRows": [
        43
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9"
      ]
    },
    "720p|3:4|13": {
      "tokens": "478194.75",
      "displayedTokens": "478195",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 43,
      "sourceRows": [
        43
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9"
      ]
    },
    "720p|4:3|14": {
      "tokens": "521667",
      "displayedTokens": "521667",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 44,
      "sourceRows": [
        44
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10"
      ]
    },
    "720p|3:4|14": {
      "tokens": "521667",
      "displayedTokens": "521667",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 44,
      "sourceRows": [
        44
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10"
      ]
    },
    "720p|4:3|15": {
      "tokens": "543403.125",
      "displayedTokens": "543403",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 45,
      "sourceRows": [
        45
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10"
      ]
    },
    "720p|3:4|15": {
      "tokens": "543403.125",
      "displayedTokens": "543403",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 45,
      "sourceRows": [
        45
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10"
      ]
    },
    "720p|4:3|16": {
      "tokens": "586875.375",
      "displayedTokens": "586875",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 46,
      "sourceRows": [
        46
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11"
      ]
    },
    "720p|3:4|16": {
      "tokens": "586875.375",
      "displayedTokens": "586875",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 46,
      "sourceRows": [
        46
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11"
      ]
    },
    "720p|4:3|17": {
      "tokens": "630347.625",
      "displayedTokens": "630348",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 47,
      "sourceRows": [
        47
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12"
      ]
    },
    "720p|3:4|17": {
      "tokens": "630347.625",
      "displayedTokens": "630348",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 47,
      "sourceRows": [
        47
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12"
      ]
    },
    "720p|4:3|18": {
      "tokens": "652083.75",
      "displayedTokens": "652084",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 48,
      "sourceRows": [
        48
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12"
      ]
    },
    "720p|3:4|18": {
      "tokens": "652083.75",
      "displayedTokens": "652084",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 48,
      "sourceRows": [
        48
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12"
      ]
    },
    "720p|4:3|19": {
      "tokens": "695556",
      "displayedTokens": "695556",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 49,
      "sourceRows": [
        49
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13"
      ]
    },
    "720p|3:4|19": {
      "tokens": "695556",
      "displayedTokens": "695556",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 49,
      "sourceRows": [
        49
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13"
      ]
    },
    "720p|4:3|20": {
      "tokens": "739028.25",
      "displayedTokens": "739028",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 50,
      "sourceRows": [
        50
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14"
      ]
    },
    "720p|3:4|20": {
      "tokens": "739028.25",
      "displayedTokens": "739028",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 50,
      "sourceRows": [
        50
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14"
      ]
    },
    "720p|4:3|21": {
      "tokens": "760764.375",
      "displayedTokens": "760764",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 51,
      "sourceRows": [
        51
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14"
      ]
    },
    "720p|3:4|21": {
      "tokens": "760764.375",
      "displayedTokens": "760764",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 51,
      "sourceRows": [
        51
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14"
      ]
    },
    "720p|4:3|22": {
      "tokens": "804236.625",
      "displayedTokens": "804237",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 52,
      "sourceRows": [
        52
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15"
      ]
    },
    "720p|3:4|22": {
      "tokens": "804236.625",
      "displayedTokens": "804237",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 52,
      "sourceRows": [
        52
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15"
      ]
    },
    "720p|4:3|23": {
      "tokens": "847708.875",
      "displayedTokens": "847709",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 53,
      "sourceRows": [
        53
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16"
      ]
    },
    "720p|3:4|23": {
      "tokens": "847708.875",
      "displayedTokens": "847709",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 53,
      "sourceRows": [
        53
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16"
      ]
    },
    "720p|4:3|24": {
      "tokens": "869445",
      "displayedTokens": "869445",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 54,
      "sourceRows": [
        54
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16"
      ]
    },
    "720p|3:4|24": {
      "tokens": "869445",
      "displayedTokens": "869445",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 54,
      "sourceRows": [
        54
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16"
      ]
    },
    "720p|1:1|4": {
      "tokens": "151200",
      "displayedTokens": "151200",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 55,
      "sourceRows": [
        55
      ],
      "minimizingInputSeconds": [
        "2",
        "3"
      ]
    },
    "720p|1:1|5": {
      "tokens": "194400",
      "displayedTokens": "194400",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 56,
      "sourceRows": [
        56
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4"
      ]
    },
    "720p|1:1|6": {
      "tokens": "216000",
      "displayedTokens": "216000",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 57,
      "sourceRows": [
        57
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4"
      ]
    },
    "720p|1:1|7": {
      "tokens": "259200",
      "displayedTokens": "259200",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 58,
      "sourceRows": [
        58
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5"
      ]
    },
    "720p|1:1|8": {
      "tokens": "302400",
      "displayedTokens": "302400",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 59,
      "sourceRows": [
        59
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6"
      ]
    },
    "720p|1:1|9": {
      "tokens": "324000",
      "displayedTokens": "324000",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 60,
      "sourceRows": [
        60
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6"
      ]
    },
    "720p|1:1|10": {
      "tokens": "367200",
      "displayedTokens": "367200",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 61,
      "sourceRows": [
        61
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7"
      ]
    },
    "720p|1:1|11": {
      "tokens": "410400",
      "displayedTokens": "410400",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 62,
      "sourceRows": [
        62
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8"
      ]
    },
    "720p|1:1|12": {
      "tokens": "432000",
      "displayedTokens": "432000",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 63,
      "sourceRows": [
        63
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8"
      ]
    },
    "720p|1:1|13": {
      "tokens": "475200",
      "displayedTokens": "475200",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 64,
      "sourceRows": [
        64
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9"
      ]
    },
    "720p|1:1|14": {
      "tokens": "518400",
      "displayedTokens": "518400",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 65,
      "sourceRows": [
        65
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10"
      ]
    },
    "720p|1:1|15": {
      "tokens": "540000",
      "displayedTokens": "540000",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 66,
      "sourceRows": [
        66
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10"
      ]
    },
    "720p|1:1|16": {
      "tokens": "583200",
      "displayedTokens": "583200",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 67,
      "sourceRows": [
        67
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11"
      ]
    },
    "720p|1:1|17": {
      "tokens": "626400",
      "displayedTokens": "626400",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 68,
      "sourceRows": [
        68
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12"
      ]
    },
    "720p|1:1|18": {
      "tokens": "648000",
      "displayedTokens": "648000",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 69,
      "sourceRows": [
        69
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12"
      ]
    },
    "720p|1:1|19": {
      "tokens": "691200",
      "displayedTokens": "691200",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 70,
      "sourceRows": [
        70
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13"
      ]
    },
    "720p|1:1|20": {
      "tokens": "734400",
      "displayedTokens": "734400",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 71,
      "sourceRows": [
        71
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14"
      ]
    },
    "720p|1:1|21": {
      "tokens": "756000",
      "displayedTokens": "756000",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 72,
      "sourceRows": [
        72
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14"
      ]
    },
    "720p|1:1|22": {
      "tokens": "799200",
      "displayedTokens": "799200",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 73,
      "sourceRows": [
        73
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15"
      ]
    },
    "720p|1:1|23": {
      "tokens": "842400",
      "displayedTokens": "842400",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 74,
      "sourceRows": [
        74
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16"
      ]
    },
    "720p|1:1|24": {
      "tokens": "864000",
      "displayedTokens": "864000",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 75,
      "sourceRows": [
        75
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16"
      ]
    },
    "720p|1:1|25": {
      "tokens": "907200",
      "displayedTokens": "907200",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 76,
      "sourceRows": [
        76
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17"
      ]
    },
    "720p|1:1|26": {
      "tokens": "950400",
      "displayedTokens": "950400",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 77,
      "sourceRows": [
        77
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18"
      ]
    },
    "720p|1:1|27": {
      "tokens": "972000",
      "displayedTokens": "972000",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 78,
      "sourceRows": [
        78
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18"
      ]
    },
    "720p|1:1|28": {
      "tokens": "1015200",
      "displayedTokens": "1015200",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 79,
      "sourceRows": [
        79
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19"
      ]
    },
    "720p|1:1|29": {
      "tokens": "1058400",
      "displayedTokens": "1058400",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 80,
      "sourceRows": [
        80
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19",
        "20"
      ]
    },
    "720p|1:1|30": {
      "tokens": "1080000",
      "displayedTokens": "1080000",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 81,
      "sourceRows": [
        81
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19",
        "20"
      ]
    },
    "720p|21:9|4": {
      "tokens": "151938.28125",
      "displayedTokens": "151938",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 82,
      "sourceRows": [
        82
      ],
      "minimizingInputSeconds": [
        "2",
        "3"
      ]
    },
    "720p|21:9|5": {
      "tokens": "195349.21875",
      "displayedTokens": "195349",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 83,
      "sourceRows": [
        83
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4"
      ]
    },
    "720p|21:9|6": {
      "tokens": "217054.6875",
      "displayedTokens": "217055",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 84,
      "sourceRows": [
        84
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4"
      ]
    },
    "720p|21:9|7": {
      "tokens": "260465.625",
      "displayedTokens": "260466",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 85,
      "sourceRows": [
        85
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5"
      ]
    },
    "720p|21:9|8": {
      "tokens": "303876.5625",
      "displayedTokens": "303877",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 86,
      "sourceRows": [
        86
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6"
      ]
    },
    "720p|21:9|9": {
      "tokens": "325582.03125",
      "displayedTokens": "325582",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 87,
      "sourceRows": [
        87
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6"
      ]
    },
    "720p|21:9|10": {
      "tokens": "368992.96875",
      "displayedTokens": "368993",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 88,
      "sourceRows": [
        88
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7"
      ]
    },
    "720p|21:9|11": {
      "tokens": "412403.90625",
      "displayedTokens": "412404",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 89,
      "sourceRows": [
        89
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8"
      ]
    },
    "720p|21:9|12": {
      "tokens": "434109.375",
      "displayedTokens": "434109",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 90,
      "sourceRows": [
        90
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8"
      ]
    },
    "720p|21:9|13": {
      "tokens": "477520.3125",
      "displayedTokens": "477520",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 91,
      "sourceRows": [
        91
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9"
      ]
    },
    "720p|21:9|14": {
      "tokens": "520931.25",
      "displayedTokens": "520931",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 92,
      "sourceRows": [
        92
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10"
      ]
    },
    "720p|21:9|15": {
      "tokens": "542636.71875",
      "displayedTokens": "542637",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 93,
      "sourceRows": [
        93
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10"
      ]
    },
    "720p|21:9|16": {
      "tokens": "586047.65625",
      "displayedTokens": "586048",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 94,
      "sourceRows": [
        94
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11"
      ]
    },
    "720p|21:9|17": {
      "tokens": "629458.59375",
      "displayedTokens": "629459",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 95,
      "sourceRows": [
        95
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12"
      ]
    },
    "720p|21:9|18": {
      "tokens": "651164.0625",
      "displayedTokens": "651164",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 96,
      "sourceRows": [
        96
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12"
      ]
    },
    "720p|21:9|19": {
      "tokens": "694575",
      "displayedTokens": "694575",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 97,
      "sourceRows": [
        97
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13"
      ]
    },
    "720p|21:9|20": {
      "tokens": "737985.9375",
      "displayedTokens": "737986",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 98,
      "sourceRows": [
        98
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14"
      ]
    },
    "720p|21:9|21": {
      "tokens": "759691.40625",
      "displayedTokens": "759691",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 99,
      "sourceRows": [
        99
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14"
      ]
    },
    "720p|21:9|22": {
      "tokens": "803102.34375",
      "displayedTokens": "803102",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 100,
      "sourceRows": [
        100
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15"
      ]
    },
    "720p|21:9|23": {
      "tokens": "846513.28125",
      "displayedTokens": "846513",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 101,
      "sourceRows": [
        101
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16"
      ]
    },
    "720p|21:9|24": {
      "tokens": "868218.75",
      "displayedTokens": "868219",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 102,
      "sourceRows": [
        102
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16"
      ]
    },
    "720p|21:9|25": {
      "tokens": "911629.6875",
      "displayedTokens": "911630",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 103,
      "sourceRows": [
        103
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17"
      ]
    },
    "720p|21:9|26": {
      "tokens": "955040.625",
      "displayedTokens": "955041",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 104,
      "sourceRows": [
        104
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18"
      ]
    },
    "720p|21:9|27": {
      "tokens": "976746.09375",
      "displayedTokens": "976746",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 105,
      "sourceRows": [
        105
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18"
      ]
    },
    "720p|21:9|28": {
      "tokens": "1020157.03125",
      "displayedTokens": "1020157",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 106,
      "sourceRows": [
        106
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19"
      ]
    },
    "720p|21:9|29": {
      "tokens": "1063567.96875",
      "displayedTokens": "1063568",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 107,
      "sourceRows": [
        107
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19",
        "20"
      ]
    },
    "720p|21:9|30": {
      "tokens": "1085273.4375",
      "displayedTokens": "1085273",
      "sourceFile": "evidence/2026-10-20/models/minimum-720p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewVBehIlq",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 108,
      "sourceRows": [
        108
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19",
        "20"
      ]
    },
    "1080p|16:9|4": {
      "tokens": "340200",
      "displayedTokens": "340200",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 1,
      "sourceRows": [
        1
      ],
      "minimizingInputSeconds": [
        "2",
        "3"
      ]
    },
    "1080p|9:16|4": {
      "tokens": "340200",
      "displayedTokens": "340200",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 1,
      "sourceRows": [
        1
      ],
      "minimizingInputSeconds": [
        "2",
        "3"
      ]
    },
    "1080p|16:9|5": {
      "tokens": "437400",
      "displayedTokens": "437400",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 2,
      "sourceRows": [
        2
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4"
      ]
    },
    "1080p|9:16|5": {
      "tokens": "437400",
      "displayedTokens": "437400",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 2,
      "sourceRows": [
        2
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4"
      ]
    },
    "1080p|16:9|6": {
      "tokens": "486000",
      "displayedTokens": "486000",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 3,
      "sourceRows": [
        3
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4"
      ]
    },
    "1080p|9:16|6": {
      "tokens": "486000",
      "displayedTokens": "486000",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 3,
      "sourceRows": [
        3
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4"
      ]
    },
    "1080p|16:9|7": {
      "tokens": "583200",
      "displayedTokens": "583200",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 4,
      "sourceRows": [
        4
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5"
      ]
    },
    "1080p|9:16|7": {
      "tokens": "583200",
      "displayedTokens": "583200",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 4,
      "sourceRows": [
        4
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5"
      ]
    },
    "1080p|16:9|8": {
      "tokens": "680400",
      "displayedTokens": "680400",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 5,
      "sourceRows": [
        5
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6"
      ]
    },
    "1080p|9:16|8": {
      "tokens": "680400",
      "displayedTokens": "680400",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 5,
      "sourceRows": [
        5
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6"
      ]
    },
    "1080p|16:9|9": {
      "tokens": "729000",
      "displayedTokens": "729000",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 6,
      "sourceRows": [
        6
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6"
      ]
    },
    "1080p|9:16|9": {
      "tokens": "729000",
      "displayedTokens": "729000",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 6,
      "sourceRows": [
        6
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6"
      ]
    },
    "1080p|16:9|10": {
      "tokens": "826200",
      "displayedTokens": "826200",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 7,
      "sourceRows": [
        7
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7"
      ]
    },
    "1080p|9:16|10": {
      "tokens": "826200",
      "displayedTokens": "826200",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 7,
      "sourceRows": [
        7
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7"
      ]
    },
    "1080p|16:9|11": {
      "tokens": "923400",
      "displayedTokens": "923400",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 8,
      "sourceRows": [
        8
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8"
      ]
    },
    "1080p|9:16|11": {
      "tokens": "923400",
      "displayedTokens": "923400",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 8,
      "sourceRows": [
        8
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8"
      ]
    },
    "1080p|16:9|12": {
      "tokens": "972000",
      "displayedTokens": "972000",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 9,
      "sourceRows": [
        9
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8"
      ]
    },
    "1080p|9:16|12": {
      "tokens": "972000",
      "displayedTokens": "972000",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 9,
      "sourceRows": [
        9
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8"
      ]
    },
    "1080p|16:9|13": {
      "tokens": "1069200",
      "displayedTokens": "1069200",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 10,
      "sourceRows": [
        10
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9"
      ]
    },
    "1080p|9:16|13": {
      "tokens": "1069200",
      "displayedTokens": "1069200",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 10,
      "sourceRows": [
        10
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9"
      ]
    },
    "1080p|16:9|14": {
      "tokens": "1166400",
      "displayedTokens": "1166400",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 11,
      "sourceRows": [
        11
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10"
      ]
    },
    "1080p|9:16|14": {
      "tokens": "1166400",
      "displayedTokens": "1166400",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 11,
      "sourceRows": [
        11
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10"
      ]
    },
    "1080p|16:9|15": {
      "tokens": "1215000",
      "displayedTokens": "1215000",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 12,
      "sourceRows": [
        12
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10"
      ]
    },
    "1080p|9:16|15": {
      "tokens": "1215000",
      "displayedTokens": "1215000",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 12,
      "sourceRows": [
        12
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10"
      ]
    },
    "1080p|16:9|16": {
      "tokens": "1312200",
      "displayedTokens": "1312200",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 13,
      "sourceRows": [
        13
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11"
      ]
    },
    "1080p|9:16|16": {
      "tokens": "1312200",
      "displayedTokens": "1312200",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 13,
      "sourceRows": [
        13
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11"
      ]
    },
    "1080p|16:9|17": {
      "tokens": "1409400",
      "displayedTokens": "1409400",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 14,
      "sourceRows": [
        14
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12"
      ]
    },
    "1080p|9:16|17": {
      "tokens": "1409400",
      "displayedTokens": "1409400",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 14,
      "sourceRows": [
        14
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12"
      ]
    },
    "1080p|16:9|18": {
      "tokens": "1458000",
      "displayedTokens": "1458000",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 15,
      "sourceRows": [
        15
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12"
      ]
    },
    "1080p|9:16|18": {
      "tokens": "1458000",
      "displayedTokens": "1458000",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 15,
      "sourceRows": [
        15
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12"
      ]
    },
    "1080p|16:9|19": {
      "tokens": "1555200",
      "displayedTokens": "1555200",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 16,
      "sourceRows": [
        16
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13"
      ]
    },
    "1080p|9:16|19": {
      "tokens": "1555200",
      "displayedTokens": "1555200",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 16,
      "sourceRows": [
        16
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13"
      ]
    },
    "1080p|16:9|20": {
      "tokens": "1652400",
      "displayedTokens": "1652400",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 17,
      "sourceRows": [
        17
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14"
      ]
    },
    "1080p|9:16|20": {
      "tokens": "1652400",
      "displayedTokens": "1652400",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 17,
      "sourceRows": [
        17
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14"
      ]
    },
    "1080p|16:9|21": {
      "tokens": "1701000",
      "displayedTokens": "1701000",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 18,
      "sourceRows": [
        18
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14"
      ]
    },
    "1080p|9:16|21": {
      "tokens": "1701000",
      "displayedTokens": "1701000",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 18,
      "sourceRows": [
        18
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14"
      ]
    },
    "1080p|16:9|22": {
      "tokens": "1798200",
      "displayedTokens": "1798200",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 19,
      "sourceRows": [
        19
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15"
      ]
    },
    "1080p|9:16|22": {
      "tokens": "1798200",
      "displayedTokens": "1798200",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 19,
      "sourceRows": [
        19
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15"
      ]
    },
    "1080p|16:9|23": {
      "tokens": "1895400",
      "displayedTokens": "1895400",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 20,
      "sourceRows": [
        20
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16"
      ]
    },
    "1080p|9:16|23": {
      "tokens": "1895400",
      "displayedTokens": "1895400",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 20,
      "sourceRows": [
        20
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16"
      ]
    },
    "1080p|16:9|24": {
      "tokens": "1944000",
      "displayedTokens": "1944000",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 21,
      "sourceRows": [
        21
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16"
      ]
    },
    "1080p|9:16|24": {
      "tokens": "1944000",
      "displayedTokens": "1944000",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 21,
      "sourceRows": [
        21
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16"
      ]
    },
    "1080p|16:9|25": {
      "tokens": "2041200",
      "displayedTokens": "2041200",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 22,
      "sourceRows": [
        22
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17"
      ]
    },
    "1080p|9:16|25": {
      "tokens": "2041200",
      "displayedTokens": "2041200",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 22,
      "sourceRows": [
        22
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17"
      ]
    },
    "1080p|16:9|26": {
      "tokens": "2138400",
      "displayedTokens": "2138400",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 23,
      "sourceRows": [
        23
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18"
      ]
    },
    "1080p|9:16|26": {
      "tokens": "2138400",
      "displayedTokens": "2138400",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 23,
      "sourceRows": [
        23
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18"
      ]
    },
    "1080p|16:9|27": {
      "tokens": "2187000",
      "displayedTokens": "2187000",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 24,
      "sourceRows": [
        24
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18"
      ]
    },
    "1080p|9:16|27": {
      "tokens": "2187000",
      "displayedTokens": "2187000",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 24,
      "sourceRows": [
        24
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18"
      ]
    },
    "1080p|16:9|28": {
      "tokens": "2284200",
      "displayedTokens": "2284200",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 25,
      "sourceRows": [
        25
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19"
      ]
    },
    "1080p|9:16|28": {
      "tokens": "2284200",
      "displayedTokens": "2284200",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 25,
      "sourceRows": [
        25
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19"
      ]
    },
    "1080p|16:9|29": {
      "tokens": "2381400",
      "displayedTokens": "2381400",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 26,
      "sourceRows": [
        26
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19",
        "20"
      ]
    },
    "1080p|9:16|29": {
      "tokens": "2381400",
      "displayedTokens": "2381400",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 26,
      "sourceRows": [
        26
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19",
        "20"
      ]
    },
    "1080p|16:9|30": {
      "tokens": "2430000",
      "displayedTokens": "2430000",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 27,
      "sourceRows": [
        27
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19",
        "20"
      ]
    },
    "1080p|9:16|30": {
      "tokens": "2430000",
      "displayedTokens": "2430000",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 27,
      "sourceRows": [
        27
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19",
        "20"
      ]
    },
    "1080p|4:3|4": {
      "tokens": "340704",
      "displayedTokens": "340704",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 28,
      "sourceRows": [
        28
      ],
      "minimizingInputSeconds": [
        "2",
        "3"
      ]
    },
    "1080p|3:4|4": {
      "tokens": "340704",
      "displayedTokens": "340704",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 28,
      "sourceRows": [
        28
      ],
      "minimizingInputSeconds": [
        "2",
        "3"
      ]
    },
    "1080p|4:3|5": {
      "tokens": "438048",
      "displayedTokens": "438048",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 29,
      "sourceRows": [
        29
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4"
      ]
    },
    "1080p|3:4|5": {
      "tokens": "438048",
      "displayedTokens": "438048",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 29,
      "sourceRows": [
        29
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4"
      ]
    },
    "1080p|4:3|6": {
      "tokens": "486720",
      "displayedTokens": "486720",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 30,
      "sourceRows": [
        30
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4"
      ]
    },
    "1080p|3:4|6": {
      "tokens": "486720",
      "displayedTokens": "486720",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 30,
      "sourceRows": [
        30
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4"
      ]
    },
    "1080p|4:3|7": {
      "tokens": "584064",
      "displayedTokens": "584064",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 31,
      "sourceRows": [
        31
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5"
      ]
    },
    "1080p|3:4|7": {
      "tokens": "584064",
      "displayedTokens": "584064",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 31,
      "sourceRows": [
        31
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5"
      ]
    },
    "1080p|4:3|8": {
      "tokens": "681408",
      "displayedTokens": "681408",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 32,
      "sourceRows": [
        32
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6"
      ]
    },
    "1080p|3:4|8": {
      "tokens": "681408",
      "displayedTokens": "681408",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 32,
      "sourceRows": [
        32
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6"
      ]
    },
    "1080p|4:3|9": {
      "tokens": "730080",
      "displayedTokens": "730080",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 33,
      "sourceRows": [
        33
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6"
      ]
    },
    "1080p|3:4|9": {
      "tokens": "730080",
      "displayedTokens": "730080",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 33,
      "sourceRows": [
        33
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6"
      ]
    },
    "1080p|4:3|10": {
      "tokens": "827424",
      "displayedTokens": "827424",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 34,
      "sourceRows": [
        34
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7"
      ]
    },
    "1080p|3:4|10": {
      "tokens": "827424",
      "displayedTokens": "827424",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 34,
      "sourceRows": [
        34
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7"
      ]
    },
    "1080p|4:3|11": {
      "tokens": "924768",
      "displayedTokens": "924768",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 35,
      "sourceRows": [
        35
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8"
      ]
    },
    "1080p|3:4|11": {
      "tokens": "924768",
      "displayedTokens": "924768",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 35,
      "sourceRows": [
        35
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8"
      ]
    },
    "1080p|4:3|12": {
      "tokens": "973440",
      "displayedTokens": "973440",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 36,
      "sourceRows": [
        36
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8"
      ]
    },
    "1080p|3:4|12": {
      "tokens": "973440",
      "displayedTokens": "973440",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 36,
      "sourceRows": [
        36
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8"
      ]
    },
    "1080p|4:3|13": {
      "tokens": "1070784",
      "displayedTokens": "1070784",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 37,
      "sourceRows": [
        37
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9"
      ]
    },
    "1080p|3:4|13": {
      "tokens": "1070784",
      "displayedTokens": "1070784",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 37,
      "sourceRows": [
        37
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9"
      ]
    },
    "1080p|4:3|14": {
      "tokens": "1168128",
      "displayedTokens": "1168128",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 38,
      "sourceRows": [
        38
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10"
      ]
    },
    "1080p|3:4|14": {
      "tokens": "1168128",
      "displayedTokens": "1168128",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 38,
      "sourceRows": [
        38
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10"
      ]
    },
    "1080p|4:3|15": {
      "tokens": "1216800",
      "displayedTokens": "1216800",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 39,
      "sourceRows": [
        39
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10"
      ]
    },
    "1080p|3:4|15": {
      "tokens": "1216800",
      "displayedTokens": "1216800",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 39,
      "sourceRows": [
        39
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10"
      ]
    },
    "1080p|4:3|16": {
      "tokens": "1314144",
      "displayedTokens": "1314144",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 40,
      "sourceRows": [
        40
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11"
      ]
    },
    "1080p|3:4|16": {
      "tokens": "1314144",
      "displayedTokens": "1314144",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 40,
      "sourceRows": [
        40
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11"
      ]
    },
    "1080p|4:3|17": {
      "tokens": "1411488",
      "displayedTokens": "1411488",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 41,
      "sourceRows": [
        41
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12"
      ]
    },
    "1080p|3:4|17": {
      "tokens": "1411488",
      "displayedTokens": "1411488",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 41,
      "sourceRows": [
        41
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12"
      ]
    },
    "1080p|4:3|18": {
      "tokens": "1460160",
      "displayedTokens": "1460160",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 42,
      "sourceRows": [
        42
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12"
      ]
    },
    "1080p|3:4|18": {
      "tokens": "1460160",
      "displayedTokens": "1460160",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 42,
      "sourceRows": [
        42
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12"
      ]
    },
    "1080p|4:3|19": {
      "tokens": "1557504",
      "displayedTokens": "1557504",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 43,
      "sourceRows": [
        43
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13"
      ]
    },
    "1080p|3:4|19": {
      "tokens": "1557504",
      "displayedTokens": "1557504",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 43,
      "sourceRows": [
        43
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13"
      ]
    },
    "1080p|4:3|20": {
      "tokens": "1654848",
      "displayedTokens": "1654848",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 44,
      "sourceRows": [
        44
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14"
      ]
    },
    "1080p|3:4|20": {
      "tokens": "1654848",
      "displayedTokens": "1654848",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 44,
      "sourceRows": [
        44
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14"
      ]
    },
    "1080p|4:3|21": {
      "tokens": "1703520",
      "displayedTokens": "1703520",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 45,
      "sourceRows": [
        45
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14"
      ]
    },
    "1080p|3:4|21": {
      "tokens": "1703520",
      "displayedTokens": "1703520",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 45,
      "sourceRows": [
        45
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14"
      ]
    },
    "1080p|4:3|22": {
      "tokens": "1800864",
      "displayedTokens": "1800864",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 46,
      "sourceRows": [
        46
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15"
      ]
    },
    "1080p|3:4|22": {
      "tokens": "1800864",
      "displayedTokens": "1800864",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 46,
      "sourceRows": [
        46
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15"
      ]
    },
    "1080p|4:3|23": {
      "tokens": "1898208",
      "displayedTokens": "1898208",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 47,
      "sourceRows": [
        47
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16"
      ]
    },
    "1080p|3:4|23": {
      "tokens": "1898208",
      "displayedTokens": "1898208",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 47,
      "sourceRows": [
        47
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16"
      ]
    },
    "1080p|4:3|24": {
      "tokens": "1946880",
      "displayedTokens": "1946880",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 48,
      "sourceRows": [
        48
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16"
      ]
    },
    "1080p|3:4|24": {
      "tokens": "1946880",
      "displayedTokens": "1946880",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 48,
      "sourceRows": [
        48
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16"
      ]
    },
    "1080p|4:3|25": {
      "tokens": "2044224",
      "displayedTokens": "2044224",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 49,
      "sourceRows": [
        49
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17"
      ]
    },
    "1080p|3:4|25": {
      "tokens": "2044224",
      "displayedTokens": "2044224",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 49,
      "sourceRows": [
        49
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17"
      ]
    },
    "1080p|4:3|26": {
      "tokens": "2141568",
      "displayedTokens": "2141568",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 50,
      "sourceRows": [
        50
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18"
      ]
    },
    "1080p|3:4|26": {
      "tokens": "2141568",
      "displayedTokens": "2141568",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 50,
      "sourceRows": [
        50
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18"
      ]
    },
    "1080p|4:3|27": {
      "tokens": "2190240",
      "displayedTokens": "2190240",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 51,
      "sourceRows": [
        51
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18"
      ]
    },
    "1080p|3:4|27": {
      "tokens": "2190240",
      "displayedTokens": "2190240",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 51,
      "sourceRows": [
        51
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18"
      ]
    },
    "1080p|4:3|28": {
      "tokens": "2287584",
      "displayedTokens": "2287584",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 52,
      "sourceRows": [
        52
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19"
      ]
    },
    "1080p|3:4|28": {
      "tokens": "2287584",
      "displayedTokens": "2287584",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 52,
      "sourceRows": [
        52
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19"
      ]
    },
    "1080p|4:3|29": {
      "tokens": "2384928",
      "displayedTokens": "2384928",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 53,
      "sourceRows": [
        53
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19",
        "20"
      ]
    },
    "1080p|3:4|29": {
      "tokens": "2384928",
      "displayedTokens": "2384928",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 53,
      "sourceRows": [
        53
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19",
        "20"
      ]
    },
    "1080p|4:3|30": {
      "tokens": "2433600",
      "displayedTokens": "2433600",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 54,
      "sourceRows": [
        54
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19",
        "20"
      ]
    },
    "1080p|3:4|30": {
      "tokens": "2433600",
      "displayedTokens": "2433600",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 54,
      "sourceRows": [
        54
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19",
        "20"
      ]
    },
    "1080p|1:1|4": {
      "tokens": "340200",
      "displayedTokens": "340200",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 55,
      "sourceRows": [
        55
      ],
      "minimizingInputSeconds": [
        "2",
        "3"
      ]
    },
    "1080p|1:1|5": {
      "tokens": "437400",
      "displayedTokens": "437400",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 56,
      "sourceRows": [
        56
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4"
      ]
    },
    "1080p|1:1|6": {
      "tokens": "486000",
      "displayedTokens": "486000",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 57,
      "sourceRows": [
        57
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4"
      ]
    },
    "1080p|1:1|7": {
      "tokens": "583200",
      "displayedTokens": "583200",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 58,
      "sourceRows": [
        58
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5"
      ]
    },
    "1080p|1:1|8": {
      "tokens": "680400",
      "displayedTokens": "680400",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 59,
      "sourceRows": [
        59
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6"
      ]
    },
    "1080p|1:1|9": {
      "tokens": "729000",
      "displayedTokens": "729000",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 60,
      "sourceRows": [
        60
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6"
      ]
    },
    "1080p|1:1|10": {
      "tokens": "826200",
      "displayedTokens": "826200",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 61,
      "sourceRows": [
        61
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7"
      ]
    },
    "1080p|1:1|11": {
      "tokens": "923400",
      "displayedTokens": "923400",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 62,
      "sourceRows": [
        62
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8"
      ]
    },
    "1080p|1:1|12": {
      "tokens": "972000",
      "displayedTokens": "972000",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 63,
      "sourceRows": [
        63
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8"
      ]
    },
    "1080p|1:1|13": {
      "tokens": "1069200",
      "displayedTokens": "1069200",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 64,
      "sourceRows": [
        64
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9"
      ]
    },
    "1080p|1:1|14": {
      "tokens": "1166400",
      "displayedTokens": "1166400",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 65,
      "sourceRows": [
        65
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10"
      ]
    },
    "1080p|1:1|15": {
      "tokens": "1215000",
      "displayedTokens": "1215000",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 66,
      "sourceRows": [
        66
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10"
      ]
    },
    "1080p|1:1|16": {
      "tokens": "1312200",
      "displayedTokens": "1312200",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 67,
      "sourceRows": [
        67
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11"
      ]
    },
    "1080p|1:1|17": {
      "tokens": "1409400",
      "displayedTokens": "1409400",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 68,
      "sourceRows": [
        68
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12"
      ]
    },
    "1080p|1:1|18": {
      "tokens": "1458000",
      "displayedTokens": "1458000",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 69,
      "sourceRows": [
        69
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12"
      ]
    },
    "1080p|1:1|19": {
      "tokens": "1555200",
      "displayedTokens": "1555200",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 70,
      "sourceRows": [
        70
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13"
      ]
    },
    "1080p|1:1|20": {
      "tokens": "1652400",
      "displayedTokens": "1652400",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 71,
      "sourceRows": [
        71
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14"
      ]
    },
    "1080p|1:1|21": {
      "tokens": "1701000",
      "displayedTokens": "1701000",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 72,
      "sourceRows": [
        72
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14"
      ]
    },
    "1080p|1:1|22": {
      "tokens": "1798200",
      "displayedTokens": "1798200",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 73,
      "sourceRows": [
        73
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15"
      ]
    },
    "1080p|1:1|23": {
      "tokens": "1895400",
      "displayedTokens": "1895400",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 74,
      "sourceRows": [
        74
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16"
      ]
    },
    "1080p|1:1|24": {
      "tokens": "1944000",
      "displayedTokens": "1944000",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 75,
      "sourceRows": [
        75
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16"
      ]
    },
    "1080p|1:1|25": {
      "tokens": "2041200",
      "displayedTokens": "2041200",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 76,
      "sourceRows": [
        76
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17"
      ]
    },
    "1080p|1:1|26": {
      "tokens": "2138400",
      "displayedTokens": "2138400",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 77,
      "sourceRows": [
        77
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18"
      ]
    },
    "1080p|1:1|27": {
      "tokens": "2187000",
      "displayedTokens": "2187000",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 78,
      "sourceRows": [
        78
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18"
      ]
    },
    "1080p|1:1|28": {
      "tokens": "2284200",
      "displayedTokens": "2284200",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 79,
      "sourceRows": [
        79
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19"
      ]
    },
    "1080p|1:1|29": {
      "tokens": "2381400",
      "displayedTokens": "2381400",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 80,
      "sourceRows": [
        80
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19",
        "20"
      ]
    },
    "1080p|1:1|30": {
      "tokens": "2430000",
      "displayedTokens": "2430000",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 81,
      "sourceRows": [
        81
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19",
        "20"
      ]
    },
    "1080p|21:9|4": {
      "tokens": "342378.09375",
      "displayedTokens": "342378",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 82,
      "sourceRows": [
        82
      ],
      "minimizingInputSeconds": [
        "2",
        "3"
      ]
    },
    "1080p|21:9|5": {
      "tokens": "440200.40625",
      "displayedTokens": "440200",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 83,
      "sourceRows": [
        83
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4"
      ]
    },
    "1080p|21:9|6": {
      "tokens": "489111.5625",
      "displayedTokens": "489112",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 84,
      "sourceRows": [
        84
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4"
      ]
    },
    "1080p|21:9|7": {
      "tokens": "586933.875",
      "displayedTokens": "586934",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 85,
      "sourceRows": [
        85
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5"
      ]
    },
    "1080p|21:9|8": {
      "tokens": "684756.1875",
      "displayedTokens": "684756",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 86,
      "sourceRows": [
        86
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6"
      ]
    },
    "1080p|21:9|9": {
      "tokens": "733667.34375",
      "displayedTokens": "733667",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 87,
      "sourceRows": [
        87
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6"
      ]
    },
    "1080p|21:9|10": {
      "tokens": "831489.65625",
      "displayedTokens": "831490",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 88,
      "sourceRows": [
        88
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7"
      ]
    },
    "1080p|21:9|11": {
      "tokens": "929311.96875",
      "displayedTokens": "929312",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 89,
      "sourceRows": [
        89
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8"
      ]
    },
    "1080p|21:9|12": {
      "tokens": "978223.125",
      "displayedTokens": "978223",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 90,
      "sourceRows": [
        90
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8"
      ]
    },
    "1080p|21:9|13": {
      "tokens": "1076045.4375",
      "displayedTokens": "1076045",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 91,
      "sourceRows": [
        91
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9"
      ]
    },
    "1080p|21:9|14": {
      "tokens": "1173867.75",
      "displayedTokens": "1173868",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 92,
      "sourceRows": [
        92
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10"
      ]
    },
    "1080p|21:9|15": {
      "tokens": "1222778.90625",
      "displayedTokens": "1222779",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 93,
      "sourceRows": [
        93
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10"
      ]
    },
    "1080p|21:9|16": {
      "tokens": "1320601.21875",
      "displayedTokens": "1320601",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 94,
      "sourceRows": [
        94
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11"
      ]
    },
    "1080p|21:9|17": {
      "tokens": "1418423.53125",
      "displayedTokens": "1418424",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 95,
      "sourceRows": [
        95
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12"
      ]
    },
    "1080p|21:9|18": {
      "tokens": "1467334.6875",
      "displayedTokens": "1467335",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 96,
      "sourceRows": [
        96
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12"
      ]
    },
    "1080p|21:9|19": {
      "tokens": "1565157",
      "displayedTokens": "1565157",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 97,
      "sourceRows": [
        97
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13"
      ]
    },
    "1080p|21:9|20": {
      "tokens": "1662979.3125",
      "displayedTokens": "1662979",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 98,
      "sourceRows": [
        98
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14"
      ]
    },
    "1080p|21:9|21": {
      "tokens": "1711890.46875",
      "displayedTokens": "1711890",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 99,
      "sourceRows": [
        99
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14"
      ]
    },
    "1080p|21:9|22": {
      "tokens": "1809712.78125",
      "displayedTokens": "1809713",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 100,
      "sourceRows": [
        100
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15"
      ]
    },
    "1080p|21:9|23": {
      "tokens": "1907535.09375",
      "displayedTokens": "1907535",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 101,
      "sourceRows": [
        101
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16"
      ]
    },
    "1080p|21:9|24": {
      "tokens": "1956446.25",
      "displayedTokens": "1956446",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 102,
      "sourceRows": [
        102
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16"
      ]
    },
    "1080p|21:9|25": {
      "tokens": "2054268.5625",
      "displayedTokens": "2054269",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 103,
      "sourceRows": [
        103
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17"
      ]
    },
    "1080p|21:9|26": {
      "tokens": "2152090.875",
      "displayedTokens": "2152091",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 104,
      "sourceRows": [
        104
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18"
      ]
    },
    "1080p|21:9|27": {
      "tokens": "2201002.03125",
      "displayedTokens": "2201002",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 105,
      "sourceRows": [
        105
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18"
      ]
    },
    "1080p|21:9|28": {
      "tokens": "2298824.34375",
      "displayedTokens": "2298824",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 106,
      "sourceRows": [
        106
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19"
      ]
    },
    "1080p|21:9|29": {
      "tokens": "2396646.65625",
      "displayedTokens": "2396647",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 107,
      "sourceRows": [
        107
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19",
        "20"
      ]
    },
    "1080p|21:9|30": {
      "tokens": "2445557.8125",
      "displayedTokens": "2445558",
      "sourceFile": "evidence/2026-10-20/models/minimum-1080p.clipboard.json",
      "sourceTable": "tblheIYDXXwYM43b",
      "sourceView": "vewdDcyFjS",
      "sourceField": "fld0p1bMiB",
      "sourceRow": 108,
      "sourceRows": [
        108
      ],
      "minimizingInputSeconds": [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19",
        "20"
      ]
    }
  }
};
root.ReelayModelMinimumSnapshot=snapshot;
if(typeof module!=='undefined')module.exports=snapshot;
})(typeof window!=='undefined'?window:globalThis);
