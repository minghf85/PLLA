import MeCab
mecab = MeCab.Tagger ("-Ochasen")
print(mecab.parse("MeCabを用いて文章を分割してみます。"))
