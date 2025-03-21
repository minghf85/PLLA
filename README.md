```
"佐藤": {
                    "T_lang": "ja",
                    "prompt": "你是一个日语学习伙伴，帮助我学习日语。",#人物设定
                    "referance": "",#参考知识库
                    "scene": "default",#场景
                    "speed": 1.0,
                    "voice_engine": "RealtimeTTS",
                    "icon": "./assets/avatars/default_avatar.png",
                    "tile": {
                        "position": "translate3d(120px, 600px, 0px)",
                        "size": "1x1"
                    }
                },
```

<ruby>
  漢<rp>(</rp><rt>かん</rt><rp>)</rp>
  字<rp>(</rp><rt>じ</rt><rp>)</rp>
は<rp>(</rp><rt></rt><rp>)</rp>
日<rp>(</rp><rt>に</rt><rp>)</rp>
本<rp>(</rp><rt>ほん</rt><rp>)</rp>
語<rp>(</rp><rt>ご</rt><rp>)</rp>
の<rp>(</rp><rt></rt><rp>)</rp>
文<rp>(</rp><rt>ぶん</rt><rp>)</rp>
字<rp>(</rp><rt>じ</rt><rp>)</rp>
です。
</ruby>

# Markdown 展示示例

这是一段普通文本，展示基本的 *斜体* 和 **粗体** 效果。
## 代码示例
\`\`\`python
def hello_world():
    print("你好，世界！")
    return True
\`\`\`

#### 通过 Markdown 解析达到注释效果

[//]: (这是一段被注释掉的文字)

这是一段没有被注释的文字
这是一段文本，将鼠标放到<span title="这是一个提示说明"><u>这段文字</u></span>上查看提示。
<ruby>日本語 <rp>(</rp><rt>にほんご</rt><rp>)</rp></ruby>を<ruby>勉強 <rp>(</rp><rt>べんきょう</rt><rp>)</rp></ruby>しています。

## 列表示例
- 无序列表项 1
- 无序列表项 2
  - 嵌套列表项
  - 另一个嵌套项

1. 有序列表项 1
2. 有序列表项 2

## 引用和高亮
> 这是一段引用文本
> 可以有多行

这段文本包含 `行内代码` 和 ==高亮文本==

## 表格示例
| 功能 | 说明 |
|------|------|
| 粗体 | **文本** |
| 斜体 | *文本* |
| 代码 | \`代码\` |

## 特殊标记
- ✅ 已完成任务
- ❌ 未完成任务
- ⚠️ 警告信息
- 💡 提示信息

## 数学公式
当 $a \ne 0$ 时，方程 $ax^2 + bx + c = 0$ 有两个解：
$$x = {-b \pm \sqrt{b^2-4ac} \over 2a}$$
---
<details>
  <summary>分析</summary>
  此处可书写文本
  嗯，是可以书写文本的
</details>

为句子语法和特殊词语做说明以及注音，输出格式为
<details>
    <summary>分析</summary>
    [语法分析]
    [特殊词语注音以及解释]
</details>

<details>
  <summary>翻译</summary>
  [翻译内容]
  
  注释：
  [如有必要，在这里添加翻译说明]
</details>