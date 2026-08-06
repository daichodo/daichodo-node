# バージョニング / Versioning

## 日本語

### タグがバージョンを決めます

公開バージョンは Git タグから決まります。`package.json` や `pyproject.toml` の
バージョンはプレースホルダであり、手動で更新しません。

パッケージごとにタグの接頭辞が異なります。

```bash
git tag validate-v0.1.0 && git push origin validate-v0.1.0   # バリデータのみ
git tag client-v0.1.0   && git push origin client-v0.1.0     # クライアントのみ
```

CI がタグからバージョンを読み取り、各パッケージに書き込んでから公開します。
バージョンの更新忘れは最も多いリリース失敗であり、しかもビルドとテストが通った
最後の段階で「そのバージョンは既に存在します」として現れます。タグは一度しか
存在できないため、この衝突は起こり得なくなります。

### パッケージは独立してリリースされます

バリデータは単体で有用ですが、クライアントは API の稼働が前提です。両者を同時に
公開すると、動作しないクライアントがレジストリに残ります。npm も PyPI も
バージョン番号の再利用を認めないため、この誤りは取り消せません。

### SDK のバージョンは API のバージョンと連動しません

SDK はクライアントです。メジャーバージョンが上がるのは **クライアントの互換性が
壊れるとき** であり、API にエンドポイントが追加されたときではありません。API への
追加は SDK にとって非破壊的変更です。

---

## English

### The tag decides the version

Published versions come from the Git tag. The versions in `package.json` and
`pyproject.toml` are placeholders and are never bumped by hand.

Each package has its own tag prefix:

```bash
git tag validate-v0.1.0 && git push origin validate-v0.1.0   # validator only
git tag client-v0.1.0   && git push origin client-v0.1.0     # client only
```

CI reads the version from the tag, writes it into each manifest, then publishes.

Forgetting to bump a manifest is the most common release failure, and it
surfaces at the worst moment: as a duplicate-version rejection after the build
and tests have already passed. A git tag can only exist once, so the collision
becomes impossible rather than merely unlikely.

It matters more for the Python packages, where the generated client's version
comes from `generator-config.yml` — a hand-edited `pyproject.toml` would be
overwritten on the next schema change.

### Packages release independently

The validator is useful on its own; the client is only useful once the API is
deployed. Publishing them together would leave a client on the registry that
cannot work — and neither npm nor PyPI allows a version number to be reused, so
that mistake cannot be undone.

Their version numbers are therefore unrelated to each other.

### SDK versions are independent of the API version

The SDK is a client. Its major version changes when **the client's interface
breaks**, not when the API adds an endpoint — an addition upstream is a
non-breaking change downstream.

Conversely, a purely cosmetic regeneration (a generator upgrade changing
formatting) does not need a release at all. Tag when there is something a
consumer would want.
