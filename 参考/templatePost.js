const templatePostParsedTree = [
  {
    "type": "h1",
    "children": [
      {
        "type": "text",
        "text": "一级标题"
      },
      {
        "type": "a",
        "children": [
          {
            "type": "text",
            "text": "链接"
          }
        ],
        "href": "/a8c83cfad753461585db3f063c24c13d?pvs=25"
      }
    ]
  },
  {
    "type": "h2",
    "children": [
      {
        "type": "text",
        "text": "二级标题"
      }
    ]
  },
  {
    "type": "h3",
    "children": [
      {
        "type": "text",
        "text": "三级标题"
      }
    ]
  },
  {
    "type": "p",
    "children": [
      {
        "type": "text",
        "text": "这里是正文，"
      },
      {
        "type": "a",
        "children": [
          {
            "type": "text",
            "text": "链接"
          }
        ],
        "href": "http://www.baidu.com/"
      },
      {
        "type": "text",
        "text": "会生成脚注，重点请"
      },
      {
        "type": "bold",
        "children": [
          {
            "type": "text",
            "text": "加粗，"
          }
        ]
      },
      {
        "type": "italic",
        "children": [
          {
            "type": "text",
            "text": "斜体，"
          }
        ]
      },
      {
        "type": "text",
        "text": "代码"
      },
      {
        "type": "p",
        "children": [
          {
            "type": "text",
            "text": "缩进"
          }
        ]
      }
    ]
  },
  {
    "type": "quote",
    "children": [
      {
        "type": "p",
        "children": [
          {
            "type": "text",
            "text": "这里是"
          },
          {
            "type": "bold",
            "children": [
              {
                "type": "text",
                "text": "引用"
              }
            ]
          }
        ]
      },
      {
        "type": "p",
        "children": [
          {
            "type": "text",
            "text": "拖进去的"
          }
        ]
      }
    ]
  },
  {
    "type": "callout",
    "children": [
      {
        "type": "text",
        "text": "💡"
      },
      {
        "type": "p",
        "children": [
          {
            "type": "text",
            "text": "这里是callout，搭配emoji，可以写一些摘要总结"
          }
        ]
      }
    ]
  },
  {
    "type": "p",
    "children": []
  },
  {
    "type": "code",
    "children": [
      {
        "type": "text",
        "text": "public"
      },
      {
        "type": "text",
        "text": " "
      },
      {
        "type": "text",
        "text": "static"
      },
      {
        "type": "text",
        "text": " "
      },
      {
        "type": "text",
        "text": "void"
      },
      {
        "type": "text",
        "text": " "
      },
      {
        "type": "text",
        "text": "main"
      },
      {
        "type": "text",
        "text": "("
      },
      {
        "type": "text",
        "text": "String"
      },
      {
        "type": "text",
        "text": "["
      },
      {
        "type": "text",
        "text": "]"
      },
      {
        "type": "text",
        "text": " agrs"
      },
      {
        "type": "text",
        "text": ")"
      },
      {
        "type": "text",
        "text": " "
      },
      {
        "type": "text",
        "text": "{"
      },
      {
        "type": "text",
        "text": "\n\t"
      },
      {
        "type": "text",
        "text": "System"
      },
      {
        "type": "text",
        "text": "."
      },
      {
        "type": "text",
        "text": "out"
      },
      {
        "type": "text",
        "text": "."
      },
      {
        "type": "text",
        "text": "println"
      },
      {
        "type": "text",
        "text": "("
      },
      {
        "type": "text",
        "text": "\"hello world\""
      },
      {
        "type": "text",
        "text": ")"
      },
      {
        "type": "text",
        "text": ";"
      },
      {
        "type": "text",
        "text": "\n"
      },
      {
        "type": "text",
        "text": "}"
      },
      {
        "type": "text",
        "text": "\n"
      }
    ]
  },
  {
    "type": "p",
    "children": []
  },
  {
    "type": "p",
    "children": [
      {
        "type": "text",
        "text": "分割线"
      }
    ]
  },
  {
    "type": "divider"
  },
  {
    "type": "p",
    "children": []
  },
  {
    "type": "ol",
    "children": [
      {
        "type": "li",
        "children": [
          {
            "type": "text",
            "text": "有序列表一"
          }
        ]
      },
      {
        "type": "ol",
        "children": [
          {
            "type": "li",
            "children": [
              {
                "type": "text",
                "text": "有序列表一/一"
              }
            ]
          },
          {
            "type": "li",
            "children": [
              {
                "type": "text",
                "text": "有序列表一/二"
              }
            ]
          }
        ],
        "olLevel": 1
      },
      {
        "type": "li",
        "children": [
          {
            "type": "text",
            "text": "代码"
          }
        ]
      }
    ],
    "olLevel": 0
  },
  {
    "type": "code",
    "children": [
      {
        "type": "text",
        "text": "echo"
      },
      {
        "type": "text",
        "text": " "
      },
      {
        "type": "text",
        "text": "'hello'"
      },
      {
        "type": "text",
        "text": "\n"
      }
    ]
  },
  {
    "type": "ol",
    "children": [
      {
        "type": "li",
        "children": [
          {
            "type": "text",
            "text": "有序列表二"
          }
        ]
      }
    ],
    "olLevel": 0
  },
  {
    "type": "p",
    "children": []
  },
  {
    "type": "ul",
    "children": [
      {
        "type": "li",
        "children": [
          {
            "type": "text",
            "text": "无序"
          },
          {
            "type": "bold",
            "children": [
              {
                "type": "text",
                "text": "列表"
              }
            ]
          },
          {
            "type": "text",
            "text": "一"
          }
        ]
      },
      {
        "type": "ul",
        "children": [
          {
            "type": "li",
            "children": [
              {
                "type": "text",
                "text": "无序列表一/一"
              }
            ]
          },
          {
            "type": "ul",
            "children": [
              {
                "type": "li",
                "children": [
                  {
                    "type": "text",
                    "text": "无序列表一/一/一"
                  }
                ]
              }
            ],
            "ulLevel": 2
          }
        ],
        "ulLevel": 1
      },
      {
        "type": "li",
        "children": [
          {
            "type": "text",
            "text": "无序列表二"
          }
        ]
      }
    ],
    "ulLevel": 0
  },
  {
    "type": "table",
    "children": [
      {
        "type": "tr",
        "children": [
          {
            "type": "td",
            "children": [
              {
                "type": "text",
                "text": "Notion Converter"
              },
              {
                "type": "bold",
                "children": [
                  {
                    "type": "text",
                    "text": "功能"
                  }
                ]
              },
              {
                "type": "text",
                "text": "特点"
              }
            ]
          }
        ]
      },
      {
        "type": "tr",
        "children": [
          {
            "type": "td",
            "children": [
              {
                "type": "text",
                "text": "无需"
              },
              {
                "type": "bold",
                "children": [
                  {
                    "type": "text",
                    "text": "登录"
                  }
                ]
              },
              {
                "type": "text",
                "text": "集成Notion"
              }
            ]
          }
        ]
      },
      {
        "type": "tr",
        "children": [
          {
            "type": "td",
            "children": [
              {
                "type": "text",
                "text": "丰富的主题"
              }
            ]
          }
        ]
      },
      {
        "type": "tr",
        "children": [
          {
            "type": "td",
            "children": [
              {
                "type": "text",
                "text": "无缝接入Notion"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "type": "image",
    "children": [
      {
        "type": "image",
        "href": "/image/https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F946185de-71d8-4234-b507-c61cb804f99b%2F28f6aae1-dcbf-4bd5-b02b-73c9e0a3cdab%2FChrome%25E6%258F%2592%25E4%25BB%25B6%25E9%25A1%25B5%25E9%25A2%2584%25E8%25A7%2588%25E5%259B%25BE.jpg?table=block&id=51714e4f-4927-4187-9afa-788d1357eada&spaceId=946185de-71d8-4234-b507-c61cb804f99b&width=2000&userId=aac5b98d-029c-4e1c-a0d0-d3c8a7f8d60d&cache=v2"
      },
      {
        "type": "text",
        "text": "caption"
      }
    ]
  },
  {
    "type": "columnList",
    "children": [
      {
        "type": "columnBlock",
        "children": [
          {
            "type": "bookmark",
            "children": [
              {
                "type": "a",
                "href": "https://notionconverter.com/"
              },
              {
                "type": "text",
                "text": "Notion Converter - 专业的Notion到微信公众号的排版工具"
              },
              {
                "type": "text",
                "text": "Notion Converter是一款专业高效的chrome插件，可以将Notion文章一键排版，并转换为微信公众号文章，拥有多种主题可以选择，同时还支持复制到Markdown."
              },
              {
                "type": "text",
                "text": "https://notionconverter.com/"
              }
            ]
          }
        ]
      },
      {
        "type": "columnBlock",
        "children": [
          {
            "type": "bookmark",
            "children": [
              {
                "type": "a",
                "href": "https://blog.zshnb.com/2023-12-04-notion-converter-annual.html"
              },
              {
                "type": "text",
                "text": "Notion Converter一周年"
              },
              {
                "type": "text",
                "text": "Notion Converter一周年时间飞快，Notion Converter插件从距离写下第一行代码到现在，正好过了一周年，今天就在一周年纪念日写一篇文章回顾一下吧。"
              },
              {
                "type": "text",
                "text": "https://blog.zshnb.com/2023-12-04-notion-converter-annual.html"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "type": "p",
    "children": []
  }
]